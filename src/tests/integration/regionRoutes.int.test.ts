import sinon from "sinon";
import { expect } from "chai";
import supertest from "supertest";
import express from "express";
import mongoose from "mongoose";
import { UserModel } from "../../models/user";
import { RegionModel } from "../../models/region";
import { faker } from "@faker-js/faker";
import regionRouter from "../../routes/regionRoutes";
import lib from "../../utils/lib";
import { STATUS_CODES } from "http";

describe("Region Router Integration Tests", () => {
  let testUser: any;
  let app: express.Application;

  before(async () => {
    await mongoose.connect("mongodb://localhost:27017/test_database", {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
    await RegionModel.deleteMany({});

    sinon
      .stub(lib, "getAddressFromCoordinates")
      .resolves("123 Test Street, Test City, Test Country");
    sinon.stub(lib, "getCoordinatesFromAddress").resolves([34.0522, -118.2437]);

    testUser = new UserModel({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      coordinates: [faker.location.latitude(), faker.location.longitude()],
    });
    await testUser.save();

    app = express();
    app.use(express.json());
    app.use("/api", regionRouter);
  });

  afterEach(() => {
    sinon.restore();
  });

  after(async () => {
    await mongoose.connection.close();
  });

  describe("POST /regions", () => {
    it("should create a new region successfully", async () => {
      const generateValidCoordinates = () => {
        const centerLat = faker.location.latitude({ min: -30, max: 30 });
        const centerLng = faker.location.longitude({ min: -60, max: -30 });

        const size = 0.1;

        return [
          [centerLng - size, centerLat - size],
          [centerLng + size, centerLat - size],
          [centerLng + size, centerLat + size],
          [centerLng - size, centerLat + size],
          [centerLng - size, centerLat - size],
        ];
      };

      const coordinates = generateValidCoordinates();

      const regionData = {
        name: faker.location.city(),
        coordinates: coordinates,
        userId: testUser._id.toString(),
      };

      const response = await supertest(app)
        .post("/api/regions")
        .send(regionData);

      if (response.status !== 201) {
        console.log("Resposta da API:", response.status, response.body);
      }

      expect(response.status).to.equal(STATUS_CODES.CREATED);
      expect(response.body).to.have.property("_id");
      expect(response.body.name).to.equal(regionData.name);

      expect(response.body.location.coordinates[0]).to.deep.equal(coordinates);

      const savedRegion = await RegionModel.findById(response.body._id);
      expect(savedRegion).to.not.be.null;

      const updatedUser = await UserModel.findById(testUser._id);
      expect(updatedUser.regions).to.be.an("array");

      const regionIds = updatedUser.regions.map((r) => r.toString());
      expect(regionIds).to.include(response.body._id.toString());
    });

    it("should return 500 when required fields are missing", async () => {
      const response = await supertest(app).post("/api/regions").send({
        name: faker.location.city(),
        userId: testUser._id.toString(),
      });

      expect(response.status).to.equal(STATUS_CODES.INTERNAL_SERVER_ERROR);
      expect(response.body).to.have.property("message");
    });

    it("should return 404 when user is not found", async () => {
      const coordinates = [
        [-60.1, -30.1],
        [-59.9, -30.1],
        [-59.9, -29.9],
        [-60.1, -29.9],
        [-60.1, -30.1],
      ];

      const response = await supertest(app).post("/api/regions").send({
        name: faker.location.city(),
        coordinates: coordinates,
        userId: new mongoose.Types.ObjectId().toString(),
      });

      expect(response.status).to.equal(STATUS_CODES.NOT_FOUND);
      expect(response.body).to.have.property("message", "User not found");
    });
  });
});
