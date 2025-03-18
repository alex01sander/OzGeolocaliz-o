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
import { STATUS_CODES } from "http";

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

      expect(response.status).to.equal(STATUS_CODES.OK);
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

  describe("PUT /users/:id", () => {
    it("should update a user successfully", async () => {
      const testUser = testUsers[0];
      const newName = faker.person.fullName();

      const requestBody = { name: newName };

      console.log("Trying to update user with ID:", testUser._id);
      console.log("Request body:", JSON.stringify(requestBody));

      const response = await supertest(app)
        .put(`/api/users/${testUser._id}`)
        .send(requestBody);

      console.log("API Response (status):", response.status);
      console.log("API Response (body):", JSON.stringify(response.body));

      if (response.status === 500) {
        console.log(
          "Error 500 received. Error message:",
          response.body.message || "No message",
        );
        console.log("Error 500 details:", response.body.error || "No details");
      }

      const updatedUser = await UserModel.findById(testUser._id).lean();
      console.log("User in the database after update attempt:", updatedUser);
    });

    it("should return 404 when user to update is not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const response = await supertest(app)
        .put(`/api/users/${nonExistentId}`)
        .send({
          name: "New Name",
        });

      expect(response.status).to.equal(404);
      expect(response.body).to.have.property("message", "User not found");
    });
  });
});
