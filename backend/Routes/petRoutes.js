const express = require("express");
const router = express.Router();
const petController = require("../Controllers/petController");
const { verifyToken, verifyAdmin } = require("../Utilities/authUtil");
const multer = require("multer");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Public routes
router.get("/", petController.getAllPets);
router.get("/filter", petController.filterPets);
router.get("/:id", petController.getPetById);

// Protected routes (admin only)
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  upload.single("image"),
  petController.createPet
);
router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  upload.single("image"),
  petController.updatePet
);
router.delete("/:id", verifyToken, verifyAdmin, petController.deletePet);

module.exports = router;
