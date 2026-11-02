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

module.exports = router;