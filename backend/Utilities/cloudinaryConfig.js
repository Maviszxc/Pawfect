const cloudinary = require("cloudinary").v2;

console.log("Configuring Cloudinary with:");
console.log("Cloud name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API key exists:", !!process.env.CLOUDINARY_API_KEY);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
