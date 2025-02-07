import express from 'express';
import {
  createService,
  getAllServices,
  getServicesByShopId,
  getServiceById,
  updateService,
  deleteService
} from '../controllers/services.controller';

const router = express.Router();

router.post('/createServices', createService);
router.get('/getAllServices', getAllServices);
router.get('/getServiceByShop/:shopId', getServicesByShopId);
router.get('/getServiceById/:id', getServiceById);
router.put('/updateService/:id', updateService);
router.delete('/deleteService/:id', deleteService);

export default router;