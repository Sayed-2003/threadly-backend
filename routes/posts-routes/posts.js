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

    res.status(200).json(activePosts);
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

    res.status(200).json(posts);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Could not get community posts",
    });
  }
});


router.get("/:postId", async (req, res) => {
  try {
    const foundPost = await Post.findOne({
      _id: req.params.postId,
      isDeleted: false,
    })
      .populate("author", "username")
      .populate("community", "name isDeleted");

    if (
      !foundPost ||
      !foundPost.community ||
      foundPost.community.isDeleted
    ) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    res.status(200).json(foundPost);
  } catch (err) {
    console.log(err);

    if (err.name === "CastError") {
      return res.status(400).json({
        message: "Invalid post ID",
      });
    }

    res.status(500).json({
      message: "Could not get post",
    });
  }
});


router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, text, community } = req.body;

    if (!title || !text || !community) {
      return res.status(400).json({
        message: "Title, text and community are required",
      });
    }

    if (
      typeof title !== "string" ||
      typeof text !== "string" ||
      !title.trim() ||
      !text.trim()
    ) {
      return res.status(400).json({
        message: "Title and text must be non-empty strings",
      });
    }

    if (!mongoose.isValidObjectId(community)) {
      return res.status(400).json({
        message: "Invalid community ID",
      });
    }

    const foundCommunity = await Community.findOne({
      _id: community,
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
        message: "You must join this community before posting",
      });
    }

    const newPost = await Post.create({
      title: title.trim(),
      text: text.trim(),
      community,
      author: req.user._id,
    });

    res.status(201).json(newPost);
  } catch (err) {
    console.log(err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: err.message,
      });
    }

    res.status(500).json({
      message: "Could not create post",
    });
  }
});


module.exports = router;