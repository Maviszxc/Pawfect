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

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
});

// Public routes
router.get("/", petController.getAllPets);
router.get("/filter", petController.filterPets);
router.get("/match", petController.matchPets);
router.get("/:id", petController.getPetById);

// Protected routes (admin only)
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
  ]),
  petController.createPet
);
router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
  ]),
  petController.updatePet
);
router.patch(
  "/:id/archive",
  verifyToken,
  verifyAdmin,
  petController.archivePet
);
router.patch(
  "/:id/restore",
  verifyToken,
  verifyAdmin,
  petController.restorePet
);
router.delete("/:id", verifyToken, verifyAdmin, petController.deletePet);

// Admin-only route to get all pets including archived
router.get(
  "/admin/all",
  verifyToken,
  verifyAdmin,
  petController.getAllPetsAdmin
);

module.exports = router;
