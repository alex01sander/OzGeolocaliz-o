import * as sinon from "sinon";
import { expect } from "chai";
import supertest from "supertest";
import express from "express";
import bodyParser from "body-parser";
import * as regionController from "../../controllers/regionController";
import { RegionService } from "../../services/regionService";

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
};

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

describe("Region Controller - Integration Tests", () => {
  let sandbox;
  const testUserId = "507f1f77bcf86cd799439012";
  const testRegionId = "507f1f77bcf86cd799439011";

  const sampleRegion = {
    _id: testRegionId,
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
    userId: testUserId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("CRUD Operations", () => {
    it("should create a new region", async () => {
      const newRegion = {
        name: "New Test Region",
        coordinates: [
          [
            [10, 10],
            [20, 10],
            [20, 20],
            [10, 20],
            [10, 10],
          ],
        ],
        userId: testUserId,
      };

      sandbox.stub(RegionService, "createRegion").resolves({
        ...newRegion,
        _id: testRegionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await request.post("/api/regions").send(newRegion);

      expect(response.status).to.equal(HTTP_STATUS.CREATED);
      expect(response.body).to.have.property("_id");
      expect(response.body.name).to.equal(newRegion.name);
    });

    it("should get all regions", async () => {
      sandbox.stub(RegionService, "getRegions").resolves([sampleRegion]);

      const response = await request.get("/api/regions");

      expect(response.status).to.equal(HTTP_STATUS.OK);
      expect(response.body).to.be.an("array");
      expect(response.body.length).to.equal(1);
      expect(response.body[0]._id).to.equal(testRegionId);
    });

    it("should get a region by id", async () => {
      sandbox.stub(RegionService, "getRegionById").resolves(sampleRegion);

      const response = await request.get(`/api/regions/${testRegionId}`);

      expect(response.status).to.equal(HTTP_STATUS.OK);
      expect(response.body._id).to.equal(testRegionId);
      expect(response.body.name).to.equal(sampleRegion.name);
    });

    it("should update a region", async () => {
      const updatedData = {
        name: "Updated Region",
        coordinates: sampleRegion.coordinates,
      };

      const updatedRegion = {
        ...sampleRegion,
        name: "Updated Region",
      };

      sandbox.stub(RegionService, "updateRegion").resolves(updatedRegion);

      const response = await request
        .put(`/api/regions/${testRegionId}`)
        .send(updatedData);

      expect(response.status).to.equal(HTTP_STATUS.OK);
      expect(response.body._id).to.equal(testRegionId);
      expect(response.body.name).to.equal(updatedData.name);
    });

    it("should delete a region", async () => {
      sandbox.stub(RegionService, "deleteRegion").resolves(sampleRegion);

      const response = await request.delete(`/api/regions/${testRegionId}`);

      expect(response.status).to.equal(HTTP_STATUS.OK);
      expect(response.body.message).to.equal("Region successfully deleted");
    });
  });
});
