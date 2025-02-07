import express from 'express';
import { 
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  getActiveCampaigns
} from '../controllers/campaigns.controller';
import { verifyToken } from "../middleware/authenticate";


const router = express.Router();

// Public routes
router.get('/getCampaigns',verifyToken, getCampaigns);
router.get('/getSingleCampaign/:id',verifyToken, getCampaignById);
router.get('/getActiveCampaign/:barbershop_id',verifyToken, getActiveCampaigns);

// Protected routes (require authentication)
router.post('/createCampaign',verifyToken, createCampaign);
router.put('/updateCampaign/:id',verifyToken, updateCampaign);
router.delete('/deleteCampaign/:id',verifyToken, deleteCampaign);

export default router;