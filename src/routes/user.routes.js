import { Router } from "express";
import multer from "multer";
import {
    changeCurrentPassword,
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory,
    loginUser,
    logOutUser,
    refreshAccessToken,
    registerUser,
    updateFullName,
    updateUserAvatar,
    updateUserCoverImage,
} from "../controllers/user.controller.js";
import {
    optionalVerifyJWT,
    verifyJWT,
} from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser
);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/refresh-token").post(refreshAccessToken);

router.route("/currrent-user").get(verifyJWT, getCurrentUser);
router
    .route("/channel/:username")
    .get(optionalVerifyJWT, getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getWatchHistory);

router
    .route("/change-password")
    .post(verifyJWT, multer().none(), changeCurrentPassword);

router
    .route("/update-fullname")
    .patch(verifyJWT, multer().none(), updateFullName);
router
    .route("/update-avatar")
    .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
    .route("/update-cover-image")
    .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

export default router;
