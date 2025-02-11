import { User } from "../models/user.model.js";
import { APIError } from "../utils/apiError.js";
import { APIResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Utility Functions for Validation
const isValidEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
const isStrongPassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
        password
    );

const registerUser = asyncHandler(async (req, res) => {
    // Extract user details from request body
    const { username, email, fullName, password } = req.body;

    // Validation: Ensure all fields are provided
    if (!username || !email || !fullName || !password) {
        throw new APIError({
            statusCode: 400,
            message: "⚠️ All fields are required! 🚫",
        });
    }

    // Validate email format
    if (!isValidEmail(email)) {
        throw new APIError({
            statusCode: 400,
            message: "⚠️ Invalid email address! 📧❌",
        });
    }

    // Check if user already exists (by email or username)
    const existingUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (existingUser) {
        throw new APIError({
            statusCode: 409,
            message: "⚠️ User with this email or username already exists! 👤❌",
        });
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
        throw new APIError({
            statusCode: 400,
            message:
                "⚠️ Weak password! Must be at least 8 characters long, include uppercase, lowercase, a number, and a special character. 🔐❌",
        });
    }

    // Handle file uploads
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new APIError({
            statusCode: 400,
            message: "⚠️ Avatar image is required! 🖼️❌",
        });
    }

    // Upload avatar image to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        throw new APIError({
            statusCode: 500,
            message: "⚠️ Failed to upload avatar to Cloudinary! ☁️❌",
        });
    }

    // Upload cover image if provided
    let coverImage = "";
    if (coverImageLocalPath) {
        const uploadedCoverImage =
            await uploadOnCloudinary(coverImageLocalPath);
        if (uploadedCoverImage) coverImage = uploadedCoverImage.url;
    }

    // Create new user in the database
    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage,
    });

    // Fetch user data without sensitive fields
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new APIError({
            statusCode: 500,
            message: "⚠️ User creation failed! ❌",
        });
    }

    // Return success response
    return res.status(201).json(
        new APIResponse({
            statusCode: 201,
            data: createdUser,
            message: "🎉 User registered successfully! ✅",
        })
    );
});

export { registerUser };
