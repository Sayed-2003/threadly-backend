const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    imageUrl: {
      type: String,
      default: "",
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
  { timestamps: true },
);

communitySchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  },
);

const Community = mongoose.model("Community", communitySchema);

module.exports = Community;
