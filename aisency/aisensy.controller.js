import aisensyService from './aisensy.service.js';
import { EcommerceCatalog, WhatsappWaba, WhatsappFlow } from '../models/index.js';

export const getBusiness = async (req, res) => {
  console.log('[wapi-api Aisensy Controller] Received getBusiness request:', req.query);
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id is required' });
    }
    const result = await aisensyService.getBusiness(user_id);
    console.log('[wapi-api Aisensy Controller] getBusiness success');
    return res.status(200).json(result);
  } catch (error) {
    console.error('[wapi-api Aisensy Controller] getBusiness error:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to get business info',
      error: error.data || error.message
    });
  }
};

export const createBusiness = async (req, res) => {
  console.log('[wapi-api Aisensy Controller] Received request body:', req.body);
  try {
    const result = await aisensyService.createBusiness(req.body);
    console.log('[wapi-api Aisensy Controller] Forwarding success:', result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[wapi-api Aisensy Controller] Forwarding error:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to create Aisensy business',
      error: error.data || error.message
    });
  }
};

export const createProject = async (req, res) => {
  console.log('[wapi-api Aisensy Controller] Received project request body:', req.body);
  try {
    const result = await aisensyService.createProject(req.body);
    console.log('[wapi-api Aisensy Controller] Project creation success:', result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[wapi-api Aisensy Controller] Project creation error:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to create Aisensy project',
      error: error.data || error.message
    });
  }
};

export const getPhoneNumbers = async (req, res) => {
  console.log('[wapi-api Aisensy Controller] Received getPhoneNumbers request:', req.query);
  try {
    const { user_id, projectId } = req.query;
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id is required' });
    }
    const result = await aisensyService.getPhoneNumbers(user_id, projectId);
    console.log('[wapi-api Aisensy Controller] getPhoneNumbers success');
    return res.status(200).json(result);
  } catch (error) {
    console.error('[wapi-api Aisensy Controller] getPhoneNumbers error:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to get phone numbers',
      error: error.data || error.message
    });
  }
};

export const getPhoneNumber = async (req, res) => {
  console.log('[wapi-api Aisensy Controller] Received getPhoneNumber request:', req.query);
  try {
    const { user_id, phoneNumberId, fields, projectId } = req.query;
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id is required' });
    }
    const result = await aisensyService.getPhoneNumber(user_id, phoneNumberId, fields, projectId);
    console.log('[wapi-api Aisensy Controller] getPhoneNumber success');
    return res.status(200).json(result);
  } catch (error) {
    console.error('[wapi-api Aisensy Controller] getPhoneNumber error:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to get phone number',
      error: error.data || error.message
    });
  }
};

export const getDisplayNameStatus = async (req, res) => {
  console.log('[wapi-api Aisensy Controller] Received getDisplayNameStatus request:', req.query);
  try {
    const { user_id, phoneNumberId, projectId } = req.query;
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id is required' });
    }
    const result = await aisensyService.getDisplayNameStatus(user_id, phoneNumberId, projectId);
    console.log('[wapi-api Aisensy Controller] getDisplayNameStatus success');
    return res.status(200).json(result);
  } catch (error) {
    console.error('[wapi-api Aisensy Controller] getDisplayNameStatus error:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to get display name status',
      error: error.data || error.message
    });
  }
};

export const getProjectsByBusiness = async (req, res) => {
  console.log('[wapi-api Aisensy Controller] Received getProjectsByBusiness request:', req.query);
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id is required' });
    }
    const result = await aisensyService.getProjectsByBusiness(user_id);
    console.log('[wapi-api Aisensy Controller] getProjectsByBusiness success');
    return res.status(200).json(result);
  } catch (error) {
    console.error('[wapi-api Aisensy Controller] getProjectsByBusiness error:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to get projects',
      error: error.data || error.message
    });
  }
};

