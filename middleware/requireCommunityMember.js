
const mongoose = require("mongoose");
const Post = require("../models/Post");
const Community = require("../models/Community");

const requireCommunityMember = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({
        message: "Invalid post ID",
      });
    }

    const foundPost = await Post.findOne({
      _id: postId,
      isDeleted: false,
    });

    if (!foundPost) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const foundCommunity = await Community.findOne({
      _id: foundPost.community,
      isDeleted: false,
    });

    if (!foundCommunity) {
      return res.status(404).json({
        message: "Community not found",
      });
    }

    const isMember = foundCommunity.members.some((member) => {
      return member.toString() === req.user._id.toString();
    });

    if (!isMember) {
      return res.status(403).json({
        message: "You must join this community to participate",
      });
    }

    next();

  } catch (err) {
    
    console.log(err);
    res.status(500).json({
      message: "Could not verify community membership",
    });
  }
};

module.exports = requireCommunityMember;
