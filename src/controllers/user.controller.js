import jwt from "jsonwebtoken";
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

const generateAccessAndRefreshTokens = async (user) => {
    try {
        // const user = await user.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return {
            accessToken,
            refreshToken,
        };
    } catch (error) {
        throw new APIError(
            500,
            "Something went wrong while generating access and refresh token"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // Extract user details from request body
    const { username, email, fullName, password } = req.body;

    // Validation: Ensure all fields are provided
    if (!username || !email || !fullName || !password) {
        throw new APIError(400, "⚠️ All fields are required! 🚫");
    }

    // Validate email format
    if (!isValidEmail(email)) {
        throw new APIError(400, "⚠️ Invalid email address! 📧❌");
    }

    // Check if user already exists (by email or username)
    const existingUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (existingUser) {
        throw new APIError(
            409,
            "⚠️ User with this email or username already exists! 👤❌"
        );
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
        throw new APIError(
            400,
            "⚠️ Weak password! Must be at least 8 characters long, include uppercase, lowercase, a number, and a special character. 🔐❌"
        );
    }

    // Handle file uploads
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new APIError(400, "⚠️ Avatar image is required! 🖼️❌");
    }

    // Upload avatar image to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        throw new APIError(
            500,
            "⚠️ Failed to upload avatar to Cloudinary! ☁️❌"
        );
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
        throw new APIError(500, "⚠️ User creation failed! ❌");
    }

    // Return success response
    return res
        .status(201)
        .json(
            new APIResponse(
                201,
                createdUser,
                "🎉 User registered successfully! ✅"
            )
        );
});

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    const { email, username, password } = req.body;

    // username or email
    if (!(email || username)) {
        throw new APIError(400, "⚠️ Username or email required");
    }

    // find the user
    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new APIError(404, "❌ User does not exist");
    }

    // password check
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new APIError(401, "🔑 Invalid user credentials");
    }

    // access and refresh token
    const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user);

    // send cookies
    const loggedInUser = {
        id: user?._id,
        username: user?.username,
        email: user?.email,
        fullName: user?.fullName,
        avatar: user?.avatar,
    };

    const options = {
        httpOnly: true,
        secure: true,
    };

    // send res
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new APIResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "✅ User logged in successfully"
            )
        );
});

const logOutUser = asyncHandler(async (req, res) => {
    const { user } = req.body;

    await User.findByIdAndUpdate(
        user?._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new APIResponse(200, {}, "✅ User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies?.refreshAccessToken || req.body.refreshAccessToken;

    if (incomingRefreshToken) {
        throw new APIError(401, "🔐 Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new APIError(401, "🚫 Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new APIError(
                401,
                "🔄 Refresh token is expired or already used!"
            );
        }

        const { newAccessToken, newRefreshToken } =
            await generateAccessAndRefreshTokens(user);

        // send cookies
        const loggedInUser = {
            id: user?._id,
            username: user?.username,
            email: user?.email,
            fullName: user?.fullName,
            avatar: user?.avatar,
        };

        const options = {
            httpOnly: true,
            secure: true,
        };

        // send res
        return res
            .status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new APIResponse(
                    200,
                    {
                        user: loggedInUser,
                        newAccessToken,
                        newRefreshToken,
                    },
                    "✅ Access token refreshed"
                )
            );
    } catch (error) {
        throw new APIError(
            401,
            error?.message || "❌ Invalid Refresh Token! 🔄🚫"
        );
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, retypeNewPassword } = req.body;

    if (!oldPassword || !newPassword || !retypeNewPassword) {
        throw new APIError(400, "⚠️ All fields are required!");
    }

    const user = req.user;
    if (!user) {
        throw new APIError(401, "🚫 Unauthorized request!");
    }

    const loggedInUser = await User.findById(user._id);
    if (!loggedInUser) {
        throw new APIError(404, "❌ User not found!");
    }

    const isPasswordCorrect = await loggedInUser.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new APIError(403, "🔑 Incorrect current password!");
    }

    if (!isStrongPassword(newPassword)) {
        throw new APIError(400, "🔐 Please enter a stronger password!");
    }

    if (newPassword !== retypeNewPassword) {
        throw new APIError(
            400,
            "⚠️ New password and confirmation do not match!"
        );
    }

    loggedInUser.password = newPassword;
    await loggedInUser.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new APIResponse(200, {}, "✅ Password changed successfully!"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new APIError(401, "🚫 Unauthorized request!");
    }

    return res.status(200).json(200, user, "Current user fetched sucessfully");
});

export {
    changeCurrentPassword,
    getCurrentUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    registerUser,
};
