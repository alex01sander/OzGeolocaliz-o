import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

class GeoLib {
  private googleApiKey = process.env.GOOGLE_API_KEY || "";

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
