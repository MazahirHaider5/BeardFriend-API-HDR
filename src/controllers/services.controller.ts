import { Request, Response } from 'express';
import Service from '../models/services.model';
import BarberShops from '../models/barberShop.model';
import mongoose from 'mongoose';

// Create a new service
export const createService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shop_id, name, price, description } = req.body;

    // Validate shop_id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(shop_id)) {
      res.status(400).json({ message: 'Invalid shop ID format' });
      return;
    }

    // Check if the barber shop exists
    const barberShop = await BarberShops.findById(shop_id);
    if (!barberShop) {
      res.status(404).json({ message: 'Barber shop not found' });
      return;
    }

    // Create and save the service
    const service = new Service({
      shop_id,
      name,
      price,
      description,
    });

    const savedService = await service.save();

    barberShop.services.push(savedService.id);
    await barberShop.save();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service: savedService,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating service',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get all services
export const getAllServices = async (req: Request, res: Response): Promise <void> => {
  try {
    const services = await Service.find();
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching services',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get services by shop ID
export const getServicesByShopId = async (req: Request, res: Response): Promise <void> => {
  try {
    const { shopId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
       res.status(400).json({ message: 'Invalid shop ID format' });
       return
    }

    const services = await Service.find({ shop_id: shopId });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching services by shop ID',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get service by ID
export const getServiceById = async (req: Request, res: Response) : Promise <void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
       res.status(400).json({ message: 'Invalid service ID format' });
       return
    }

    const service = await Service.findById(id);
    if (!service) {
       res.status(404).json({ message: 'Service not found' });
       return
    }

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching service',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update service
export const updateService = async (req: Request, res: Response): Promise <void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
       res.status(400).json({ message: 'Invalid service ID format' });
       return
    }

    const updatedService = await Service.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedService) {
       res.status(404).json({ message: 'Service not found' });
       return
    }

    res.status(200).json(updatedService);
  } catch (error) {
    res.status(500).json({
      message: 'Error updating service',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete service
export const deleteService = async (req: Request, res: Response): Promise <void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
       res.status(400).json({ message: 'Invalid service ID format' });
       return
    }

    const deletedService = await Service.findByIdAndDelete(id);

    if (!deletedService) {
       res.status(404).json({ message: 'Service not found' });
       return
    }

    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting service',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};