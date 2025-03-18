import * as mongoose from "mongoose";
import supertest from "supertest";
import * as sinon from "sinon";
import { faker } from "@faker-js/faker";
import { expect } from "chai";
import express from "express";
import bodyParser from "body-parser";

import { UserModel } from "../../models/user";
import lib from "../../utils/lib";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../../controllers/userController";

describe("User Model - Integration Tests", () => {
  let app: express.Application;
  let mongoConnection: mongoose.Connection;
  let coordStub: sinon.SinonStub;
  let addressStub: sinon.SinonStub;
  let findByIdAndUpdateStub: sinon.SinonStub;

  before(async () => {
    app = express();
    app.use(bodyParser.json());

    app.post("/users", createUser);
    app.get("/users", getUsers);
    app.get("/users/:id", getUserById);
    app.put("/users/:id", updateUser);
    app.delete("/users/:id", deleteUser);

    const dbName = `testdb_users_${Date.now()}`;
    const connectionString = `mongodb://localhost:27017/${dbName}`;

    try {
      const connection = await mongoose.connect(connectionString);
      mongoConnection = connection.connection;
    } catch (error) {
      console.error("Database connection error:", error);
      throw error;
    }

    coordStub = sinon.stub(lib, "getCoordinatesFromAddress");
    coordStub.resolves([
      Number(faker.location.latitude()),
      Number(faker.location.longitude()),
    ] as [number, number]);

    addressStub = sinon.stub(lib, "getAddressFromCoordinates");
    addressStub.resolves(
      faker.location.streetAddress({ useFullAddress: true }),
    );
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
    coordStub.resetHistory();
    addressStub.resetHistory();

    if (findByIdAndUpdateStub) {
      findByIdAndUpdateStub.restore();
    }
  });

  after(async () => {
    sinon.restore();
    if (mongoConnection) {
      await mongoConnection.close();
    }
  });

  describe("User Creation", () => {
    it("should log detailed information about user creation", async () => {
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        address: faker.location.streetAddress({ useFullAddress: true }),
      };

      console.log("Test userData:", userData);

      const response = await supertest(app).post("/users").send(userData);

      console.log("Full response status:", response.status);
      console.log("Full response body:", response.body);

      expect(response.status).to.equal(201);
      expect(response.body.name).to.equal(userData.name);
      expect(response.body.email).to.equal(userData.email.toLowerCase());
      expect(response.body.address).to.equal(userData.address);
      expect(response.body.coordinates).to.be.an("array");
      expect(response.body.coordinates).to.have.lengthOf(2);
    });

    it("should create user with coordinates", async () => {
      const coordinates: [number, number] = [
        Number(faker.location.latitude()),
        Number(faker.location.longitude()),
      ];

      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        coordinates,
      };

      const response = await supertest(app).post("/users").send(userData);

      expect(response.status).to.equal(201);
      expect(response.body.name).to.equal(userData.name);
      expect(response.body.email).to.equal(userData.email.toLowerCase());
      expect(response.body.coordinates).to.deep.equal(coordinates);
    });

    it("should reject user without address or coordinates", async () => {
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
      };

      const response = await supertest(app).post("/users").send(userData);

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal("Provide address or coordinates.");
    });
  });

  describe("User Retrieval", () => {
    it("should retrieve users", async () => {
      const users = [
        {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          address: faker.location.streetAddress({ useFullAddress: true }),
        },
        {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          coordinates: [
            Number(faker.location.latitude()),
            Number(faker.location.longitude()),
          ] as [number, number],
        },
      ];

      await UserModel.create(users);

      const response = await supertest(app).get("/users");

      expect(response.status).to.equal(200);
      expect(response.body.users).to.be.an("array");
      expect(response.body.users).to.have.lengthOf(2);
    });
  });

  describe("User Update and Deletion", () => {
    it("should update a user", async () => {
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        address: faker.location.streetAddress({ useFullAddress: true }),
      };

      const user = await UserModel.create(userData);

      const updateData = {
        name: "Updated User",
        email: faker.internet.email(),
      };

      const updatedUser = {
        ...user.toObject(),
        ...updateData,
        email: updateData.email.toLowerCase(),
      };

      findByIdAndUpdateStub = sinon
        .stub(UserModel, "findByIdAndUpdate")
        .resolves(updatedUser);

      const response = await supertest(app)
        .put(`/users/${user._id}`)
        .send(updateData);

      expect(response.status).to.equal(200);
      expect(response.body.name).to.equal(updateData.name);
      expect(response.body.email).to.equal(updateData.email.toLowerCase());

      sinon.assert.calledOnce(findByIdAndUpdateStub);
      sinon.assert.calledWith(
        findByIdAndUpdateStub,
        user._id.toString(),
        sinon.match.any,
        sinon.match.any,
      );
    });

    it("should delete a user", async () => {
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        address: faker.location.streetAddress({ useFullAddress: true }),
      };

      const user = await UserModel.create(userData);

      const response = await supertest(app).delete(`/users/${user._id}`);

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal("User successfully deleted");

      const deletedUser = await UserModel.findById(user._id);
      expect(deletedUser).to.be.null;
    });
  });
});
