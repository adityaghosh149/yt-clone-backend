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
            console.log(`🚀 SERVER IS RUNNING ON PORT: ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ MONGODB CONNECTION FAILED!!", err);
    });
