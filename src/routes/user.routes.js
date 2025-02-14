import { Router } from "express";
import {
    changeCurrentPassword,
    getCurrentUser,
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
router.route("/channel/:username").get(optionalVerifyJWT, getChannelDetails);

router.route("/").post(verifyJWT, changeCurrentPassword);

router.route("/update-fullname").post(verifyJWT, updateFullName);

router.route("/update-avatar").post(verifyJWT, updateUserAvatar);
router.route("/update-cover-image").post(verifyJWT, updateUserCoverImage);

export default router;
