import mongoose from "mongoose";

const env = {
  MONGO_URI:
    "mongodb://root:example@127.0.0.1:27021/oz-tech-test?authSource=admin",
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

export default init();