export const sendMessage = async (req, res) => {
  console.log('[wapi-api Aisensy Controller] Received sendMessage request:', req.body);
  try {
    const { to, type, template, text } = req.body;
    if (!to || !type) {
      return res.status(400).json({ success: false, message: 'to and type are required' });
    }
    const result = await aisensyService.sendMessage({ to, type, template, text });
    console.log('[wapi-api Aisensy Controller] sendMessage success');
    return res.status(200).json(result);
  } catch (error) {
    console.error('[wapi-api Aisensy Controller] sendMessage error:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to send message',
      error: error.data || error.message
    });
  }
};

export const createCatalog = async (req, res) => {
  console.log('[wapi-api Aisensy Controller] Received createCatalog request:', req.body);
  try {
    const { vertical, name } = req.body;
    if (!vertical || !name) {
      return res.status(400).json({ success: false, message: 'vertical and name are required' });
    }
    const result = await aisensyService.createCatalog(req.body);
    console.log('[wapi-api Aisensy Controller] createCatalog success');
    return res.status(200).json(result);
  } catch (error) {
    console.error('[wapi-api Aisensy Controller] createCatalog error:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to create catalog',
      error: error.data || error.message
    });
  }
};

export const getFlows = async (req, res) => {
  try {
    const { fields, after, before, limit } = req.query;
    const result = await aisensyService.getFlows({ fields, after, before, limit });
    console.log('[wapi-api Aisensy Controller] getFlows success');
    return res.status(200).json(result);
  } catch (error) {
    console.error('[wapi-api Aisensy Controller] getFlows error:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to fetch flows',
      error: error.data || error.message
    });
  }
};

export const getWhatsappFlows = async (req, res) => {
  try {
    const userId = req.user.owner_id;
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let flows = await WhatsappFlow.find({
      user_id: userId,
      deleted_at: null
    })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // If no flows in DB, sync from AiSensy
    if (flows.length === 0) {
      try {
        console.log('[getWhatsappFlows] No flows in DB, trying AiSensy sync');
        const aisensyResult = await aisensyService.getFlows();
        const flowItems = aisensyResult.products || aisensyResult.data?.products || aisensyResult.flows || aisensyResult.data?.flows || [];
        const items = Array.isArray(flowItems) ? flowItems : (flowItems ? [flowItems] : []);

        for (const item of items) {
          const existing = await WhatsappFlow.findOne({ flow_id: item.id, user_id: userId });
          if (!existing) {
            await WhatsappFlow.create({
              user_id: userId,
              flow_id: item.id,
              name: item.name,
              categories: item.categories || [],
              status: item.status || 'DRAFT',
              preview_url: item.preview?.preview_url || '',
              preview_expires_at: item.preview?.expires_at ? new Date(item.preview.expires_at) : null,
              json_version: item.json_version || '',
              validation_errors: item.validation_errors || [],
              whatsapp_business_account_id: item.whatsapp_business_account?.id || '',
              whatsapp_business_account_name: item.whatsapp_business_account?.name || '',
              application_name: item.application?.name || '',
              application_id: item.application?.id || '',
              meta_data: item,
              is_active: true
            });
          }
        }

        // Re-fetch from DB after sync
        let query = { user_id: userId, deleted_at: null };
        if (status) query.status = status;
        if (search) {
          query.name = { $regex: search, $options: 'i' };
        }

        flows = await WhatsappFlow.find(query)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean();
        console.log('[getWhatsappFlows] Synced', flows.length, 'flows from AiSensy');
      } catch (syncError) {
        console.error('[getWhatsappFlows] AiSensy sync failed:', syncError.message);
      }
    }

    const total = await WhatsappFlow.countDocuments({ user_id: userId, deleted_at: null });

    return res.json({
      success: true,
      data: flows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('[getWhatsappFlows] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get WhatsApp flows',
      error: error.data || error.message
    });
  }
};

export const createWaTemplate = async (req, res) => {
  try {
    const { name, category, language, components } = req.body;
    if (!name || !category || !language || !components) {
      return res.status(400).json({ success: false, message: 'name, category, language, and components are required' });
    }
    const result = await aisensyService.createWaTemplate(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[wapi-api Aisensy Controller] createWaTemplate error:', error.message);
    return res.status(error.status || 500).json({ success: false, message: error.message, error: error.data || error.message });
  }
};

export const getTemplates = async (req, res) => {
  try {
    const result = await aisensyService.getTemplates(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[wapi-api Aisensy Controller] getTemplates error:', error.message);
    return res.status(error.status || 500).json({ success: false, message: error.message, error: error.data || error.message });
  }
};

export const getTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const result = await aisensyService.getTemplate(templateId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[wapi-api Aisensy Controller] getTemplate error:', error.message);
    return res.status(error.status || 500).json({ success: false, message: error.message, error: error.data || error.message });
  }
};

export const editTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const result = await aisensyService.editTemplate(templateId, req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[wapi-api Aisensy Controller] editTemplate error:', error.message);
    return res.status(error.status || 500).json({ success: false, message: error.message, error: error.data || error.message });
  }
};

export const deleteWaTemplate = async (req, res) => {
  try {
    const { name, hsm_id } = req.query;
    if (!name && !hsm_id) {
      return res.status(400).json({ success: false, message: 'name or hsm_id is required' });
    }
    const result = await aisensyService.deleteWaTemplate(name, hsm_id);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[wapi-api Aisensy Controller] deleteWaTemplate error:', error.message);
    return res.status(error.status || 500).json({ success: false, message: error.message, error: error.data || error.message });
  }
};

export const submitFacebookAccessToken = async (req, res) => {
  console.log('[wapi-api Aisensy Controller] Received submitFacebookAccessToken request:', req.body);
  try {
    const result = await aisensyService.submitFacebookAccessToken(req.body);
    console.log('[wapi-api Aisensy Controller] submitFacebookAccessToken success:', result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[wapi-api Aisensy Controller] submitFacebookAccessToken error:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to submit Facebook access token',
      error: error.data || error.message
    });
  }
};

