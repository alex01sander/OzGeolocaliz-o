import { expect } from "chai";
import sinon from "sinon";
import axios from "axios";
import GeoLib from "../../utils/lib";

describe("GeoLib - Unit Tests", () => {
  let axiosGetStub: sinon.SinonStub;

  beforeEach(() => {
    axiosGetStub = sinon.stub(axios, "get");
  });

  afterEach(() => {
    axiosGetStub.restore();
  });

  describe("getAddressFromCoordinates", () => {
    it("should return correct address when API responds successfully", async () => {
      const mockResponse = {
        data: {
          results: [
            {
              formatted_address:
                "1600 Amphitheatre Parkway, Mountain View, CA 94043, EUA",
            },
          ],
        },
      };

      axiosGetStub.resolves(mockResponse);

      const coordinates: [number, number] = [37.4224764, -122.0842499];

      const address = await GeoLib.getAddressFromCoordinates(coordinates);

      expect(address).to.equal(
        "1600 Amphitheatre Parkway, Mountain View, CA 94043, EUA",
      );

      expect(axiosGetStub.calledOnce).to.be.true;
      const calledUrl = axiosGetStub.firstCall.args[0];
      expect(calledUrl).to.include(
        `latlng=${coordinates[0]},${coordinates[1]}`,
      );
    });

    it("should throw error when no address is found", async () => {
      const mockResponse = {
        data: {
          results: [],
        },
      };

      axiosGetStub.resolves(mockResponse);

      const coordinates: [number, number] = [0, 0];

      try {
        await GeoLib.getAddressFromCoordinates(coordinates);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.equal(
          "Error getting address: No address found for these coordinates.",
        );
      }
    });
  });

  describe("getCoordinatesFromAddress", () => {
    it("should return correct coordinates when API responds successfully", async () => {
      const mockResponse = {
        data: {
          results: [
            {
              geometry: {
                location: {
                  lat: 37.4224764,
                  lng: -122.0842499,
                },
              },
            },
          ],
        },
      };

      axiosGetStub.resolves(mockResponse);

      const address = "Mountain View, CA";

      const coordinates = await GeoLib.getCoordinatesFromAddress(address);

      expect(coordinates).to.deep.equal([37.4224764, -122.0842499]);

      expect(axiosGetStub.calledOnce).to.be.true;
      const calledUrl = axiosGetStub.firstCall.args[0];
      expect(calledUrl).to.include(`address=${encodeURIComponent(address)}`);
    });

    it("should throw error when no coordinates are found", async () => {
      const mockResponse = {
        data: {
          results: [],
        },
      };

      axiosGetStub.resolves(mockResponse);

      const address = "Non-Existent Address";

      try {
        await GeoLib.getCoordinatesFromAddress(address);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Error getting coordinates");
      }
    });
  });
});
