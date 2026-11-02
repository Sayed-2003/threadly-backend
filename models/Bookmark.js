
const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);


bookmarkSchema.index(
  { user: 1, post: 1 },
  { unique: true }
);

const Bookmark = mongoose.model(
  "Bookmark",
  bookmarkSchema
);

module.exports = Bookmark;
