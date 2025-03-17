import * as sinon from "sinon";
import { expect } from "chai";
import supertest from "supertest";
import express from "express";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";

import { UserModel } from "../../models/user";
import userRouter from "../../routes/userRoutes";
import lib from "../../utils/lib";

describe("User Routes - Unit Tests", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api", userRouter);

    sinon.stub(lib, "getAddressFromCoordinates").resolves("123 Test Street");
    sinon.stub(lib, "getCoordinatesFromAddress").resolves([0, 0]);
  });

  afterEach(() => {
    sinon.restore();
  });
  describe("GET /users", () => {
    it("should return users with pagination data", async () => {
      const mockUsers = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: faker.person.fullName(),
          email: faker.internet.email(),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: faker.person.fullName(),
          email: faker.internet.email(),
        },
      ];

      sinon.stub(UserModel, "find").returns({
        skip: sinon.stub().returnsThis(),
        limit: sinon.stub().returnsThis(),
        lean: sinon.stub().resolves(mockUsers),
      } as any);

      sinon.stub(UserModel, "countDocuments").resolves(mockUsers.length);

      const response = await supertest(app)
        .get("/api/users")
        .query({ page: 1, limit: 10 });

      expect(response.status).to.equal(200);

      const responseBody = response.body;
      const usersArray =
        responseBody.rows || responseBody.users || responseBody;

      expect(usersArray).to.be.an("array");
      expect(usersArray.length).to.equal(2);
    });
  });

  describe("GET /users/:id", () => {
    it("should return a user by ID", async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
      };

      sinon.stub(UserModel, "findById").resolves(mockUser);

      const response = await supertest(app).get(`/api/users/${mockUser._id}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("_id", mockUser._id.toString());
      expect(response.body).to.have.property("name", mockUser.name);
      expect(response.body).to.have.property("email", mockUser.email);
    });

    it("should return 404 when user is not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      sinon.stub(UserModel, "findById").resolves(null);

      const response = await supertest(app).get(`/api/users/${nonExistentId}`);

      expect(response.status).to.equal(404);
      expect(response.body).to.have.property("message", "User not found");
    });
  });

  describe("PUT /users/:id", () => {
    it("should update a user successfully", async () => {
      const existingUser = {
        _id: new mongoose.Types.ObjectId(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
      };
      const newName = faker.person.fullName();

      const findByIdStub = sinon
        .stub(UserModel, "findById")
        .resolves(existingUser as any);

      const findByIdAndUpdateStub = sinon
        .stub(UserModel, "findByIdAndUpdate")
        .resolves({
          ...existingUser,
          name: newName,
        });

      const response = await supertest(app)
        .put(`/api/users/${existingUser._id}`)
        .send({ name: newName });

      expect(response.status).to.equal(200);
      expect(response.body.name).to.equal(newName);

      findByIdStub.restore();
      findByIdAndUpdateStub.restore();
    });

    it("should return 404 when user to update is not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const findByIdStub = sinon.stub(UserModel, "findById").resolves(null);

      const response = await supertest(app)
        .put(`/api/users/${nonExistentId}`)
        .send({ name: "New Name" });

      expect(response.status).to.equal(404);
      expect(response.body).to.have.property("message", "User not found");

      findByIdStub.restore();
    });
  });
});
