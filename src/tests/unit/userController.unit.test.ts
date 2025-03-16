import * as sinon from "sinon";
import { expect } from "chai";
import supertest from "supertest";
import express from "express";
import bodyParser from "body-parser";
import { faker } from "@faker-js/faker";
import mongoose from "mongoose";

import { createUser } from "../../controllers/userController";
import { UserModel } from "../../models/user";

describe("User Creation Controller - Unit Tests", () => {
  let app: express.Application;
  let sandbox: sinon.SinonSandbox;

  before(() => {
    app = express();
    app.use(bodyParser.json());
    app.post("/users", createUser);
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("Input Validation", () => {
    it("should reject request with both address and coordinates", async () => {
      const userData = {
        name: faker.name.fullName(),
        email: faker.internet.email(),
        address: faker.address.streetAddress(),
        coordinates: [faker.address.longitude(), faker.address.latitude()],
      };

      const response = await supertest(app).post("/users").send(userData);

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal(
        "You must provide either address or coordinates, not both.",
      );
    });

    it("should reject request without address or coordinates", async () => {
      const userData = {
        name: faker.name.fullName(),
        email: faker.internet.email(),
      };

      const response = await supertest(app).post("/users").send(userData);

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal("Provide address or coordinates.");
    });
  });
});
