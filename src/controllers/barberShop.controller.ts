import { Request, Response } from "express";
import mongoose from "mongoose";
import BarberShops from "../models/barberShop.model";

export const createBarberShop = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      user_id,
      user_role,
      barbershop_name,
      barbershop_seats,
      barbershop_address,
      barbershop_about,
      barbershop_languages,
      barbershop_staff,
      barbershop_timing
    } = req.body;

    let parsedBarbershopTiming;
    try {
      const cleanedTiming = barbershop_timing.replace(/^['"]|['"]$/g, "");
      parsedBarbershopTiming = JSON.parse(cleanedTiming);
    } catch (e) {
      res.status(400).json({
        success: false,
        message:
          "Error parsing barbershop_timing. Ensure it's a valid JSON string."
      });
      return;
    }
    let parsedBarbershopStaff;
    try {
      const cleanedStaff = barbershop_staff.replace(/^['"]|['"]$/g, "");
      parsedBarbershopStaff = JSON.parse(cleanedStaff);
    } catch (e) {
      res.status(400).json({
        success: false,
        message:
          "Error parsing barbershop_staff. Ensure it's a valid JSON string."
      });
      return;
    }
    if (
      !Array.isArray(parsedBarbershopStaff) ||
      parsedBarbershopStaff.some((item) => typeof item !== "object")
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid barbershop_staff data. It must be an array of objects."
      });
      return;
    }
    if (
      !user_id ||
      !barbershop_name ||
      !barbershop_seats ||
      !barbershop_address ||
      !parsedBarbershopTiming?.days?.custom_days
    ) {
      res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      res.status(400).json({
        success: false,
        message: "Invalid user_id"
      });
      return;
    }
    const customDays = parsedBarbershopTiming?.days?.custom_days;
    if (!Array.isArray(customDays) || customDays.length === 0) {
      res.status(400).json({
        success: false,
        message: "Invalid Custom Days"
      });
      return;
    }
    const barberShopTimings = {
      days: {
        custom_days: customDays.map(
          (day: {
            day: string;
            opening_time: string;
            closing_time: string;
          }) => ({
            day: day.day,
            opening_time: day.opening_time,
            closing_time: day.closing_time
          })
        )
      }
    };
    const barbershop_images = req.files
      ? (req.files as Express.Multer.File[]).map((file) => file.path)
      : [];
    console.log("Uploaded Images:", barbershop_images);
    const newBarberShop = new BarberShops({
      user_id,
      user_role,
      barbershop_name,
      barbershop_seats,
      barbershop_address,
      barbershop_about,
      barbershop_languages,
      barbershop_images,
      barbershop_staff: parsedBarbershopStaff,
      barbershop_timing: barberShopTimings
    });
    const createdBarberShop = await newBarberShop.save();
    res.status(201).json({
      success: true,
      message: "Barber Shop created successfully",
      shopdetails: createdBarberShop
    });
  } catch (error) {
    console.error("Error occurred while creating barber shop:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while creating barber shop",
      error: (error as Error).message
    });
  }
};

export const getAllBarberShops = async (
  req: Request, res: Response
): Promise<void> => {
  try {
    const barbershops = await BarberShops.find().populate("reviews").populate("services");
    res.status(200).json({
      success: true,
      message: "Barber shops fetched successfully",
      barbershops
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch barber shops",
      error: (error as Error).message
    });
  }
};

// Get BarberShop by ID with associated reviews
export const getBarberShop = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const shopId = req.params.id;

    
    const barbershop = await BarberShops.findById(shopId).populate("reviews").populate("services");

    if (!barbershop) {
      res.status(404).json({
        success: false,
        message: "Barber shop not found"
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Barber shop fetched successfully",
      barbershop
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch barber shop",
      error: (error as Error).message
    });
  }
};

// Update BarberShop
export const updateBarberShop = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const shopId = req.params.id;
    const productToUpdate = await BarberShops.findById(shopId);

    if (!productToUpdate) {
      res.status(404).json({
        success: false,
        message: "Barber shop not found"
      });
      return;
    }

    const {
      user_id,
      user_role,
      barbershop_name,
      barbershop_seats,
      barbershop_address,
      barbershop_about,
      barbershop_languages,
      barbershop_timing,
      barbershop_staff
    } = req.body;

    let parsedBarbershopTiming;
    try {
      const cleanedTiming = barbershop_timing.replace(/^['"]|['"]$/g, "");
      parsedBarbershopTiming = JSON.parse(cleanedTiming);
    } catch (e) {
      res.status(400).json({
        success: false,
        message: "Error parsing barbershop_timing. Ensure it's a valid JSON string."
      });
      return;
    }

    let parsedBarbershopStaff;
    try {
      const cleanedStaff = barbershop_staff.replace(/^['"]|['"]$/g, "");
      parsedBarbershopStaff = JSON.parse(cleanedStaff);
    } catch (e) {
      res.status(400).json({
        success: false,
        message: "Error parsing barbershop_staff. Ensure it's a valid JSON string."
      });
      return;
    }

    if (
      !Array.isArray(parsedBarbershopStaff) ||
      parsedBarbershopStaff.some((item) => typeof item !== "object")
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid barbershop_staff data. It must be an array of objects."
      });
      return;
    }

    productToUpdate.user_id = user_id || productToUpdate.user_id;
    productToUpdate.user_role = user_role || productToUpdate.user_role;
    productToUpdate.barbershop_name =
      barbershop_name || productToUpdate.barbershop_name;
    productToUpdate.barbershop_seats =
      barbershop_seats || productToUpdate.barbershop_seats;
    productToUpdate.barbershop_address =
      barbershop_address || productToUpdate.barbershop_address;
    productToUpdate.barbershop_about =
      barbershop_about || productToUpdate.barbershop_about;
    productToUpdate.barbershop_languages =
      barbershop_languages || productToUpdate.barbershop_languages;
    productToUpdate.barbershop_staff =
      parsedBarbershopStaff || productToUpdate.barbershop_staff;
    productToUpdate.barbershop_timing =
      parsedBarbershopTiming || productToUpdate.barbershop_timing;

    if (req.files) {
      productToUpdate.barbershop_images =
        (req.files as Express.Multer.File[])?.map((file) => file.path) ||
        productToUpdate.barbershop_images;
    }

    const updatedBarberShop = await productToUpdate.save();

    res.status(200).json({
      success: true,
      message: "Barber shop updated successfully",
      updatedBarberShop
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update barber shop",
      error: (error as Error).message
    });
  }
};

// Delete BarberShop
export const deleteBarberShop = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const shopId = req.params.id;
    const shopToDelete = await BarberShops.findById(shopId);

    if (!shopToDelete) {
      res.status(404).json({
        success: false,
        message: "Barber shop not found"
      });
      return;
    }

    await BarberShops.deleteOne({ _id: shopId });
    res.status(200).json({
      success: true,
      message: "Barber shop deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete barber shop",
      error: (error as Error).message
    });
  }
};

