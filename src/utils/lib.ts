import axios from "axios";

class GeoLib {
  private googleApiKey = process.env.GOOGLE_API_KEY || "";

  public async getAddressFromCoordinates(
    coordinates: [number, number],
  ): Promise<string> {
    const [lat, lng] = coordinates;

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.googleApiKey}`;

    try {
      const response = await axios.get(url);
      const address = response.data.results[0]?.formatted_address;

      if (address) {
        return address;
      } else {
        throw new Error("No address found for these coordinates.");
      }
    } catch (error) {
      throw new Error("Error getting address: " + error.message);
    }
  }

  public async getCoordinatesFromAddress(
    address: string,
  ): Promise<[number, number]> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.googleApiKey}`;

    try {
      const response = await axios.get(url);
      const location = response.data.results[0]?.geometry?.location;

      if (location) {
        const lat: number = location.lat;
        const lng: number = location.lng;
        return [lat, lng];
      } else {
        throw new Error("No coordinates found for this address.");
      }
    } catch (error) {
      throw new Error("Error getting coordinates: " + error.message);
    }
  }
}

export default new GeoLib();
