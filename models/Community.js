const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);
router.delete("/:communityId", verifyToken, async (req, res) => {
  try {
    const foundCommunity = await Community.findOne({
      _id: req.params.communityId,
      isDeleted: false,
    });

    if (!foundCommunity) {
      return res.status(404).json({ message: "Community not found" });
    }

    if (foundCommunity.owner.toString() !== req.user._id) {
      return res.status(403).json({
        message: "You cannot delete this community",
      });
    }

    await Community.findByIdAndUpdate(
      req.params.communityId,
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: "Community deleted successfully" });
  } catch (err) {
    console.log(err);

    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid community ID" });
    }

    res.status(500).json({ message: "Could not delete community" });
  }
});
const Community = mongoose.model("Community",communitySchema)

module.exports = Community;