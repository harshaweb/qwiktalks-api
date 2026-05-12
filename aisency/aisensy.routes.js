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
  getWhatsappFlows
} from './aisensy.controller.js';

const router = express.Router();

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

export default router;
