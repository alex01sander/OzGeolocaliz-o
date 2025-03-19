import * as mongoose from "mongoose";
import supertest from "supertest";
import * as sinon from "sinon";
import { faker } from "@faker-js/faker";
import { expect } from "chai";
import express from "express";
import bodyParser from "body-parser";

import { UserModel } from "../../models/user";
import { RegionModel } from "../../models/region";
import {
  createRegion,
  getRegions,
  getRegionById,
  updateRegion,
  deleteRegion,
} from "../../controllers/regionController";

function generateValidCoordinates() {
  const centerLat = faker.location.latitude({ min: -30, max: 30 });
  const centerLng = faker.location.longitude({ min: -60, max: -30 });

  const size = 0.1;

  const points = [
    [centerLng - size, centerLat - size],
    [centerLng + size, centerLat - size],
    [centerLng + size, centerLat + size],
    [centerLng - size, centerLat + size],
    [centerLng - size, centerLat - size],
  ];

  return points;
}

describe("Region Controller - Integration Tests", () => {
  let app: express.Application;
  let sandbox: sinon.SinonSandbox;
  let mongoConnection: mongoose.Connection;
  let createdUser: any;

  before(async () => {
    app = express();
    app.use(bodyParser.json());
    app.post("/regions", createRegion);
    app.get("/regions", getRegions);
    app.get("/regions/:id", getRegionById);
    app.put("/regions/:id", updateRegion);
    app.delete("/regions/:id", deleteRegion);

    const dbName = `testdb_regions_${Date.now()}`;
    const connectionString = `mongodb://localhost:27017/${dbName}`;

    const connection = await mongoose.connect(connectionString);
    mongoConnection = connection.connection;
  });

  beforeEach(async () => {
    sandbox = sinon.createSandbox();

    createdUser = new UserModel({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      address: faker.location.streetAddress(),
      regions: [],
    });
    await createdUser.save();
  });

  afterEach(async () => {
    sandbox.restore();
    await UserModel.deleteMany({});
    await RegionModel.deleteMany({});
  });

  after(async () => {
    if (mongoConnection) {
      await mongoConnection.close();
    }
  });

  describe("Region Creation Scenarios", () => {
    it("should create a region successfully", async () => {
      const coordinates = generateValidCoordinates();
      const regionData = {
        name: faker.location.city(),
        coordinates: coordinates,
        userId: createdUser._id.toString(),
      };

      const response = await supertest(app).post("/regions").send(regionData);

      expect(response.status).to.equal(201);
      expect(response.body.name).to.equal(regionData.name);
      expect(response.body.location.coordinates[0]).to.deep.equal(coordinates);

      const updatedUser = await UserModel.findById(createdUser._id).lean();
      expect(updatedUser.regions).to.be.an("array");

      const regionIds = updatedUser.regions.map((id) => id.toString());
      expect(regionIds).to.include(response.body._id.toString());
    });

    it("should reject region creation for non-existent user", async () => {
      const coordinates = generateValidCoordinates();
      const regionData = {
        name: faker.location.city(),
        coordinates: coordinates,
        userId: new mongoose.Types.ObjectId().toString(),
      };

      const response = await supertest(app).post("/regions").send(regionData);
      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("User not found");
    });

    it("should reject region creation with invalid coordinates", async () => {
      const coordinates = [
        [0, 0],
        [1, 1],
      ];
      const regionData = {
        name: faker.location.city(),
        coordinates: coordinates,
        userId: createdUser._id.toString(),
      };

      const response = await supertest(app).post("/regions").send(regionData);
      expect(response.status).to.equal(400);
      expect(response.body.message).to.include(
        "Coordinates must form a valid, closed GeoJSON Polygon",
      );
    });
  });

  describe("Region Retrieval Scenarios", () => {
    it("should retrieve all regions", async () => {
      const coordinates = generateValidCoordinates();
      const region = new RegionModel({
        name: faker.location.city(),
        user: createdUser._id,
        location: {
          type: "Polygon",
          coordinates: [coordinates],
        },
      });
      await region.save();

      const response = await supertest(app).get("/regions");

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an("array");
      expect(response.body.length).to.be.at.least(1);
    });

    it("should retrieve a specific region by ID", async () => {
      const coordinates = generateValidCoordinates();
      const regionData = {
        name: faker.location.city(),
        user: createdUser._id,
        location: {
          type: "Polygon",
          coordinates: [coordinates],
        },
      };

      const region = new RegionModel(regionData);
      await region.save();

      const response = await supertest(app).get(`/regions/${region._id}`);

      expect(response.status).to.equal(200);
      expect(response.body.name).to.equal(regionData.name);
      expect(response.body.location.coordinates[0]).to.deep.equal(coordinates);
    });

    it("should return 404 for non-existent region", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await supertest(app).get(`/regions/${nonExistentId}`);

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("Region not found");
    });
  });

  describe("Region Update and Delete Scenarios", () => {
    it("should update a region successfully", async () => {
      const originalCoordinates = generateValidCoordinates();
      const updatedCoordinates = generateValidCoordinates();

      const regionData = {
        name: faker.location.city(),
        user: createdUser._id,
        location: {
          type: "Polygon",
          coordinates: [originalCoordinates],
        },
      };

      const region = new RegionModel(regionData);
      await region.save();

      const updateData = {
        name: "Updated Region Name",
        coordinates: updatedCoordinates,
      };

      const response = await supertest(app)
        .put(`/regions/${region._id}`)
        .send(updateData);

      expect(response.status).to.equal(200);
      expect(response.body.name).to.equal(updateData.name);
      expect(response.body.location.coordinates[0]).to.deep.equal(
        updatedCoordinates,
      );
    });

    it("should delete a region successfully", async () => {
      const coordinates = generateValidCoordinates();
      const region = new RegionModel({
        name: faker.location.city(),
        user: createdUser._id,
        location: {
          type: "Polygon",
          coordinates: [coordinates],
        },
      });
      await region.save();

      const response = await supertest(app).delete(`/regions/${region._id}`);
      expect(response.status).to.equal(200);

      const deletedRegion = await RegionModel.findById(region._id);
      expect(deletedRegion).to.be.null;
    });

    it("should return 404 when trying to update non-existent region", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = {
        name: "Updated Region Name",
        coordinates: generateValidCoordinates(),
      };

      const response = await supertest(app)
        .put(`/regions/${nonExistentId}`)
        .send(updateData);

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("Region not found");
    });
  });
});
