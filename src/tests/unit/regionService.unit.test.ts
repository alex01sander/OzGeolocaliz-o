import * as sinon from "sinon";
import { expect } from "chai";
import { RegionService } from "../../services/regionService";
import { UserModel } from "../../models/user";
import { RegionModel } from "../../models/region";
import * as mongoose from "mongoose";

type Coordinate = [number, number];

describe("Region Service - Unit Tests", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("Create Region", () => {
    it("should validate user existence before creating region", () => {
      const userId = new mongoose.Types.ObjectId();
      const coordinates: Coordinate[] = [
        [0, 0],
        [1, 1],
        [1, 0],
        [0, 0],
      ];

      const userFindByIdStub = sandbox
        .stub(UserModel, "findById")
        .resolves(null);

      return RegionService.createRegion(
        "Test Region",
        coordinates,
        userId.toString(),
      ).then(
        () => {
          expect.fail("Expected promise to be rejected");
        },
        (error) => {
          expect(error).to.be.instanceof(Error);
          expect(error.message).to.equal("User not found");
          expect(userFindByIdStub.calledOnceWith(userId.toString())).to.be.true;
        },
      );
    });

    it("should validate polygon coordinates", () => {
      const userId = new mongoose.Types.ObjectId();
      const invalidCoordinates: Coordinate[] = [
        [0, 0],
        [1, 1],
      ];

      sandbox.stub(UserModel, "findById").resolves({
        _id: userId,
      });

      return RegionService.createRegion(
        "Test Region",
        invalidCoordinates,
        userId.toString(),
      ).then(
        () => {
          expect.fail("Expected promise to be rejected");
        },
        (error) => {
          expect(error).to.be.instanceof(Error);
          expect(error.message).to.include(
            "Coordinates must form a valid, closed GeoJSON Polygon",
          );
        },
      );
    });
  });

  describe("Update Region", () => {
    it("should validate region existence before updating", () => {
      const regionId = new mongoose.Types.ObjectId();
      const coordinates: Coordinate[] = [
        [0, 0],
        [1, 1],
        [1, 0],
        [0, 0],
      ];

      const regionFindByIdStub = sandbox
        .stub(RegionModel, "findById")
        .resolves(null);

      return RegionService.updateRegion(
        regionId.toString(),
        "Updated Name",
        coordinates,
      ).then((result) => {
        expect(result).to.be.null;
        expect(regionFindByIdStub.calledOnceWith(regionId.toString())).to.be
          .true;
      });
    });
  });
});
