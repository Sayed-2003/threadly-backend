
const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    value: {
      type: Number,
      required: true,
      enum: [1, -1],
    },
  },
  { timestamps: true }
);


voteSchema.index(
  { user: 1, post: 1 },
  { unique: true }
);

const Vote = mongoose.model("Vote", voteSchema);

module.exports = Vote;
