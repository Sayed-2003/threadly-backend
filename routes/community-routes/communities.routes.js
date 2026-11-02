const router = require("express").Router();
const Community = require("../../models/Community");

router.get("/", async (req, res) => {
  try {
    const allCommunities = await Community.find();
    res.json(allCommunities);
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

    res.json(foundCommunity);
  } catch (err) {
    console.log(err);

    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid community ID" });
    }

    res.status(500).json({ message: "Could not get community" });
  }
});

module.exports = router;