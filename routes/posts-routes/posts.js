const router = require("express").Router();
const mongoose = require("mongoose");
const Post = require("../../models/Post");
const Community = require("../../models/Community");
const verifyToken = require("../../middleware/verifyToken");

router.get("/", async (req, res) => {
  try {
    const allPosts = await Post.find({ isDeleted: false })
      .populate("author", "username")
      .populate("community", "name isDeleted");

    const activePosts = allPosts.filter((post) => {
      return post.community && !post.community.isDeleted;
    });

    res.json(activePosts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not get posts" });
  }
});

// GET posts from a community
router.get("/community/:communityId", async (req, res) => {
  try {
    const communityId = req.params.communityId;

    if (!mongoose.isValidObjectId(communityId)) {
      return res.status(400).json({
        message: "Invalid community ID",
      });
    }

    const foundCommunity = await Community.findOne({
      _id: communityId,
      isDeleted: false,
    });

    if (!foundCommunity) {
      return res.status(404).json({
        message: "Community not found",
      });
    }

    const posts = await Post.find({
      community: communityId,
      isDeleted: false,
    })
      .populate("author", "username")
      .populate("community", "name");

    res.json(posts);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Could not get community posts",
    });
  }
});

module.exports = router;