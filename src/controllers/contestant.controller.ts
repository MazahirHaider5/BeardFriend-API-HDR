import Contestant, { IContestant } from "../models/contestant.model";
import { promises as fsPromises } from "fs";
import Contest, { IContest } from "../models/contest.model";
import { IUser } from "../models/users.model";
import mongoose, { ObjectId } from "mongoose";
import { Request, Response } from "express";
import User from "../models/users.model";
import { populate } from "dotenv";

export const deleteContestant = async (
  req: Request,
  res: Response
): Promise<void> => {
  const contestantId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(contestantId)) {
    res.status(404).json({ message: "Invalid contestant id" });
    return;
  }
  try {
    const contest = await Contestant.findByIdAndDelete(contestantId);
    if (!contest) {
      res.status(404).json({ success: false, message: "contestant not found" });
      return;
    }
    res
      .status(200)
      .json({ success: true, message: "contestant deleted successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: "error while deleting contestant" });
  }
};

export const getAllContestants = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const contestants = await Contestant.find();
    if (!contestants) {
      res.status(404).json({ success: false, message: "No contests found" });
      return;
    }

    res.status(200).json({ success: true, data: contestants });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "failed to create a review", error });
  }
};
export const addContestant = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { user_id, contestId, name } = req.body;

  if (!user_id || !contestId || !req.file || !name) {
    res
      .status(400)
      .json({ success: false, message: "all fields are required" });
    return;
  }
  try {
    const user = await User.findById(user_id);
    if (!user) {
      res.status(404).json({ success: false, message: "user does not exits" });
      return;
    }
    const contest = await Contest.findById(contestId);
    if (!contest) {
      res
        .status(404)
        .json({ success: false, message: "contest does not exits" });
      return;
    }

    const imagePath = `uploads/contestants/${req.file.filename}`;
    const existingParticipation = await Contestant.find({ userId: user_id });
    console.log(existingParticipation);
    if (existingParticipation.length > 0) {
      for (const participate of existingParticipation) {
        const isalreadyParticipate = await Contest.findOne({
          _id: contestId,
          contestants: participate._id,
          status: "ongoing"
        });
        if (isalreadyParticipate) {
          res.status(400).json({ message: " already participated" });
          return;
        }
      }
    }

    // Create a new participation record
    const participation = await Contestant.create({
      userId: user_id,
      image: imagePath,
      votes: 0,
      name
    });
    const updatedContest = await Contest.updateOne(
      { _id: contestId },
      {
        $push: {
          contestants: participation._id
        }
      }
    );
    res
      .status(200)
      .json({ message: "Participation created successfully", participation });
  } catch (error) {
    console.log(error);
    res
      .status(400)
      .json({ success: false, message: "error while participating" });
  }
};
export const blockUnBlockContestParticipants = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.query;
    if (action == undefined) {
      res.status(400).json({ message: "action query parameter is required" });
      return;
    }

    const user = await Contestant.findById(id);

    if (!user) {
      res.status(404).json({ message: "Participant not found" });
      return;
    }

    if (action === "block") {
      if (user.isBlocked) {
        res.status(400).json({ message: "Participant is already blocked" });
        return;
      }
      user.isBlocked = true;
    } else if (action === "unblock") {
      if (!user.isBlocked) {
        res.status(400).json({ message: "Participant is already unblocked" });
        return;
      }
      user.isBlocked = false;
    } else {
      res.status(400).json({ message: "Invalid action" });
      return;
    }

    await user.save();

    const statusMessage = user.isBlocked ? "blocked" : "unblocked";
    res
      .status(200)
      .json({ message: `Participant ${statusMessage} successfully` });
  } catch (error) {
    console.error("Error toggling participant status:", error);
    res.status(500).json({ message: "An error occurred" });
  }
};

export const voteForParticipant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { contestantId, contest_Id, user_id } = req.body;

    const contestant: IContestant | null =
      await Contestant.findById(contestantId);
    if (!contestant) {
      res.status(404).json({ message: "Contestant not found" });
      return;
    }

    const user: IUser | null = await User.findById(user_id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (contestant.isBlocked) {
      res.status(403).json({ message: "Participation is blocked" });
      return;
    }

    // Check if the user is trying to vote for themselves
    if (
      contestant.userId.toString() === user_id ||
      contestant._id.toString() === user_id
    ) {
      res.status(400).json({ message: "You cannot vote for yourself" });
      return;
    }

    // Check if the user has already voted for this contestant
    if (contestant.voters.map(String).includes(user_id.toString())) {
      // Remove the vote if the user has already voted
      contestant.voters = contestant.voters.filter(
        (voter) => voter.toString() !== user_id.toString()
      );
      contestant.votes -= 1;
      await contestant.save();
      res
        .status(200)
        .json({ message: "Vote removed", contestant, status: false });
      return;
    }

    // Check if the user has already voted for another contestant in the same contest
    const allContest = await Contest.findById(contest_Id);
    const allParticipants: mongoose.Schema.Types.ObjectId[] =
      allContest?.contestants || [];

    for (const participant of allParticipants) {
      const isVote = await Contestant.findOne({
        _id: participant,
        voters: user_id
      });
      if (isVote) {
        res
          .status(400)
          .json({ message: "You already cast vote for another participant" });
        return;
      }
    }

    // Add the vote to the contestant
    contestant.votes += 1;
    contestant.voters.push(user_id);
    await contestant.save();

    res.status(200).json({
      message: "Vote counted successfully",
      contestant,
      status: true
    });
  } catch (error) {
    console.error("Error in voteForParticipant:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getTopContestants = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.params.id;
  try {
    const contest: IContest | null = await Contest.findById(id);
    if (!contest) {
      res.status(404).json({ success: false, message: "no contest found" });
      return;
    }
    let contestants = await Contest.find({ _id: id })
      .select("contestants")
      .populate({
        path: "contestants",
        match: { isBlocked: false },
        options: {
          sort: { votes: -1 },
          limit: 6
        }
      });

    res
      .status(200)
      .json({ success: true, message: contestants[0]["contestants"] });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "error getting top contestants" });
  }
};

export const getOlderWinner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const olderWinners = await Contest.find({ status: "expired" }).populate({
      path: "winner",
      match: { isBlocked: false },
      populate: {
        path: "userId"
      }
    });
    res.status(200).json({ success: true, message: olderWinners });
  } catch (error) {
    res.status(400).json({ success: false, message: "error getting winners" });
  }
};

export const updateContestant = async (req: Request, res: Response) => {
  if (!req?.file) {
    res.status(400).json({ success: false, message: "no file uploaded" });
    return;
  }
  const { id } = req.params;
  try {
    const contestant: IContestant | null = await Contestant.findById(id);
    if (!contestant) {
      res.status(404).json({ success: false, message: "contestant not found" });
      return;
    }
    await fsPromises.unlink(contestant.image);
    const imagepath = `uploads/contestants/${req.file.filename}`;
    const updatedContestant: IContestant | null =
      await Contestant.findByIdAndUpdate(
        { _id: id },
        {
          $set: { image: imagepath }
        }
      );
    res.status(200).json({
      success: true,
      message: "contestant updated succesfully ",
      data: updateContestant
    });
  } catch (error) {
    console.log(error);
    res
      .status(400)
      .json({ success: false, message: "error while updating picture" });
  }
};
