const router = require("express").Router();
const Community = require("../../models/Community");
const verifyToken = require("../../middleware/verifyToken");
const Post = require("../../models/Post");
const Comment = require("../../models/Comment")
const Vote = require("../../models/Vote");
const Bookmark = require("../../models/Bookmark");

router.get("/", async (req, res) => {
  try {
    const allCommunities = await Community.find({ isDeleted: false });
    res.status(200).json(allCommunities);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not get communities" });
  }
});


router.get("/:communityId", async (req, res) => {
  try {
    const foundCommunity = await Community.findById(req.params.communityId);

    if (!foundCommunity) {
      return res.status(404).json({ message: "Community not found" });
    }

    if (foundCommunity && foundCommunity.isDeleted === true) {
      return res.status(404).json({ message: "This Community is Deleted" });
    }

    res.status(200).json(foundCommunity);

  } catch (err) {
    console.log(err);

    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid community ID" });
    }

    res.status(500).json({ message: "Could not get community" });
  }
});


router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        message: "Name and description are required",
      });
    }

    const existingCommunity = await Community.findOne({ name: req.body.name, isDeleted: false,});

    if (existingCommunity) {
      return res.status(409).json({
        message: "Community name already exists",
      });
    }

    const newCommunity = await Community.create({
      name,
      description,
      owner: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json(newCommunity);

  } catch (err) {
    console.log(err);

    if (err.code === 11000) {
  return res.status(409).json({
    message: "Community name already exists",
  });}

    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message }); }

    res.status(500).json({ message: "Could not create community" });
  }
});


router.put("/:communityId", verifyToken, async (req, res) => {
  try {

    const foundCommunity = await Community.findOne({_id: req.params.communityId, isDeleted: false,});

    if (!foundCommunity) {
      return res.status(404).json({ message: "Community not found" });
    }

    if (foundCommunity.owner.toString() !== req.user._id) {
      return res.status(403).json({
        message: "You cannot edit this community",
      });
    }

    const { name, description } = req.body;

    const updatedCommunity = await Community.findByIdAndUpdate(
      req.params.communityId,
      { name, description },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedCommunity);
  } catch (err) {
    console.log(err);

    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid community ID" });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    if (err.code === 11000) {
  return res.status(409).json({
    message: "Community name already exists",
  });
}

    res.status(500).json({ message: "Could not update community" });
  }
});


router.put("/:communityId/membership", verifyToken, async (req, res) => {
  try {

    const foundCommunity = await Community.findOne({ _id: req.params.communityId, isDeleted: false,});

    if (!foundCommunity) {
      return res.status(404).json({ message: "Community not found" });
    }

    const existingMember = foundCommunity.members.find((member) => {
      return member.toString() === req.user._id;
    });

    if (existingMember) {
      return res.status(409).json({
        message: "You are already a member of this community",
      });
    }

    const updatedCommunity = await Community.findByIdAndUpdate(
      req.params.communityId,
      { members: [...foundCommunity.members, req.user._id] },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedCommunity);
  } catch (err) {
    console.log(err);

    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid community ID" });
    }

    res.status(500).json({ message: "Could not join community" });
  }
});


router.delete("/:communityId", verifyToken, async (req, res) => {
  try {
    const foundCommunity = await Community.findOne({
      _id: req.params.communityId,
      isDeleted: false,
    });

    if (!foundCommunity) {
      return res.status(404).json({
        message: "Community not found",
      });
    }

    if (foundCommunity.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You cannot delete this community",
      });
    }

    const deletedAt = new Date();

    
    const posts = await Post.find({
      community: foundCommunity._id,
    }).select("_id");

    const postIds = posts.map((post) => post._id);

    
    foundCommunity.isDeleted = true;
    foundCommunity.deletedAt = deletedAt;
    await foundCommunity.save();


    await Post.updateMany( { community: foundCommunity._id },  { $set: { isDeleted: true, deletedAt, },} );

    await Comment.updateMany( { post: { $in: postIds } }, { $set: { isDeleted: true, deletedAt,},});

    await Vote.updateMany( { post: { $in: postIds } },  { $set: {  isDeleted: true,  deletedAt,  },});

    await Bookmark.updateMany({ post: { $in: postIds } },{ $set: {  isDeleted: true, deletedAt,  },} );

    return res.status(200).json({
      message: "Community and all related data deleted successfully",
    });

  } catch (err) {
    console.log(err);

    if (err.name === "CastError") {
      return res.status(400).json({
        message: "Invalid community ID",
      });
    }

    return res.status(500).json({
      message: "Could not delete community",
    });
  }
});


router.delete("/:communityId/membership", verifyToken, async (req, res) => {
  try {
    const foundCommunity = await Community.findOne({
      _id: req.params.communityId,
      isDeleted: false,
    });

    if (!foundCommunity) {
      return res.status(404).json({ message: "Community not found" });
    }

    const existingMember = foundCommunity.members.find((member) => {
      return member.toString() === req.user._id;
    });

    if (!existingMember) {
      return res.status(409).json({
        message: "You are not a member of this community",
      });
    }

    const updatedMembers = foundCommunity.members.filter((member) => {
      return member.toString() !== req.user._id;
    });

    const updatedCommunity = await Community.findByIdAndUpdate(
      req.params.communityId,
      { members: updatedMembers },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedCommunity);
  } catch (err) {
    console.log(err);

    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid community ID" });
    }

    res.status(500).json({ message: "Could not leave community" });
  }
});


module.exports = router;