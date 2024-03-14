import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) {
    throw new ApiError(400, "Invalid channel Id");
  }

  const totalSubs = await Subscription.aggregate([
    {
      match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $group: {
        id: null,
        subscribers: {
          $sum: 1,
        },
      },
    },
  ]);

  const totalOutput = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "allLikes",
      },
    },
    {
      $project: {
        totalLikes: {
          $size: "$allLikes",
        },
        totalViews: "$views",
        totalVideos: 1,
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: {
          $sum: "$totalLikes",
        },
        totalViews: {
          $sum: "totalViews",
        },
        totalVideos: {
          $sum: 1,
        },
      },
    },
  ]);

  const channelStats = {
    totalSubscribers: totalSubs[0]?.subscribers || 0,
    totalLikes: totalOutput[0]?.totalLikes || 0,
    totalViews: totalOutput[0]?.totalViews || 0,
    totalOutput: totalOutput[0]?.totalVideos || 0,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, channelStats, "Stats fetched successfully"));

  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const { channelId } = req.params;
  if (!channelId) {
    throw new ApiError(400, "Invalid channel Id");
  }
  const videos = await Video.find({ owner: { _id: channelId } });

  if (!videos) {
    throw new ApiError(500, "Unable to fetch videos");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
