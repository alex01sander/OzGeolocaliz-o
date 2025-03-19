import init from "./config/database";

(async () => {
  try {
    await init();
    console.log("MongoDB connected successfully");

    const server = await import("./server");
    console.log("Application initialized successfully");
  } catch (error) {
    console.error("Failed to initialize the application:", error);
    process.exit(1);
  }
})();
