import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

class GeoLib {
  private googleApiKey = process.env.GOOGLE_API_KEY || "";
  /**
   * @swagger
   * components:
   *   schemas:
   *     Coordinates:
   *       type: array
   *       items:
   *         type: number
   *       description: Array of latitude and longitude
   *       example: [40.7128, -74.0060]
   *     Address:
   *       type: string
   *       description: Address corresponding to the given coordinates.
   *       example: "New York, NY, USA"
   */

  /**
   * @swagger
   * /geocode/address:
   *   get:
   *     summary: Get address from coordinates
   *     description: Queries the Google Geocoding API to get the address for the provided coordinates (latitude, longitude).
   *     parameters:
   *       - in: query
   *         name: lat
   *         required: true
   *         description: Latitude of the coordinates
   *         schema:
   *           type: number
   *       - in: query
   *         name: lng
   *         required: true
   *         description: Longitude of the coordinates
   *         schema:
   *           type: number
   *     responses:
   *       200:
   *         description: Address found successfully
   *         content:
   *           application/json:
   *             example:
   *               address: "New York, NY, USA"
   *       400:
   *         description: Invalid coordinates
   *       500:
   *         description: Error fetching address from coordinates
   */

  public async getAddressFromCoordinates(
    coordinates: [number, number],
  ): Promise<string> {
    const [lat, lng] = coordinates;

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.googleApiKey}`;

    try {
      console.log(`Querying address for coordinates: ${lat}, ${lng}`);

      const response = await axios.get(url);
      console.log("Geocoding API response:", response.data);

      const address =
        response.data.results[0]?.formatted_address ||
        response.data.results[0]?.plus_code?.global_code;

      if (address) {
        return address;
      } else {
        throw new Error("No address found for these coordinates.");
      }
    } catch (error) {
      console.error("Error getting address:", error);
      throw new Error("Error getting address: " + error.message);
    }
  }

  /**
   * @swagger
   * /geocode/coordinates:
   *   get:
   *     summary: Get coordinates from address
   *     description: Queries the Google Geocoding API to get the coordinates (latitude, longitude) for the provided address.
   *     parameters:
   *       - in: query
   *         name: address
   *         required: true
   *         description: Address to geocode
   *         schema:
   *           type: string
   *       - in: query
   *         name: key
   *         description: Google API key (optional in URL, provided by env)
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Coordinates found successfully
   *         content:
   *           application/json:
   *             example:
   *               coordinates: [40.7128, -74.0060]
   *       400:
   *         description: Invalid address or address not found
   *       500:
   *         description: Error fetching coordinates from address
   */
  public async getCoordinatesFromAddress(
    address: string,
  ): Promise<[number, number]> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.googleApiKey}`;

    try {
      console.log(`Querying coordinates for address: ${address}`);
      const response = await axios.get(url);
      console.log("Geocoding API response:", response.data);

      const location = response.data.results[0]?.geometry?.location;

      if (location) {
        const lat: number = location.lat;
        const lng: number = location.lng;
        return [lat, lng];
      } else {
        throw new Error("No coordinates found for this address.");
      }
    } catch (error) {
      console.error("Error getting coordinates:", error);
      throw new Error(
        `Error getting coordinates: ${error.response?.status || "Unknown error"} - ${error.message}`,
      );
    }
  }
}

export default new GeoLib();
