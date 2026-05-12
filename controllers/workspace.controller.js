import { Workspace, WhatsappWaba } from '../models/index.js';
import aisensyService from '../aisency/aisensy.service.js';

export const createWorkspace = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Workspace name is required'
            });
        }

        const workspace = await Workspace.create({
            user_id: req.user.owner_id,
            created_by: req.user.id,
            name,
            description
        });

        try {
            const aisensyProjectResult = await aisensyService.createProject({
                user_id: req.user.owner_id.toString(),
                name: name
            });
            console.log('[Workspace Controller] Aisensy project created:', aisensyProjectResult);
        } catch (aisensyError) {
            console.error('[Workspace Controller] Aisensy project creation failed (non-blocking):', aisensyError.message);
        }

        return res.status(201).json({
            success: true,
            data: workspace
        });
    } catch (error) {
        console.error('Error creating workspace:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create workspace',
            details: error.message
        });
    }
};

export const getWorkspaces = async (req, res) => {
    try {
        const userId = req.user.owner_id;
        let workspaces = await Workspace.find({
            user_id: userId,
            deleted_at: null
        }).sort({ createdAt: -1 }).lean();

        // Sync workspaces from AiSensy projects
        try {
            const aisensyResult = await aisensyService.getProjectsByBusiness(
                userId.toString(),
                req.user.email || null
            );
            if (aisensyResult.success && aisensyResult.projects?.length > 0) {
                const existingNames = new Set(workspaces.map(ws => ws.name));
                for (const project of aisensyResult.projects) {
                    if (!existingNames.has(project.name)) {
                        const newWs = await Workspace.create({
                            user_id: userId,
                            created_by: req.user.id,
                            name: project.name,
                            description: `Synced from AiSensy project (${project.id})`
                        });
                        workspaces.push(newWs.toObject());
                        existingNames.add(project.name);
                        console.log('[Workspace Controller] Created workspace from AiSensy project:', project.name);
                    }
                }
            }
        } catch (syncError) {
            console.error('[Workspace Controller] AiSensy workspace sync failed (non-blocking):', syncError.message);
        }

        const connectedWabas = await WhatsappWaba.find({
            user_id: userId,
            workspace_id: { $in: workspaces.map(ws => ws._id) },
            deleted_at: null
        }).lean();

        const result = workspaces.map(ws => {
            const waba = connectedWabas.find(w => w.workspace_id.toString() === ws._id.toString());
            return {
                ...ws,
                waba_id: waba?._id || null,
                connection_status: waba?.connection_status || null,
                waba_type: waba?.provider || null
            };
        });

        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching workspaces:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch workspaces',
            details: error.message
        });
    }
};

export const getWorkspaceById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.owner_id;

        const workspace = await Workspace.findOne({
            _id: id,
            user_id: userId,
            deleted_at: null
        });

        if (!workspace) {
            return res.status(404).json({
                success: false,
                error: 'Workspace not found'
            });
        }

        return res.json({
            success: true,
            data: workspace
        });
    } catch (error) {
        console.error('Error fetching workspace:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch workspace',
            details: error.message
        });
    }
};

export const updateWorkspace = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_active } = req.body;

        const workspace = await Workspace.findOneAndUpdate(
            { _id: id, user_id: req.user.owner_id, deleted_at: null },
            { name, description, is_active },
            { returnDocument: 'after', runValidators: true }
        );

        if (!workspace) {
            return res.status(404).json({
                success: false,
                error: 'Workspace not found'
            });
        }

        return res.json({
            success: true,
            data: workspace
        });
    } catch (error) {
        console.error('Error updating workspace:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update workspace',
            details: error.message
        });
    }
};

export const deleteWorkspace = async (req, res) => {
    try {
        const { id } = req.params;

        const workspace = await Workspace.findOneAndUpdate(
            { _id: id, user_id: req.user.owner_id, deleted_at: null },
            { deleted_at: new Date() },
            { returnDocument: 'after' }
        );

        if (!workspace) {
            return res.status(404).json({
                success: false,
                error: 'Workspace not found'
            });
        }

        const existingWabas = await WhatsappWaba.find({ workspace_id: id });
        if (existingWabas.length > 0) {
            const wabaIds = existingWabas.map(w => w._id);
            await WhatsappPhoneNumber.deleteMany({ waba_id: { $in: wabaIds } });
            await WhatsappWaba.deleteMany({ _id: { $in: wabaIds } });
        }


        return res.json({
            success: true,
            message: 'Workspace deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting workspace:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete workspace',
            details: error.message
        });
    }
};

export const getConnectedWorkspaces = async (req, res) => {
    try {
        const userId = req.user.owner_id;

        const connectedWabas = await WhatsappWaba.find({
            user_id: userId,
            workspace_id: { $exists: true, $ne: null },
            deleted_at: null
        }).select('workspace_id whatsapp_business_account_id name').lean();

        if (connectedWabas.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        const workspaceIds = connectedWabas.map(w => w.workspace_id);
        const workspaces = await Workspace.find({
            _id: { $in: workspaceIds },
            deleted_at: null
        }).lean();

        const result = workspaces.map(ws => {
            const waba = connectedWabas.find(w => w.workspace_id.toString() === ws._id.toString());
            return {
                ...ws,
                waba_id: waba ? waba.whatsapp_business_account_id : null,
                waba_db_id: waba ? waba._id : null,
                waba_name: waba ? waba.name : null
            };
        });

        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching connected workspaces:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch connected workspaces',
            details: error.message
        });
    }
};

export default {
    createWorkspace,
    getWorkspaces,
    getWorkspaceById,
    updateWorkspace,
    deleteWorkspace,
    getConnectedWorkspaces
};
