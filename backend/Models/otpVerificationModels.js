/** @format */

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OtpVerificationSchema = new Schema({
  userEmail: { type: String, required: true },
  otp: { type: String },
  expiresAt: { type: Date },
}, 
{
  timestamps: true
}

);

module.exports = mongoose.model("OtpVerification", OtpVerificationSchema);
