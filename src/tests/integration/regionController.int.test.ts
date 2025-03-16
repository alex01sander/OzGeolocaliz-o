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

    try {
      const connection = await mongoose.connect(connectionString);
      mongoConnection = connection.connection;
    } catch (error) {
      console.error("Database connection error:", error);
      throw error;
    }
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
      const regionData = {
        name: faker.location.city(),
        coordinates: [
          [0, 0],
          [1, 1],
          [1, 0],
          [0, 0],
        ],
        userId: createdUser._id.toString(),
      };

      const response = await supertest(app).post("/regions").send(regionData);

      expect(response.status).to.equal(201);
      expect(response.body.name).to.equal(regionData.name);
      expect(response.body.coordinates).to.deep.equal(regionData.coordinates);

      const updatedUser = await UserModel.findById(createdUser._id);
      expect(updatedUser.regions).to.have.lengthOf(1);
      expect(updatedUser.regions[0].toString()).to.equal(response.body._id);
    });

    it("should reject region creation for non-existent user", async () => {
      const regionData = {
        name: faker.location.city(),
        coordinates: [
          [0, 0],
          [1, 1],
          [1, 0],
          [0, 0],
        ],
        userId: new mongoose.Types.ObjectId().toString(),
      };

      const response = await supertest(app).post("/regions").send(regionData);

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("User not found");
    });
  });

  describe("Region Retrieval Scenarios", () => {
    it("should retrieve all regions", async () => {
      const regionData1 = {
        name: faker.location.city(),
        coordinates: [
          [0, 0],
          [1, 1],
          [1, 0],
          [0, 0],
        ],
        user: createdUser._id,
        location: {
          type: "Polygon",
          coordinates: [
            [0, 0],
            [1, 1],
            [1, 0],
            [0, 0],
          ],
        },
      };
      const regionData2 = {
        name: faker.location.city(),
        coordinates: [
          [2, 2],
          [3, 3],
          [3, 2],
          [2, 2],
        ],
        user: createdUser._id,
        location: {
          type: "Polygon",
          coordinates: [
            [2, 2],
            [3, 3],
            [3, 2],
            [2, 2],
          ],
        },
      };

      const region1 = new RegionModel(regionData1);
      const region2 = new RegionModel(regionData2);
      await region1.save();
      await region2.save();

      const response = await supertest(app).get("/regions");

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an("array");
      expect(response.body).to.have.lengthOf(2);
    });

    it("should retrieve a specific region by ID", async () => {
      const regionData = {
        name: faker.location.city(),
        coordinates: [
          [0, 0],
          [1, 1],
          [1, 0],
          [0, 0],
        ],
        user: createdUser._id,
        location: {
          type: "Polygon",
          coordinates: [
            [0, 0],
            [1, 1],
            [1, 0],
            [0, 0],
          ],
        },
      };

      const region = new RegionModel(regionData);
      await region.save();

      const response = await supertest(app).get(`/regions/${region._id}`);

      expect(response.status).to.equal(200);
      expect(response.body.name).to.equal(regionData.name);
      expect(response.body.coordinates).to.deep.equal(regionData.coordinates);
    });
  });

  describe("Region Update and Delete Scenarios", () => {
    it("should update a region successfully", async () => {
      const regionData = {
        name: faker.location.city(),
        coordinates: [
          [0, 0],
          [1, 1],
          [1, 0],
          [0, 0],
        ],
        user: createdUser._id,
        location: {
          type: "Polygon",
          coordinates: [
            [0, 0],
            [1, 1],
            [1, 0],
            [0, 0],
          ],
        },
      };

      const region = new RegionModel(regionData);
      await region.save();

      const updateData = {
        name: "Updated Region Name",
        coordinates: [
          [2, 2],
          [3, 3],
          [3, 2],
          [2, 2],
        ],
        location: {
          type: "Polygon",
          coordinates: [
            [2, 2],
            [3, 3],
            [3, 2],
            [2, 2],
          ],
        },
      };

      const response = await supertest(app)
        .put(`/regions/${region._id}`)
        .send(updateData);

      expect(response.status).to.equal(200);
      expect(response.body.name).to.equal(updateData.name);
      expect(response.body.coordinates).to.deep.equal(updateData.coordinates);
    });

    it("should delete a region successfully", async () => {
      const regionData = {
        name: faker.location.city(),
        coordinates: [
          [0, 0],
          [1, 1],
          [1, 0],
          [0, 0],
        ],
        user: createdUser._id,
        location: {
          type: "Polygon",
          coordinates: [
            [0, 0],
            [1, 1],
            [1, 0],
            [0, 0],
          ],
        },
      };

      const region = new RegionModel(regionData);
      await region.save();

      const response = await supertest(app).delete(`/regions/${region._id}`);

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal("Region successfully deleted"); // Corrigido aqui

      const deletedRegion = await RegionModel.findById(region._id);
      expect(deletedRegion).to.be.null;
    });
  });
});
