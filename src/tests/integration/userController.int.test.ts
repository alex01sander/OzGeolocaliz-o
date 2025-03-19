import * as mongoose from "mongoose";
import supertest from "supertest";
import * as sinon from "sinon";
import { faker } from "@faker-js/faker";
import { expect } from "chai";
import express from "express";
import bodyParser from "body-parser";

import { UserModel } from "../../models/user";
import lib from "../../utils/lib";
import { createUser } from "../../controllers/userController";

describe("User Creation Controller - Integration Tests", () => {
  let app: express.Application;
  let sandbox: sinon.SinonSandbox;
  let mongoConnection: mongoose.Connection;

  before(async () => {
    app = express();
    app.use(bodyParser.json());
    app.post("/users", createUser);

    const dbName = `testdb_integration_${Date.now()}`;
    const connectionString = `mongodb://localhost:27017/${dbName}`;

    try {
      const connection = await mongoose.connect(connectionString);
      mongoConnection = connection.connection;
    } catch (error) {
      console.error("Database connection error:", error);
      throw error;
    }
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(async () => {
    sandbox.restore();
    await UserModel.deleteMany({});
  });

  after(async () => {
    if (mongoConnection) {
      await mongoConnection.close();
    }
  });

  describe("User Creation Scenarios", () => {
    it("should create user with address and generate coordinates", async () => {
      const coordStub = sandbox
        .stub(lib, "getCoordinatesFromAddress")
        .resolves([faker.location.longitude(), faker.location.latitude()]);

      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        address: faker.location.streetAddress(),
      };

      const response = await supertest(app).post("/users").send(userData);

      expect(response.status).to.equal(201);
      expect(response.body.name).to.equal(userData.name);
      expect(response.body.email.toLowerCase()).to.equal(
        userData.email.toLowerCase(),
      );
      expect(response.body.address).to.equal(userData.address);
      expect(response.body.coordinates).to.be.an("array");
      expect(response.body.coordinates).to.have.lengthOf(2);

      sinon.assert.calledOnce(coordStub);
    });

    it("should create user with coordinates and generate address", async () => {
      const addressStub = sandbox
        .stub(lib, "getAddressFromCoordinates")
        .resolves(faker.location.streetAddress());

      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        coordinates: [faker.location.longitude(), faker.location.latitude()],
      };

      const response = await supertest(app).post("/users").send(userData);

      expect(response.status).to.equal(201);
      expect(response.body.name).to.equal(userData.name);
      expect(response.body.email.toLowerCase()).to.equal(
        userData.email.toLowerCase(),
      );
      expect(response.body.coordinates).to.deep.equal(userData.coordinates);
      expect(response.body.address).to.be.a("string");

      sinon.assert.calledOnce(addressStub);
    });
  });

  describe("Error Handling Scenarios", () => {
    it("should handle failure when coordinates cannot be found", async () => {
      const coordStub = sandbox
        .stub(lib, "getCoordinatesFromAddress")
        .resolves(null);

      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        address: faker.location.streetAddress(),
      };

      const response = await supertest(app).post("/users").send(userData);

      expect(response.status).to.equal(500);
      expect(response.body.message).to.equal("Internal server error");
      expect(response.body.error).to.equal(
        "Coordinates not found for the address.",
      );

      sinon.assert.calledOnce(coordStub);
    });

    it("should handle failure when address cannot be found", async () => {
      const addressStub = sandbox
        .stub(lib, "getAddressFromCoordinates")
        .resolves(null);

      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        coordinates: [faker.location.longitude(), faker.location.latitude()],
      };

      const response = await supertest(app).post("/users").send(userData);

      expect(response.status).to.equal(500);
      expect(response.body.message).to.equal("Internal server error");
      expect(response.body.error).to.equal(
        "Address not found for coordinates.",
      );

      sinon.assert.calledOnce(addressStub);
    });
  });
});
