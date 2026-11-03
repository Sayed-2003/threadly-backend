const router = require("express").Router({ mergeParams: true });
const mongoose = require("mongoose");
const Comment = require("../../models/Comment");
const Post = require("../../models/Post");
const Community = require("../../models/Community");
const verifyToken = require("../../middleware/verifyToken");
const requireCommunityMember = require("../../middleware/requireCommunityMember");


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


router.post("/", verifyToken,requireCommunityMember, async (req, res) => {
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



router.put("/:commentId", verifyToken,requireCommunityMember, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body;

    if (
      !mongoose.isValidObjectId(postId) ||
      !mongoose.isValidObjectId(commentId)
    ) {
      return res.status(400).json({
        message: "Invalid post or comment ID",
      });
    }

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        message: "Comment text is required",
      });
    }

    const foundComment = await Comment.findOne({
      _id: commentId,
      post: postId,
      isDeleted: false,
    });

    if (!foundComment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    if (foundComment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You cannot edit this comment",
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

    foundComment.text = text.trim();
    await foundComment.save();

    res.status(200).json(foundComment);
  } catch (err) {
    console.log(err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: err.message,
      });
    }

    res.status(500).json({
      message: "Could not update comment",
    });
  }
});



router.delete("/:commentId", verifyToken,requireCommunityMember, async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    if (
      !mongoose.isValidObjectId(postId) ||
      !mongoose.isValidObjectId(commentId)
    ) {
      return res.status(400).json({
        message: "Invalid post or comment ID",
      });
    }

    const foundComment = await Comment.findOne({
      _id: commentId,
      post: postId,
      isDeleted: false,
    });

    if (!foundComment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    if (foundComment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You cannot delete this comment",
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

    foundComment.isDeleted = true;
    foundComment.deletedAt = new Date();
    await foundComment.save();

    res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Could not delete comment",
    });
  }
});




module.exports = router;