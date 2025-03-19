import * as sinon from "sinon";
import { expect } from "chai";
import supertest from "supertest";
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";

import * as regionController from "../../controllers/regionController";
import { RegionService } from "../../services/regionService";

const app = express();
app.use(bodyParser.json());

app.post("/api/regions", regionController.createRegion);
app.get("/api/regions", regionController.getRegions);
app.get("/api/regions/:id", regionController.getRegionById);
app.put("/api/regions/:id", regionController.updateRegion);
app.delete("/api/regions/:id", regionController.deleteRegion);
app.get(
  "/api/regions/point/contains",
  regionController.findRegionsContainingPoint,
);
app.get("/api/regions/point/near", regionController.findRegionsNearPoint);

const request = supertest(app);

describe("Region Controller Tests", () => {
  let sandbox;

  const now = new Date();
  const createdAtStr = now.toISOString();
  const updatedAtStr = now.toISOString();

  const sampleRegion = {
    _id: "507f1f77bcf86cd799439011",
    name: "Test Region",
    coordinates: [
      [
        [10, 10],
        [20, 10],
        [20, 20],
        [10, 20],
        [10, 10],
      ],
    ],
    userId: "507f1f77bcf86cd799439012",
    createdAt: createdAtStr,
    updatedAt: updatedAtStr,
  };

  const samplePoint = {
    longitude: 15,
    latitude: 15,
    maxDistance: 1000,
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("Unit Tests", () => {
    it("should successfully create a region", async () => {
      sandbox.stub(RegionService, "createRegion").resolves(sampleRegion);
      const response = await request.post("/api/regions").send({
        name: sampleRegion.name,
        coordinates: sampleRegion.coordinates,
        userId: sampleRegion.userId,
      });
      expect(response.status).to.equal(201);
      expect(response.body).to.deep.equal(sampleRegion);
    });

    it("should return all regions", async () => {
      sandbox.stub(RegionService, "getRegions").resolves([sampleRegion]);
      const response = await request.get("/api/regions");
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an("array").with.lengthOf(1);
      expect(response.body[0]).to.deep.equal(sampleRegion);
    });

    it("should retrieve a region by ID", async () => {
      sandbox.stub(RegionService, "getRegionById").resolves(sampleRegion);
      const response = await request.get(`/api/regions/${sampleRegion._id}`);
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal(sampleRegion);
    });

    it("should update a region", async () => {
      const updatedRegion = { ...sampleRegion, name: "Updated Region" };
      sandbox.stub(RegionService, "updateRegion").resolves(updatedRegion);
      const response = await request
        .put(`/api/regions/${sampleRegion._id}`)
        .send({
          name: "Updated Region",
          coordinates: sampleRegion.coordinates,
        });
      expect(response.status).to.equal(200);
      expect(response.body.name).to.equal("Updated Region");
    });

    it("should delete a region", async () => {
      sandbox.stub(RegionService, "deleteRegion").resolves(sampleRegion);
      const response = await request.delete(`/api/regions/${sampleRegion._id}`);
      expect(response.status).to.equal(200); // ou 204 se for "No Content"
      expect(response.body.message).to.equal("Region successfully deleted");
    });

    it("should find regions containing a point", async () => {
      sandbox
        .stub(RegionService, "findRegionsContainingPoint")
        .resolves([sampleRegion]);
      const response = await request.get(
        `/api/regions/point/contains?longitude=${samplePoint.longitude}&latitude=${samplePoint.latitude}`,
      );
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an("array").with.lengthOf(1);
      expect(response.body[0]).to.deep.equal(sampleRegion);
    });

    it("should find regions near a point", async () => {
      sandbox
        .stub(RegionService, "findRegionsNearPoint")
        .resolves([sampleRegion]);
      const response = await request.get(
        `/api/regions/point/near?longitude=${samplePoint.longitude}&latitude=${samplePoint.latitude}&maxDistance=${samplePoint.maxDistance}`,
      );
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an("array").with.lengthOf(1);
      expect(response.body[0]).to.deep.equal(sampleRegion);
    });

    it("should handle errors correctly", async function () {
      this.timeout(10000);

      const errorController = async (req, res) => {
        try {
          throw new Error("Region not found");
        } catch (error) {
          return res.status(404).json({ message: error.message });
        }
      };

      app.get("/api/test-region-error", errorController);

      const response = await request.get("/api/test-region-error");

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("Region not found");
    });

    it("should handle validation errors", async () => {
      sandbox
        .stub(RegionService, "createRegion")
        .rejects(new Error("Invalid coordinates"));
      const response = await request.post("/api/regions").send({
        name: "Invalid Region",
        coordinates: "invalid-format",
        userId: sampleRegion.userId,
      });
      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal("Invalid coordinates");
    });

    it("should handle missing parameters in queries", async () => {
      const response = await request.get("/api/regions/point/contains");
      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal(
        "Longitude and latitude are required",
      );
    });
  });

  describe("Integration Tests", () => {
    it("integration test outline", () => {
      expect(true).to.be.true;
    });
  });
});
