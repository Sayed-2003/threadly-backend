const router = require("express").Router();
const Community = require("../../models/Community");
const verifyToken = require("../../middleware/verifyToken");

router.get("/", async (req, res) => {
  try {
    const allCommunities = await Community.find();
    res.json(allCommunities);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not get communities" });
  }
});

router.get("/:communityId", verifyToken, async (req, res) => {
  try {
    const foundCommunity = await Community.findById(req.params.communityId);

    if (!foundCommunity) {
      return res.status(404).json({ message: "Community not found" });
    }

    res.json(foundCommunity);
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

    const existingCommunity = await Community.findOne({
      name: name.toLowerCase().trim(),
    });

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

    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: "Could not create community" });
  }
});
module.exports = router;