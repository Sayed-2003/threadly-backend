
const router = require("express").Router();
const mongoose = require("mongoose");
const Bookmark = require("../../models/Bookmark");
const Post = require("../../models/Post");
const Community = require("../../models/Community");
const verifyToken = require("../../middleware/verifyToken");


router.get("/", verifyToken, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({
      user: req.user._id,
      isDeleted: false,
    })
      .populate({
        path: "post",
        match: { isDeleted: false },
        populate: [
          {
            path: "author",
            select: "username",
          },
          {
            path: "community",
            select: "name isDeleted",
          },
        ],
      })
      .sort({ createdAt: -1 });

    const activeBookmarks = bookmarks.filter(
      (bookmark) =>
        bookmark.post &&
        bookmark.post.community &&
        !bookmark.post.community.isDeleted
    );

    return res.status(200).json(activeBookmarks);
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Could not get bookmarks",
    });
  }
});

router.post("/:postId", verifyToken, async (req, res) => {
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

    const existingBookmark = await Bookmark.findOne({
      user: req.user._id,
      post: postId,
    });

   
    if (existingBookmark && !existingBookmark.isDeleted) {
      return res.status(409).json({
        message: "Post already bookmarked",
      });
    }

    if (existingBookmark && existingBookmark.isDeleted) {
      existingBookmark.isDeleted = false;
      existingBookmark.deletedAt = null;

      await existingBookmark.save();

      return res.status(200).json(existingBookmark);
    }

    const newBookmark = await Bookmark.create({
      user: req.user._id,
      post: postId,
    });

    return res.status(201).json(newBookmark);
  } catch (err) {
    console.log(err);

    if (err.code === 11000) {
      return res.status(409).json({
        message: "Post already bookmarked",
      });
    }

    return res.status(500).json({
      message: "Could not bookmark post",
    });
  }
});

router.delete("/:postId", verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({
        message: "Invalid post ID",
      });
    }

    const bookmark = await Bookmark.findOne({
      user: req.user._id,
      post: postId,
      isDeleted: false,
    });

    if (!bookmark) {
      return res.status(404).json({
        message: "Bookmark not found",
      });
    }

    bookmark.isDeleted = true;
    bookmark.deletedAt = new Date();

    await bookmark.save();

    return res.status(200).json({
      message: "Bookmark removed successfully",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Could not remove bookmark",
    });
  }
});

module.exports = router;
