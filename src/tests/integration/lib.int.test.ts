import { expect } from "chai";
import GeoLib from "../../utils/lib";

describe("GeoLib - Integration Tests", () => {
  const TIMEOUT = 10000;

  describe("getAddressFromCoordinates", () => {
    it("should retrieve real address for known coordinates", async function () {
      this.timeout(TIMEOUT);

      const coordinates: [number, number] = [37.4224764, -122.0842499];

      try {
        const address = await GeoLib.getAddressFromCoordinates(coordinates);

        expect(address).to.be.a("string");
        expect(address.length).to.be.greaterThan(0);

        expect(address).to.include("Mountain View");
      } catch (error) {
        console.error("Error retrieving address:", error);
        throw error;
      }
    });
  });

  describe("getCoordinatesFromAddress", () => {
    it("should retrieve real coordinates for a known address", async function () {
      this.timeout(TIMEOUT);

      const address = "Google Headquarters, Mountain View, CA";

      try {
        const coordinates = await GeoLib.getCoordinatesFromAddress(address);

        expect(coordinates).to.be.an("array").with.lengthOf(2);
        expect(coordinates[0]).to.be.a("number");
        expect(coordinates[1]).to.be.a("number");

        expect(coordinates[0]).to.be.closeTo(37.4224764, 0.1);
        expect(coordinates[1]).to.be.closeTo(-122.0842499, 0.1);
      } catch (error) {
        console.error("Error retrieving coordinates:", error);
        throw error;
      }
    });
  });

  describe("Error Handling", () => {
    it("should throw error for invalid coordinates", async function () {
      this.timeout(TIMEOUT);

      const invalidCoordinates: [number, number] = [999, 999];

      try {
        await GeoLib.getAddressFromCoordinates(invalidCoordinates);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.an("error");
        expect(error.message).to.include("Error getting address");
      }
    });

    it("should throw error for non-existent address", async function () {
      this.timeout(TIMEOUT);

      const invalidAddress = "Totally Impossible and Non-Existent Address XPTO";

      try {
        await GeoLib.getCoordinatesFromAddress(invalidAddress);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.an("error");
        expect(error.message).to.include("Error getting coordinates");
      }
    });
  });
});
