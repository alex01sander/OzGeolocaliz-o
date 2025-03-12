import "reflect-metadata";
import * as mongoose from "mongoose";
import * as supertest from "supertest";
import * as sinon from "sinon";
import { faker } from "@faker-js/faker";
import { expect, assert } from "chai";
import "../config/database";
import { Region, RegionModel } from "../models/region";
import GeoLib from "../utils/lib";
import server from "../server";
import { UserModel } from "../models/user";

describe("Models", () => {
  let user;
  let session;
  let geoLibStub: Partial<typeof GeoLib> = {};

  before(async () => {
    geoLibStub.getAddressFromCoordinates = sinon
      .stub(GeoLib, "getAddressFromCoordinates")
      .resolves(faker.location.streetAddress({ useFullAddress: true }));
    geoLibStub.getCoordinatesFromAddress = sinon
      .stub(GeoLib, "getCoordinatesFromAddress")
      .resolves([faker.location.latitude(), faker.location.longitude()]);

    session = await mongoose.startSession();
    user = await UserModel.create({
      name: faker.person.firstName(),
      email: faker.internet.email(),
      address: faker.location.streetAddress({ useFullAddress: true }),
    });
  });

  after(() => {
    sinon.restore();
    session.endSession();
  });

  beforeEach(() => {
    session.startTransaction();
  });

  afterEach(() => {
    session.commitTransaction();
  });

  describe("UserModel", () => {
    it("should create a user", async () => {
      const userData = {
        name: faker.person.firstName(),
        email: faker.internet.email(),
        address: faker.location.streetAddress(),
      };

      const newUser = await UserModel.create([userData]);

      expect(newUser).to.have.property("name", userData.name);
      expect(newUser).to.have.property("email", userData.email);
    });
  });

  describe("RegionModel", () => {
    it("should create a region", async () => {
      const regionData: Omit<Region, "_id"> = {
        user: user._id,
        name: faker.person.fullName(),
        coordinates: [],
        location: {
          type: "Polygon",
          coordinates: [],
        },
      };

      const [region] = await RegionModel.create([regionData]);

      expect(region).to.deep.include(regionData);
    });

    it("should rollback changes in case of failure", async () => {
      const userRecord = await UserModel.findOne({ _id: user._id })
        .select("regions")
        .lean();
      try {
        await RegionModel.create([{ user: user._id }]);
        assert.fail("Should have thrown an error");
      } catch (error) {
        const updatedUserRecord = await UserModel.findOne({ _id: user._id })
          .select("regions")
          .lean();

        expect(userRecord).to.deep.eq(updatedUserRecord);
      }
    });
  });

  it("should return a list of users", async () => {
    const response = supertest(server).get(`/user`);

    expect(response).to.have.property("status", 200);
  });

  it("should return a user", async () => {
    const response = await supertest(server).get(`/users/${user._id}`);

    expect(response).to.have.property("status", 200);
  });
});
