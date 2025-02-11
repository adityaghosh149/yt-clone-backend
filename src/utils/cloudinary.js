import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;

    try {
        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        console.log("✅ FILE UPLOADED TO CLOUDINARY:", response.secure_url);
        return response;
    } catch (error) {
        console.error("❌ ERROR: CLOUDINARY UPLOAD FAILED:", error);
        return null;
    } finally {
        // Remove the local file regardless of success or failure
        try {
            fs.unlinkSync(localFilePath);
            console.log("🗑️ LOCAL FILE DELETED:", localFilePath);
        } catch (unlinkError) {
            console.error(
                "❌ ERROR: FAILED TO DELETE LOCAL FILE:",
                unlinkError
            );
        }
    }
};

export { uploadOnCloudinary };
