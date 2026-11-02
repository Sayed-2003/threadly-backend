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

module.exports = router;