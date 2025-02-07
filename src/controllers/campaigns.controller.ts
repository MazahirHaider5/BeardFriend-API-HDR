import { Request, Response } from 'express';
import Campaign from '../models/campaigns.model';
import BarberShop from '../models/barberShop.model';
import mongoose from 'mongoose';

// Helper function to validate barbershop ownership
async function validateBarberShopOwnership(
    barbershopId: string,
    userId: string
): Promise<{ isValid: boolean; message?: string }> {

    console.log("Validating barbershop ownership...");
    console.log("barbershopId:", barbershopId);
    console.log("userId:", userId);

    const barbershop = await BarberShop.findById(barbershopId);

    if (!barbershop) {
        console.log("Barbershop not found.");
        return { isValid: false, message: "Barbershop not found" };
    }

    if (barbershop.user_id.toString() !== userId.toString() || barbershop.user_role !== 'barber') {
        console.log('barbershop.user_id:', typeof barbershop.user_id, barbershop.user_id);
        console.log('userId:', typeof userId, userId);
        console.log("Ownership validation failed.");
        return { isValid: false, message: "You are not authorized to manage campaigns for this barbershop" };
    }
    console.log("Ownership validation succeeded.");
    return { isValid: true };
}

// Create a new campaign
export const createCampaign = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            campaign_name,
            barbershop_id,
            stamps,
            discount_in_numbers,
            campaign_duration,
            type
        } = req.body;

        // Validate barbershop ownership
        const validationResult = await validateBarberShopOwnership(barbershop_id, req.user?._id as string);
        if (!validationResult.isValid) {
            res.status(403).json({
                success: false,
                message: validationResult.message
            });
            return;
        }

        // Validate date range
        const startDate = new Date(campaign_duration.start_date);
        const endDate = new Date(campaign_duration.end_date);

        if (startDate >= endDate) {
            res.status(400).json({
                success: false,
                message: "End date must be after start date"
            });
            return;
        }

        if (startDate < new Date()) {
            res.status(400).json({
                success: false,
                message: "Start date cannot be in the past"
            });
            return;
        }

        // Validate discount based on type
        if (type === "Free" && discount_in_numbers !== 100) {
            res.status(400).json({
                success: false,
                message: "Free campaigns must have 100% discount"
            });
            return;
        }

        if (type === "Full Price" && discount_in_numbers !== 0) {
            res.status(400).json({
                success: false,
                message: "Full Price campaigns cannot have any discount"
            });
            return;
        }

        const campaign = await Campaign.create({
            campaign_name,
            barbershop_id,
            stamps,
            discount_in_numbers,
            campaign_duration: {
                start_date: startDate,
                end_date: endDate
            },
            type
        });

        res.status(201).json({
            success: true,
            message: "Campaign created successfully",
            data: campaign
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating campaign",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Update campaign
export const updateCampaign = async (req: Request, res: Response): Promise<void> => {
    try {
        const { campaign_name, stamps, discount_in_numbers, campaign_duration, type } = req.body;

        // Get existing campaign
        const existingCampaign = await Campaign.findById(req.params.id);
        if (!existingCampaign) {
            res.status(404).json({ success: false, message: "Campaign not found" });
            return;
        }

        // Validate barbershop ownership
        const validationResult = await validateBarberShopOwnership(existingCampaign.barbershop_id.toString(), req.user?._id as string);
        if (!validationResult.isValid) {
            res.status(403).json({ success: false, message: validationResult.message });
            return;
        }

        // Validate date range if provided
        if (campaign_duration && !validateDateRange(campaign_duration, existingCampaign)) {
            res.status(400).json({ success: false, message: "Invalid date range" });
            return;
        }

        // Validate discount based on type if type is being updated
        if (type && !validateDiscount(type, discount_in_numbers ?? existingCampaign.discount_in_numbers)) {
            res.status(400).json({ success: false, message: "Invalid discount for the campaign type" });
            return;
        }

        const updatedCampaign = await Campaign.findByIdAndUpdate(
            req.params.id,
            { campaign_name, stamps, discount_in_numbers, campaign_duration, type },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, message: "Campaign updated successfully", data: updatedCampaign });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating campaign", error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

function validateDateRange(campaign_duration: any, existingCampaign: any): boolean {
    const startDate = new Date(campaign_duration.start_date);
    const endDate = new Date(campaign_duration.end_date);

    if (startDate >= endDate) return false;

    if (existingCampaign.campaign_duration.start_date > new Date() && normalizeToMidnight(startDate) < normalizeToMidnight(new Date())) {
        return false;
    }

    return true;
}

function normalizeToMidnight(date: any): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function validateDiscount(type: string, discount_in_numbers: number): boolean {
    if (type === "Free" && discount_in_numbers !== 100) return false;
    if (type === "Full Price" && discount_in_numbers !== 0) return false;
    return true;
}

// Delete campaign
export const deleteCampaign = async (req: Request, res: Response): Promise<void> => {
    try {
        const campaign = await Campaign.findById(req.params.id);

        if (!campaign) {
            res.status(404).json({
                success: false,
                message: "Campaign not found"
            });
            return;
        }

        // Validate barbershop ownership
        const validationResult = await validateBarberShopOwnership(
            campaign.barbershop_id.toString(),
            req.user?._id as string
        );
        if (!validationResult.isValid) {
            res.status(403).json({
                success: false,
                message: validationResult.message
            });
            return;
        }

        // Prevent deletion of active campaigns
        const now = new Date();
        if (campaign.campaign_duration.start_date <= now &&
            campaign.campaign_duration.end_date >= now) {
            res.status(400).json({
                success: false,
                message: "Cannot delete an active campaign"
            });
            return;
        }

        await Campaign.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Campaign deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting campaign",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get all campaigns with filtering and pagination
export const getCampaigns = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const filter: any = {};

        if (req.query.barbershop_id) {
            filter.barbershop_id = new mongoose.Types.ObjectId(req.query.barbershop_id as string);
        }

        if (req.query.type) {
            filter.type = req.query.type;
        }

        if (req.query.active === 'true') {
            const now = new Date();
            filter['campaign_duration.start_date'] = { $lte: now };
            filter['campaign_duration.end_date'] = { $gte: now };
        }

        const total = await Campaign.countDocuments(filter);

        const campaigns = await Campaign.find(filter)
            .populate('barbershop_id', 'barbershop_name barbershop_address')
            .skip(skip)
            .limit(limit)
            .sort({ 'campaign_duration.start_date': -1 });

        res.status(200).json({
            success: true,
            data: campaigns,
            pagination: {
                current_page: page,
                total_pages: Math.ceil(total / limit),
                total_items: total,
                items_per_page: limit
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching campaigns",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get single campaign by ID
export const getCampaignById = async (req: Request, res: Response): Promise<void> => {
    try {
        const campaign = await Campaign.findById(req.params.id)
            .populate('barbershop_id', 'barbershop_name barbershop_address');

        if (!campaign) {
            res.status(404).json({
                success: false,
                message: "Campaign not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: campaign
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching campaign",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get active campaigns for a specific barbershop
export const getActiveCampaigns = async (req: Request, res: Response): Promise<void> => {
    try {
        const { barbershop_id } = req.params;
        const now = new Date();

        const campaigns = await Campaign.find({
            barbershop_id,
            'campaign_duration.start_date': { $lte: now },
            'campaign_duration.end_date': { $gte: now }
        }).populate('barbershop_id', 'barbershop_name barbershop_address');

        res.status(200).json({
            success: true,
            data: campaigns
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching active campaigns",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};