export const getCatalog = async (req, res) => {
  console.log('[wapi-api Aisensy Controller] Received getCatalog request:', req.query);
  try {
    const userId = req.user.owner_id;
    const { waba_id, before, after, fields } = req.query;

    let targetWabaId = waba_id;
    if (!targetWabaId) {
      const waba = await WhatsappWaba.findOne({
        user_id: userId,
        deleted_at: null
      }).select('_id').lean();
      if (waba) targetWabaId = waba._id.toString();
    }

    const aisensyResult = await aisensyService.getCatalog({ before, after, fields });
    console.log('[wapi-api Aisensy Controller] getCatalog success');

    // Sync catalogs to DB like workspace fetching pattern
    let catalogs = [];
    const catalogData = aisensyResult.catalogs || aisensyResult.catalog || aisensyResult.data?.catalogs || aisensyResult.data?.catalog || aisensyResult;
    const catalogsArray = Array.isArray(catalogData) ? catalogData : (catalogData ? [catalogData] : []);

    if (targetWabaId && catalogsArray.length > 0) {
      const existingCatalogs = await EcommerceCatalog.find({
        user_id: userId,
        deleted_at: null
      }).lean();
      const existingIds = new Set(existingCatalogs.map(c => c.catalog_id));

      for (const catalog of catalogsArray) {
        if (!existingIds.has(catalog.id)) {
          try {
            const newCatalog = await EcommerceCatalog.create({
              user_id: userId,
              waba_id: targetWabaId,
              catalog_id: catalog.id,
              name: catalog.name,
              currency: catalog.currency || 'USD',
              country: catalog.country || 'US',
              is_linked: catalog.is_linked || false,
              is_active: true,
              meta_data: catalog
            });
            existingCatalogs.push(newCatalog.toObject());
            existingIds.add(catalog.id);
            console.log('[wapi-api Aisensy Controller] Created catalog in DB:', catalog.name);
          } catch (dbError) {
            console.error('[wapi-api Aisensy Controller] DB create error for catalog:', catalog.id, dbError.message);
          }
        }
      }
      catalogs = existingCatalogs;
    } else {
      catalogs = catalogsArray;
    }

    return res.status(200).json({
      success: true,
      data: aisensyResult,
      catalogs: catalogs
    });
  } catch (error) {
    console.error('[wapi-api Aisensy Controller] getCatalog error:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to fetch catalogs',
      error: error.data || error.message
    });
  }
};
