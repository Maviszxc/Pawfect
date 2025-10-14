const express = require("express");
const router = express.Router();
const { submitDonationConfirmation } = require("../Controllers/donationController");

// POST /api/donations - Submit donation confirmation
router.post("/", submitDonationConfirmation);

module.exports = router;
