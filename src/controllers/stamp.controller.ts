import { Request, Response } from "express";
import { Types } from "mongoose";
import IUser from "../models/users.model";
import BarberShop from "../models/barberShop.model";
import Campaign, {ICampaign} from "../models/campaigns.model";
import Stamp, { IStamp } from "../models/stamps.model";
import generateRandomStampName from "../utils/stampName";

interface IUser {
  stamps?: IStamp[];
  _id: Types.ObjectId;
}

export const createStamp = async (req: Request, res: Response): Promise<void> => {
  const { qr_code, campaign_id } = req.body;

  try {
    const user = await IUser.findOne({ qr_code });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const barberShop = await BarberShop.findOne({ user_id: req.user?.id });
    if (!barberShop) {
      res.status(404).json({ message: "Barber shop not found" });
      return;
    }

    const campaignId = Types.ObjectId.createFromHexString(campaign_id);

    const campaign = await Campaign.findOne({
      _id: campaignId,
      barbershop_id: barberShop._id,
      "campaign_duration.start_date": { $lte: new Date() },
      "campaign_duration.end_date": { $gte: new Date() },
    });

    if (!campaign) {
      res.status(404).json({ message: "No active campaign found for this ID or shop" });
      return;
    }

    if (campaign.barbershop_id.toString() !== barberShop.id.toString()) {
      res.status(403).json({ message: "Barber is not authorized to assign stamps to this campaign" });
      return;
    }

    const userStamps = user.stamps || [];

    if (userStamps.length >= campaign.stamps) {
      const discountMessage =
        campaign.type === "Free"
          ? "Congratulations! You are eligible for a 100% discount."
          : `Congratulations! You are eligible for a discount of ${campaign.discount_in_numbers}%.`;

      res.status(200).json({
        message: discountMessage,
        discount: true,
        discountDetails: {
          type: campaign.type,
          value: campaign.type === "Free" ? 100 : campaign.discount_in_numbers,
        },
      });

      // Reset the user's stamps
      user.stamps = [];
      await user.save();

      return;
    }

    const stamp_name = generateRandomStampName();
    const stamp_expired = new Date() > new Date(campaign.campaign_duration.end_date);

    const newStamp = new Stamp({
      user_id: user._id,
      barbershop_id: barberShop._id,
      stamp_name,
      campaign_id: campaignId,
      required_stamps: campaign.stamps,
      stamp_expired,
    });

    await newStamp.save();

    if (!user.stamps) {
      user.stamps = [];
    }

    user.stamps.push({
      stamp_id: Types.ObjectId.createFromHexString(newStamp.id),
      stamp_name: newStamp.stamp_name,
      created_at: new Date(),
      campaign_id: campaignId,
      campaign_name: campaign.campaign_name,
      barbershop_id: Types.ObjectId.createFromHexString(barberShop.id),
      barbershop_name: barberShop.barbershop_name,
      stamp_expired,

      
    });

    await user.save();

    res.status(201).json({
      message: "Stamp created successfully",
      stamp: newStamp,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getUserStamps = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const stamps = await Stamp.find({ user_id: userId })
      .populate("campaign_id", "campaign_name campaign_duration")
      .populate("barbershop_id", "barbershop_name") 
      .select("_id stamp_name createdAt campaign_id barbershop_id stamp_expired");

    const currentDate = new Date();

    const updatedStamps = stamps.map((stampDoc) => {
      const stamp = stampDoc.toObject();

      return {
        stamp_id: stamp._id,
        stamp_name: stamp.stamp_name,
        created_at: stamp.createdAt,
        campaign_id: (stamp.campaign_id as ICampaign)?._id || null,
        campaign_name: (stamp.campaign_id as ICampaign)?.campaign_name || null,
        barbershop_id: stamp.barbershop_id?._id || null,
        barbershop_name: (stamp.barbershop_id as any)?.barbershop_name || null,
        stamp_expired:
          (stamp.campaign_id as ICampaign)?.campaign_duration?.end_date &&
          new Date((stamp.campaign_id as ICampaign).campaign_duration.end_date) < currentDate,
      };
    });

    res.status(200).json({
      success: true,
      message: "Stamps retrieved successfully",
      stamps: updatedStamps,
    });

  } catch (error) {
    console.error("Error retrieving stamps:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving stamps",
      error: (error as Error).message,
    });
  }
};