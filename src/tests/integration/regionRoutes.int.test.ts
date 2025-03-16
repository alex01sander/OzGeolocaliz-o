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
      const generatePolygonCoordinates = () => {
        const baseLat = faker.location.latitude();
        const baseLng = faker.location.longitude();

        const points = [
          [baseLat, baseLng],
          [baseLat + 0.01, baseLng + 0.01],
          [baseLat + 0.01, baseLng - 0.01],
          [baseLat, baseLng],
        ];

        return points;
      };

      const simpleCoordinates = generatePolygonCoordinates();
      const polygonCoordinates = [generatePolygonCoordinates()];

      const testRegion = new RegionModel({
        name: "Test Direct Model",
        coordinates: simpleCoordinates,
        user: testUser._id,
        location: {
          type: "Polygon",
          coordinates: polygonCoordinates,
        },
      });

      await testRegion.save();

      const regionData = {
        name: faker.location.city(),
        coordinates: simpleCoordinates,
        userId: testUser._id.toString(),
        location: {
          type: "Polygon",
          coordinates: polygonCoordinates,
        },
      };

      const response = await supertest(app)
        .post("/api/regions")
        .send(regionData);

      if (response.status !== 201) {
        console.log("Resposta da API:", response.status, response.body);
      }

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property("_id");
      expect(response.body.name).to.equal(regionData.name);

      const savedRegion = await RegionModel.findById(response.body._id);
      expect(savedRegion).to.not.be.null;

      const updatedUser = await UserModel.findById(testUser._id);
      expect(updatedUser.regions.map((r) => r.toString())).to.include(
        response.body._id,
      );
    });

    it("should return 400 when required fields are missing", async () => {
      const response = await supertest(app).post("/api/regions").send({
        name: faker.location.city(),
      });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property("message");
    });

    it("should return 404 when user is not found", async () => {
      const generatePolygonCoordinates = () => {
        const baseLat = faker.location.latitude();
        const baseLng = faker.location.longitude();

        return [
          [baseLat, baseLng],
          [baseLat + 0.01, baseLng + 0.01],
          [baseLat + 0.01, baseLng - 0.01],
          [baseLat, baseLng],
        ];
      };

      const simpleCoordinates = generatePolygonCoordinates();
      const polygonCoordinates = [generatePolygonCoordinates()];

      const response = await supertest(app)
        .post("/api/regions")
        .send({
          name: faker.location.city(),
          coordinates: simpleCoordinates,
          location: {
            type: "Polygon",
            coordinates: polygonCoordinates,
          },
          userId: new mongoose.Types.ObjectId().toString(),
        });

      expect(response.status).to.equal(404);
      expect(response.body).to.have.property("message", "User not found");
    });
  });
});
