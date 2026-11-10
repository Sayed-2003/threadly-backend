const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { randomUUID } = require("crypto");

const uploadDirectory = path.join(__dirname, "../uploads");

fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    callback(null, `${randomUUID()}${allowedTypes[file.mimetype]}`);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, callback) => {
    if (!allowedTypes[file.mimetype]) {
      return callback(
        new Error("Only JPG, PNG, and WebP images are allowed")
      );
    }

    callback(null, true);
  },
});

module.exports = upload;