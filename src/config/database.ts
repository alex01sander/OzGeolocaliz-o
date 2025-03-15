import mongoose from "mongoose";

const env = {
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/default-db",
};

const init = async function () {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.log("MongoDB connection failed", error);
    process.exit(1);
  }
};

export default init;
