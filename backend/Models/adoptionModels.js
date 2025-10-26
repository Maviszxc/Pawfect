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
      enum: ["Under Review", "Approved", "Completed", "Denied", "Rejected", "Returned"],
      default: "Under Review",
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
    adoptionFormUrl: {
      type: String,
      required: false,
      default: '',
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true, // Added index for better performance
    },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: false,
  }
);

// Pre-save hook to ensure adoptionFormUrl field always exists
adoptionSchema.pre('save', function(next) {
  // If adoptionFormUrl is undefined or null, set it to empty string
  if (this.adoptionFormUrl === undefined || this.adoptionFormUrl === null) {
    this.adoptionFormUrl = '';
  }
  next();
});

// Compound index for better query performance
adoptionSchema.index({ user: 1, email: 1 });
adoptionSchema.index({ pet: 1, status: 1 });
adoptionSchema.index({ email: 1, status: 1 });

// Clear any cached model to ensure schema changes are applied
delete mongoose.connection.models['Adoption'];

module.exports = mongoose.model("Adoption", adoptionSchema);
