import mongoose from 'mongoose';

const whatsappFlowSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flow_id: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  categories: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'PAUSED', 'DELETED', 'ARCHIVED'],
    default: 'DRAFT'
  },
  preview_url: {
    type: String,
    default: ''
  },
  preview_expires_at: {
    type: Date,
    default: null
  },
  json_version: {
    type: String,
    default: ''
  },
  validation_errors: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  whatsapp_business_account_id: {
    type: String,
    default: ''
  },
  whatsapp_business_account_name: {
    type: String,
    default: ''
  },
  application_name: {
    type: String,
    default: ''
  },
  application_id: {
    type: String,
    default: ''
  },
  meta_data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  is_active: {
    type: Boolean,
    default: true
  },
  deleted_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'whatsapp_flows'
});

whatsappFlowSchema.index({ user_id: 1, flow_id: 1 }, { unique: true });
whatsappFlowSchema.index({ user_id: 1, deleted_at: 1 });
whatsappFlowSchema.index({ user_id: 1, status: 1 });
whatsappFlowSchema.index({ user_id: 1, created_at: -1 });

export default mongoose.model('WhatsappFlow', whatsappFlowSchema);
