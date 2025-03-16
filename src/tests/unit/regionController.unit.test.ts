import * as sinon from "sinon";
import { expect } from "chai";
import supertest from "supertest";
import express from "express";
import bodyParser from "body-parser";
import { faker } from "@faker-js/faker";
import mongoose from "mongoose";

import {
  createRegion,
  getRegions,
  getRegionById,
  updateRegion,
  deleteRegion,
} from "../../controllers/regionController";
import { UserModel } from "../../models/user";
import { RegionModel } from "../../models/region";

describe("Region Controller - Unit Tests", () => {
  let app: express.Application;
  let sandbox: sinon.SinonSandbox;

  before(() => {
    app = express();
    app.use(bodyParser.json());
    app.post("/regions", createRegion);
    app.get("/regions", getRegions);
    app.get("/regions/:id", getRegionById);
    app.put("/regions/:id", updateRegion);
    app.delete("/regions/:id", deleteRegion);
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("Create Region Validation", () => {
    it("should reject request without name", async () => {
      const userData = {
        coordinates: [
          [0, 0],
          [1, 1],
          [1, 0],
          [0, 0],
        ],
        userId: new mongoose.Types.ObjectId().toString(),
      };

      const response = await supertest(app).post("/regions").send(userData);

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal("All fields are required");
    });

    it("should reject request without coordinates", async () => {
      const userData = {
        name: faker.location.city(),
        userId: new mongoose.Types.ObjectId().toString(),
      };

      const response = await supertest(app).post("/regions").send(userData);

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal("All fields are required");
    });

    it("should reject request without userId", async () => {
      const userData = {
        name: faker.location.city(),
        coordinates: [
          [0, 0],
          [1, 1],
          [1, 0],
          [0, 0],
        ],
      };

      const response = await supertest(app).post("/regions").send(userData);

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal("All fields are required");
    });
  });
});
