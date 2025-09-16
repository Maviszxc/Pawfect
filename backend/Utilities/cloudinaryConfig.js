const cloudinary = require("cloudinary").v2;

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dmz02b9lx",
  api_key: process.env.CLOUDINARY_API_KEY || "616974915165527",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "HA9FLEvqy9W-cxmSQRU5691GeoE",
});

// Test the configuration
cloudinary.api
  .ping()
  .then((result) => console.log("Cloudinary test successful:", result))
  .catch((error) => console.error("Cloudinary test failed:", error));

// Helper function for video/image upload
const uploadToCloudinary = async (filePath, resourceType = "image") => {
  try {
    const options = {
      folder:
        resourceType === "video" ? "pawproject/videos" : "pawproject/images",
      resource_type: resourceType,
    };

    if (resourceType === "video") {
      options.chunk_size = 6000000; // 6MB chunks for better large file handling
    }

    const result = await cloudinary.uploader.upload(filePath, options);
    return result;
  } catch (error) {
    console.error(
      `Error uploading ${resourceType} to Cloudinary:`,
      error.message
    );
    throw error;
  }
};

// Export the configured cloudinary instance and helper function
module.exports = {
  cloudinary,
  uploadToCloudinary,
};
