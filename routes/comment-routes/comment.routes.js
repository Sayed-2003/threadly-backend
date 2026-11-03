const router = require("express").Router({ mergeParams: true });
const mongoose = require("mongoose");
const Comment = require("../../models/Comment");
const Post = require("../../models/Post");
const Community = require("../../models/Community");
const verifyToken = require("../../middleware/verifyToken");


router.get("/", async (req, res) => {
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

        const comments = await Comment.find({
            post: postId,
            isDeleted: false,
        })
            .populate("author", "username")
            .sort({ createdAt: 1 });

        res.status(200).json(comments);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Could not get comments",
        });
    }
});


router.post("/", verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text, parentComment } = req.body;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({
        message: "Invalid post ID",
      });
    }

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        message: "Comment text is required",
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

    let parentId = null;

    if (parentComment !== undefined && parentComment !== null) {
      if (!mongoose.isValidObjectId(parentComment)) {
        return res.status(400).json({
          message: "Invalid parent comment ID",
        });
      }

      const foundParent = await Comment.findOne({
        _id: parentComment,
        post: postId,
        isDeleted: false,
      });

      if (!foundParent) {
        return res.status(404).json({
          message: "Parent comment not found",
        });
      }

      parentId = foundParent._id;
    }

    const newComment = await Comment.create({
      text: text.trim(),
      author: req.user._id,
      post: postId,
      parentComment: parentId,
    });

    res.status(201).json(newComment);
  } catch (err) {
    console.log(err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: err.message,
      });
    }

    res.status(500).json({
      message: "Could not create comment",
    });
  }
});




module.exports = router;