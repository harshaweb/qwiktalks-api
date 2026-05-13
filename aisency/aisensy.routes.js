import express from 'express';
import {
  createBusiness,
  createProject,
  getPhoneNumbers,
  getPhoneNumber,
  getDisplayNameStatus,
  getProjectsByBusiness,
  sendMessage,
  createCatalog,
  getCatalog,
  getFlows,
  getWhatsappFlows,
  createWaTemplate,
  getTemplates,
  getTemplate,
  editTemplate,
  deleteWaTemplate,
  submitFacebookAccessToken,
  getBusiness
} from './aisensy.controller.js';

const router = express.Router();

router.get('/business', getBusiness);
router.post('/create-business', createBusiness);
router.post('/create-project', createProject);
router.get('/phone-numbers', getPhoneNumbers);
router.get('/phone-number', getPhoneNumber);
router.get('/display-name-status', getDisplayNameStatus);
router.get('/projects', getProjectsByBusiness);
router.post('/messages', sendMessage);
router.post('/catalog', createCatalog);
router.get('/catalog', getCatalog);
router.get('/flows', getFlows);
router.get('/whatsapp-flows', getWhatsappFlows);

router.post('/wa-template', createWaTemplate);
router.get('/wa-templates', getTemplates);
router.get('/wa-template/:templateId', getTemplate);
router.post('/wa-template/:templateId', editTemplate);
router.delete('/wa-template', deleteWaTemplate);
router.post('/submit-facebook-access-token', submitFacebookAccessToken);

export default router;
