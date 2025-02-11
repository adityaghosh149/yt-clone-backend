import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path: "./.env",
});

connectDB()
    .then(() => {
        const PORT = process.env.PORT || 8080;
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port: ${PORT} ✅`);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB connection failed! ❌", err);
        process.exit(1); // Exit the process if DB connection fails
    });
