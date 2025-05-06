const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../Utilities/authUtil");
const adminController = require("../Controllers/adminController");

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

module.exports = router;
