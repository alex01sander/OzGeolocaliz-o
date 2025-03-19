// src/tests/integration/userRoutes.int.test.ts
import sinon from "sinon";
import { expect } from "chai";
import supertest from "supertest";
import express from "express";
import mongoose from "mongoose";
import { UserModel } from "../../models/user";
import { faker } from "@faker-js/faker";
import userRouter from "../../routes/userRoutes";
import lib from "../../utils/lib";

describe("User Routes - Integration Tests", () => {
  let app: express.Application;
  let testUsers: any[] = [];

  before(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_database", {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});

    sinon
      .stub(lib, "getAddressFromCoordinates")
      .resolves("123 Test Street, Test City");
    sinon.stub(lib, "getCoordinatesFromAddress").resolves([34.0522, -118.2437]);

    testUsers = [];
    for (let i = 0; i < 3; i++) {
      const user = new UserModel({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        coordinates: [faker.location.latitude(), faker.location.longitude()],
      });
      await user.save();
      testUsers.push(user);
    }

    app = express();
    app.use(express.json());
    app.use("/api", userRouter);
  });

  afterEach(() => {
    sinon.restore();
  });

  after(async () => {
    await mongoose.connection.close();
  });

  describe("GET /users", () => {
    it("should return all users with pagination data", async () => {
      const response = await supertest(app)
        .get("/api/users")
        .query({ page: 1, limit: 10 });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("users");
      expect(response.body.users).to.be.an("array");
      expect(response.body.users.length).to.equal(3);
      expect(response.body).to.have.property("pagination");
      expect(response.body.pagination).to.have.property("totalItems", 3);
      expect(response.body.pagination).to.have.property("currentPage", 1);
      expect(response.body.pagination).to.have.property("itemsPerPage", 10);
    });
  });

  describe("GET /users/:id", () => {
    it("should return a user by ID", async () => {
      const testUser = testUsers[0];

      const response = await supertest(app).get(`/api/users/${testUser._id}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("_id", testUser._id.toString());
      expect(response.body).to.have.property("name", testUser.name);
      expect(response.body).to.have.property("email", testUser.email);
    });

    it("should return 404 when user is not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const response = await supertest(app).get(`/api/users/${nonExistentId}`);

      expect(response.status).to.equal(404);
      expect(response.body).to.have.property("message", "User not found");
    });
  });

  describe("PATCH /users/:id", () => {
    it("should update a user successfully", async () => {
      const user = new UserModel({
        name: "Test User",
        email: "test@example.com",

        address: "123 Test Street, Test City",
        coordinates: [faker.location.latitude(), faker.location.longitude()],
      });
      await user.save();

      console.log("Created user ID:", user._id);

      const newName = "Updated Name";

      const response = await supertest(app)
        .patch(`/api/users/${user._id}`)
        .send({
          name: newName,

          address: user.address,
          coordinates: user.coordinates,
        });

      console.log("Response status:", response.status);
      console.log("Response body:", response.body);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("name", newName);
    });

    it("should return 404 when user to update is not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const response = await supertest(app)
        .patch(`/api/users/${nonExistentId}`)
        .send({
          name: "New Name",

          address: "456 Non-existent Street",
          coordinates: [34.0522, -118.2437],
        });

      expect(response.status).to.equal(404);
      expect(response.body).to.have.property("message", "User not found");
    });
  });
});
