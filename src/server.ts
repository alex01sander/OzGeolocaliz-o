import express from "express";
import userRoutes from "./routes/userRoutes";
import regionRoutes from "./routes/regionRoutes";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { StatusCodes } from "http-status-codes";

const server = express();

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User and Region API",
      version: "1.0.0",
      description: "API for user and region management",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Docker Server",
      },
    ],
  },
  apis: ["./src/**/*.ts", "./**/*.ts", "./dist/**/*.js"],
};

server.use(express.json());

server.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "1800");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );

  if (req.method === "OPTIONS") {
    return res.status(StatusCodes.OK).end();
  }

  next();
});

server.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

let swaggerDocs;
try {
  swaggerDocs = swaggerJSDoc(swaggerOptions);
  console.log("Swagger loaded successfully");
} catch (error) {
  console.error("Error loading Swagger:", error);
  swaggerDocs = {};
}

server.get("/", (req, res) => {
  res.json({
    message: "API is running. Access /api-docs for documentation.",
  });
});

console.log("Registering user routes");
server.use(userRoutes);
console.log("Registering region routes");
server.use(regionRoutes);

try {
  server.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  console.log("Swagger UI configured successfully");
} catch (error) {
  console.error("Error configuring Swagger UI:", error);
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;
