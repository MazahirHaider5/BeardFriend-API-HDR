import { Request, Response } from "express";
import mongoose from "mongoose";
import dayjs from "dayjs";
import { isValidDateTime } from "../utils/checkFormat";
import BarberShop from "../models/barberShop.model";

import Reservation from "../models/reservations.model";
export const createReservation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { barber_shop_id, time_slot } = req.body;
  if (!req.user) {
    res.status(401).json({ message: "User not authenticated" });
    return;
  }
  const userId = req.user.id;
  if (!mongoose.Types.ObjectId.isValid(barber_shop_id)) {
    res.status(400).json({ message: "inavlid barberShopId or userID" });
    return;
  }
  if (!barber_shop_id || !time_slot) {
    res.status(400).json({
      success: false,
      message: "barberShopId and time_slot are required"
    });
    return;
  }
  if (!isValidDateTime(time_slot)) {
    res.status(400).json({ message: "invalid time" });
    return;
  }
  try {
    const barberShop = await BarberShop.findById(barber_shop_id);
    if (!barberShop) {
      res.status(404).json({ message: "barberShop not found" });
      return;
    }
    const reservation = await Reservation.create({
      barber_shop_id,
      user_id: userId,
      reservation_time_slot: dayjs(time_slot, "YYYY-MM-DD HH:mm:ss").toDate()
    });
    res.status(201).json({
      success: true,
      data: {
        message: "reservation successfully created",
        reservation
      }
    });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: "error while creating reservation" });
  }
};

export const getAllShopSpecificReservation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { barberShopId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(barberShopId)) {
    res.status(400).json({ message: "inavlid barberShopId or userID" });
    return;
  }
  try {
    const barberShop = await BarberShop.findById(barberShopId);
    if (!barberShop) {
      res.status(404).json({ message: "barberShop not found" });
      return;
    }
    const reservations = await Reservation.find({
      barber_shop_id: barberShopId
    }).select("-barber_shop_id");
    if (!reservations) {
      res
        .status(404)
        .json({ success: false, message: "no reservations found" });
    }
    res.status(200).json({ success: true, message: reservations });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "error while getting reservations" });
  }
};

export const deleteReservation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { reservationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(reservationId)) {
    res.status(400).json({ message: "inavlid barberShopId or userID" });
    return;
  }
  try {
    const reservation = await Reservation.findByIdAndDelete(reservationId);
    if (!reservation) {
      res
        .status(400)
        .json({ success: false, message: "reservation not found" });
      return;
    }
    res.status(200).json({ success: false, message: reservation });
  } catch (error) {
    res
      .status(400)
      .json({ success: true, message: "error while deleting reservation" });
  }
};

export const updateReservation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { reservationId, time_slot } = req.body;

  if (!mongoose.Types.ObjectId.isValid(reservationId)) {
    res.status(400).json({ message: "invalid reservationId" });
    return;
  }

  if (!isValidDateTime(time_slot)) {
    res.status(400).json({ message: "invalid time" });
    return;
  }
  try {
    const reservation = await Reservation.findByIdAndUpdate(
      { _id: reservationId },
      {
        reservation_time_slot: dayjs(time_slot, "YYYY-MM-DD HH:mm:ss").toDate()
      },
      { new: true }
    );
    if (!reservation) {
      res
        .status(400)
        .json({ success: false, message: "reservation not found" });
    }
    res.status(200).json({
      success: true,
      data: {
        message: "reservation successfully updated",
        reservation
      }
    });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: "error while creating reservation" });
  }
};
