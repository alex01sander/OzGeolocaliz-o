import * as sinon from "sinon";
import { expect } from "chai";
import { faker } from "@faker-js/faker";
import mongoose from "mongoose";

import { RegionModel } from "../../models/region";
import { UserModel } from "../../models/user";

describe("Region Model - Unit Tests", () => {
  let userStub: sinon.SinonStubbedInstance<any>;

  beforeEach(() => {
    userStub = sinon.stub(UserModel, "findOne");
    userStub.resolves({
      _id: new mongoose.Types.ObjectId(),
      regions: [],
      save: sinon.stub().resolves(),
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("Validation", () => {
    it("should validate a region with all required fields", async () => {
      const userId = new mongoose.Types.ObjectId();
      const regionData = {
        name: faker.location.city(),
        user: userId,
        location: {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [1, 1],
              [1, 0],
              [0, 0],
            ],
          ],
        },
      };

      const region = new RegionModel(regionData);

      try {
        const validationResult = region.validateSync();
        expect(validationResult).to.be.undefined;
      } catch (error) {
        console.error("Validation Error:", error);
        throw error;
      }
    });

    it("should fail validation without name", () => {
      const userId = new mongoose.Types.ObjectId();
      const regionData = {
        user: userId,
        location: {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [1, 1],
              [1, 0],
              [0, 0],
            ],
          ],
        },
      };

      const region = new RegionModel(regionData);
      const validationError = region.validateSync();

      expect(validationError).to.exist;
      expect(validationError?.errors["name"]).to.exist;
    });

    it("should fail validation without coordinates", () => {
      const userId = new mongoose.Types.ObjectId();
      const regionData = {
        name: faker.location.city(),
        user: userId,
        location: {
          type: "Polygon",
          coordinates: [],
        },
      };

      const region = new RegionModel(regionData);
      const validationError = region.validateSync();

      expect(validationError).to.exist;
      expect(validationError?.errors["location"]).to.exist;
    });
  });
});
