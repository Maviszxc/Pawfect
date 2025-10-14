const express = require("express");
const router = express.Router();
const { submitContactForm } = require("../Controllers/contactController");

// POST /api/contact - Submit contact form
router.post("/", submitContactForm);

module.exports = router;
