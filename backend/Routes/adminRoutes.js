const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../Utilities/authUtil");
const adminController = require("../Controllers/adminController");
const nodemailer = require("nodemailer");

// Middleware to verify admin access for all routes
router.use(verifyToken, verifyAdmin);

// Get all users
router.get("/users", adminController.getAllUsers);

// Update user admin status
router.patch("/users/:userId/admin", adminController.updateUserAdminStatus);

// Get all adoptions
router.get("/adoptions", adminController.getAllAdoptions);

// Update adoption status
router.patch(
  "/adoptions/:adoptionId/status",
  adminController.updateAdoptionStatus
);

// Add to adminRoutes.js
// Archive adoption
router.patch("/adoptions/:adoptionId/archive", adminController.archiveAdoption);

// Restore adoption
router.patch("/adoptions/:adoptionId/restore", adminController.restoreAdoption);

// Add to adminRoutes.js


// Get dashboard statistics
router.get("/stats", adminController.getDashboardStats);

// Get all pets
router.get("/pets", adminController.getAllPets);

// Delete a pet
router.delete("/pets/:petId", adminController.deletePet);

// Update a pet
router.put("/pets/:petId", adminController.updatePet);

// Delete a user
router.delete("/users/:userId", adminController.deleteUser);

router.patch(
  "/adoptions/:adoptionId/status",
  (req, res, next) => {
    console.log(
      `⏱️  Starting adoption status update for: ${req.params.adoptionId}`
    );
    const startTime = Date.now();

    // Capture the original send method
    const originalSend = res.send;
    res.send = function (data) {
      const duration = Date.now() - startTime;
      console.log(`⏱️  Adoption status update completed in ${duration}ms`);
      originalSend.apply(res, arguments);
    };

    next();
  },
  adminController.updateAdoptionStatus
);

module.exports = router;
