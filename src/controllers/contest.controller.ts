import { Request, Response } from "express";
import Contest, { IContest } from "../models/contest.model";
import { DateTime } from "luxon";
import mongoose from "mongoose";

export const createContest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let { startDate, endDate, description, advantages, howTojoin } = req.body;
    if (!startDate || !endDate) {
      res.status(400).json({ success: false, message: "fields arre missing" });
      return;
    }
    startDate = new Date(startDate);
    endDate = new Date(endDate);
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(0, 0, 0, 0);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res
        .status(400)
        .json({ message: "Invalid date format for startDate or endDate" });
      return;
    }
    if (startDate > endDate) {
      res
        .status(400)
        .json({ message: "Start date cannot be greater than end date" });
      return;
    }
    let currentDateTime = new Date();
    currentDateTime.setUTCHours(0, 0, 0, 0);
    if (currentDateTime > new Date(startDate)) {
      res
        .status(400)
        .json({ message: "Start date must be Present & in the future" });
      return;
    }
    const check = await Contest.find({ status: "ongoing" });

    if (check.length) {
      res.status(400).json({
        message:
          "You won't be able to add a new contest as the already ongoing contest has not ended"
      });
      return;
    }
    const contest: IContest = new Contest({
      startDate,
      endDate
    });
    if (description) {
      contest.description = description;
    }
    if (advantages) {
      contest.advantages = advantages;
    }
    if (howTojoin) {
      contest.howTojoin = howTojoin;
    }
    await contest.save();
    res.status(201).json({ message: "Contest created successfully", contest });
  } catch (error) {
    res.status(500).json({ message: "Failed to create contest", error });
    return;
  }
};

export const getAllContest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const contests = await Contest.find();
    if (!contests) {
      res.status(404).json({ success: true, message: "No contests found" });
      return;
    }
    res.status(200).json({ success: true, data: contests });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "failed to create a review", error });
  }
};

export const deleteContest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const contestId = req.params.contestId;
  if (!mongoose.Types.ObjectId.isValid(contestId)) {
    res.status(404).json({ message: "Invalid contest id" });
    return;
  }
  try {
    const contest = await Contest.findByIdAndDelete(contestId);
    if (!contest) {
      res.status(404).json({ success: false, message: "contest not found" });
      return;
    }
    res
      .status(200)
      .json({ success: true, message: "contest deleted successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: "error while deleting contest" });
  }
};

export const contestUpdate = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    startDate,
    endDate,
    description,
    advantages,
    howTojoin,
    contestId
  }: {
    startDate: string;
    endDate: string;
    description: string;
    advantages: string;
    howTojoin: string;
    contestId: string;
  } = req.body;

  try {
    // Validate required fields
    if (
      !startDate ||
      !endDate ||
      !description ||
      !advantages ||
      !howTojoin ||
      !contestId
    ) {
      res
        .status(400)
        .json({ success: false, message: "Incomplete contest details" });
      return;
    }

    // Validate date format and logic
    const start = DateTime.fromISO(startDate);
    const end = DateTime.fromISO(endDate);
    const now = DateTime.now();

    if (!start.isValid || !end.isValid) {
      res.status(400).json({
        success: false,
        message: "Invalid date format for startDate or endDate"
      });
      return;
    }

    if (start >= end) {
      res.status(400).json({
        success: false,
        message: "startDate cannot be greater than or equal to endDate"
      });
      return;
    }

    if (now > start) {
      res.status(400).json({
        success: false,
        message: "Start date must be in the present or future"
      });
      return;
    }

    // Check if the contest exists
    const contest = await Contest.findById(contestId);
    if (!contest) {
      res
        .status(404)
        .json({ success: false, message: "No such contest found" });
      return;
    }

    // Convert Luxon DateTime to JavaScript Date
    const startDateNative = start.toJSDate();
    const endDateNative = end.toJSDate();

    // Update the contest
    const updatedContest = await Contest.findByIdAndUpdate(
      contestId,
      {
        startDate: startDateNative,
        endDate: endDateNative,
        description,
        advantages,
        howTojoin
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Successfully updated",
      data: updatedContest
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "An unexpected error occurred" });
  }
};

export const getSingleContest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const contestId = req.params.contestId;
  if (!mongoose.Types.ObjectId.isValid(contestId)) {
    res.status(404).json({ message: "Invalid contest id" });
    return;
  }
  try {
    const contest = await Contest.findOne({ _id: contestId });
    if (!contest) {
      res.status(404).json({ success: false, message: "contest not found" });
      return;
    }
    res.status(200).json({ success: true, message: contest });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: "error while retriving contest" });
  }
};

export const getAdminOnGoingContest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const contestData = await Contest.find({ status: "ongoing" })
      .populate({
        path: "contestants",
        match: { isBlocked: false },
        populate: {
          path: "userId",
          model: "User",
          select: "email" // Only select the email field
        }
      })
      .sort({ votes: -1 });
    console.log(contestData);

    res.status(200).json({ contestData });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while getting ongoing contest" });
  }
};
export const getRemainingTime = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.params.id;
  try {
    const contest: IContest | null = await Contest.findById(id);
    if (!contest) {
      res
        .status(404)
        .json({ success: false, message: "no contest is currenlty going" });
      return;
    }
    const endDate: Date = contest.endDate;
    const now: Date = new Date();
    const timeRemaining = endDate.getTime() - now.getTime();
    const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.floor(
      (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutesRemaining = Math.floor(
      (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
    );

    res.status(200).json({
      success: true,
      message: "successfully fetched",
      data: {
        days: daysRemaining,
        hours: hoursRemaining,
        minutes: minutesRemaining
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "error getting time" });
  }
};
