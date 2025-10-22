const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adoptionSchema = new Schema(
  {
    pet: {
      type: Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
      index: true, // Added index for better performance
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // allow guest adoption requests
      index: true, // Added index for better performance
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed"],
      default: "Pending",
      index: true, // Added index for better performance
    },
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      index: true, // Added index for better performance
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    adminMessage: {
      type: String,
      default: "",
    },
    profilePicture: {
      type: String,
      default: "",
    },
    // URL to the adopter's uploaded PDF form (stored in Supabase)
    adoptionFormUrl: {
      type: String,
      required: false,
      default: "",
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true, // Added index for better performance
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for better query performance
adoptionSchema.index({ user: 1, email: 1 });
adoptionSchema.index({ pet: 1, status: 1 });
adoptionSchema.index({ email: 1, status: 1 });

module.exports = mongoose.model("Adoption", adoptionSchema);
