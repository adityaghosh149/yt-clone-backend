import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({
    path: "./.env",
});

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

        console.log(`✅ File uploaded to Cloudinary: ${response.secure_url}`);
        return response;
    } catch (error) {
        console.error(`❌ Cloudinary upload failed: ${error.message}`);
        return null;
    } finally {
        // Remove the local file regardless of success or failure
        try {
            fs.unlinkSync(localFilePath);
            console.log(`🗑️ Local file deleted: ${localFilePath}`);
        } catch (unlinkError) {
            console.error(
                `⚠️ Failed to delete local file: ${unlinkError.message}`
            );
        }
    }
};

export { uploadOnCloudinary };
