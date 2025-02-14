import mongoose from "mongoose";

const subscriptionSchema = mongoose.Schema(
    {
        subscriber: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        channel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timeStamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
