const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const petSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["dog", "cat", "Dog", "Cat"],
    },
    breed: {
      type: String,
      required: true,
    },
    age: {
      type: String,
      required: true,
      enum: ["kitten", "young adult", "mature adult", "adult"],
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "Male", "Female"],
    },
    images: [
      {
        url: String,
        public_id: String,
        format: String,
      },
    ],
    videos: [
      {
        url: String,
        public_id: String,
        format: String,
      },
    ],
    description: {
      type: String,
      required: true,
    },
    adoptionStatus: {
      type: String,
      enum: ["available", "pending", "adopted", "archived"],
      default: "available",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Pet", petSchema);
