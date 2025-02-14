import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import multer from "multer";

const app = express();

const corsOptions = {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes import
import userRoute from "./routes/user.routes.js";

// Routes
app.use("/api/v1/users", userRoute);

export default app;
