
const router = require("express").Router({ mergeParams: true });
const mongoose = require("mongoose");
const Vote = require("../../models/Vote");
const Post = require("../../models/Post");
const Community = require("../../models/Community");
const verifyToken = require("../../middleware/verifyToken");
const requireCommunityMember = require("../../middleware/requireCommunityMember");
// GET vote counts and score (public)
router.get("/votes", async (req, res) => {
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
        const votes = await Vote.find({
            post: postId,
            isDeleted: false,
        });
        const upvotes = votes.filter((vote) => vote.value === 1).length;
        const downvotes = votes.filter((vote) => vote.value === -1).length;
        return res.status(200).json({
            post: postId,
            upvotes,
            downvotes,
            score: upvotes - downvotes,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Could not get votes",
        });
    }
});
// PUT add or change vote
router.put(
    "/vote",
    verifyToken,
    requireCommunityMember,
    async (req, res) => {
        try {
            const { postId } = req.params;
            const { value } = req.body;
            if (value !== 1 && value !== -1) {
                return res.status(400).json({
                    message: "Vote value must be 1 or -1",
                });
            }
            let vote = await Vote.findOne({
                user: req.user._id,
                post: postId,
            });
            if (vote) {
                if (!vote.isDeleted && vote.value === value) {
                    return res.status(409).json({
                        message: "You already voted this way",
                    });
                }
                vote.value = value;
                vote.isDeleted = false;
                vote.deletedAt = null;
                await vote.save();
                return res.status(200).json(vote);
            }
            vote = await Vote.create({
                user: req.user._id,
                post: postId,
                value,
            });
            return res.status(201).json(vote);
        } catch (err) {
            console.log(err);
            return res.status(500).json({
                message: "Could not save vote",
            });
        }
    }
);
// DELETE remove vote (soft delete)
router.delete(
    "/vote",
    verifyToken,
    requireCommunityMember,
    async (req, res) => {
        try {
            const { postId } = req.params;
            const vote = await Vote.findOne({
                user: req.user._id,
                post: postId,
                isDeleted: false,
            });
            if (!vote) {
                return res.status(404).json({
                    message: "Vote not found",
                });
            }
            vote.isDeleted = true;
            vote.deletedAt = new Date();
            await vote.save();
            return res.status(200).json({
                message: "Vote removed successfully",
            });
        } catch (err) {
            console.log(err);
            return res.status(500).json({
                message: "Could not remove vote",
            });
        }
    }
);
module.exports = router;
