import * as sinon from "sinon";
import { expect } from "chai";
import { faker } from "@faker-js/faker";
import mongoose from "mongoose";

import { UserModel } from "../../models/user";
import lib from "../../utils/lib";

describe("User Model - Unit Tests", () => {
  let libStub: sinon.SinonStub;
  let addressStub: sinon.SinonStub;

  beforeEach(() => {
    libStub = sinon.stub(lib, "getCoordinatesFromAddress");
    libStub.resolves([
      Number(faker.location.latitude()),
      Number(faker.location.longitude()),
    ]);

    addressStub = sinon.stub(lib, "getAddressFromCoordinates");
    addressStub.resolves(
      faker.location.streetAddress({ useFullAddress: true }),
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("Validation", () => {
    it("should validate a user with all required fields", async () => {
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        address: faker.location.streetAddress({ useFullAddress: true }),
        coordinates: [
          Number(faker.location.latitude()),
          Number(faker.location.longitude()),
        ],
      };

      const user = new UserModel(userData);
      const validationError = user.validateSync();

      expect(validationError).to.be.undefined;
    });

    it("should fail validation with invalid email", () => {
      const userData = {
        name: faker.person.fullName(),
        email: "invalid-email",
        address: faker.location.streetAddress({ useFullAddress: true }),
        coordinates: [
          Number(faker.location.latitude()),
          Number(faker.location.longitude()),
        ],
      };

      const user = new UserModel(userData);
      const validationError = user.validateSync();

      expect(validationError).to.exist;
      expect(validationError?.errors["email"]).to.exist;
    });

    it("should fail validation with short address", () => {
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        address: "123",
        coordinates: [
          Number(faker.location.latitude()),
          Number(faker.location.longitude()),
        ],
      };

      const user = new UserModel(userData);
      const validationError = user.validateSync();

      expect(validationError).to.exist;
      expect(validationError?.errors["address"]).to.exist;
    });

    it("should require either address or coordinates", async () => {
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
      };

      const user = new UserModel(userData);

      const saveStub = sinon.stub(mongoose.Model.prototype, "save");
      saveStub.rejects(
        new Error("You must provide either an address or coordinates."),
      );

      try {
        await user.save();
        expect.fail("Should have failed validation");
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.include("address or coordinates");
      }
    });
  });
});
