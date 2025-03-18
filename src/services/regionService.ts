import { RegionModel } from "../models/region";
import { UserModel } from "../models/user";

type Coordinate = [number, number];

export class RegionService {
  static async createRegion(
    name: string,
    coordinates: Coordinate[],
    userId: string,
  ) {
    if (
      coordinates.length < 4 ||
      coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
      coordinates[0][1] !== coordinates[coordinates.length - 1][1]
    ) {
      throw new Error(
        "Coordinates must form a valid, closed GeoJSON Polygon with at least 4 points.",
      );
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const region = new RegionModel({
      name,
      user: userId,
      location: {
        type: "Polygon",
        coordinates: [coordinates],
      },
    });

    await region.save();
    return region;
  }

  static async updateRegion(
    id: string,
    name?: string,
    coordinates?: Coordinate[],
  ) {
    const region = await RegionModel.findById(id);
    if (!region) {
      throw new Error("Region not found");
    }

    if (name) region.name = name;

    if (coordinates) {
      if (!Array.isArray(coordinates)) {
        throw new Error("Coordinates must be a valid array");
      }

      let validCoordinates: Coordinate[] = [...coordinates];
      if (
        !validCoordinates.length ||
        validCoordinates[0][0] !==
          validCoordinates[validCoordinates.length - 1][0] ||
        validCoordinates[0][1] !==
          validCoordinates[validCoordinates.length - 1][1]
      ) {
        validCoordinates.push([...validCoordinates[0]]);
      }

      if (validCoordinates.length < 4) {
        throw new Error(
          "A polygon must have at least 4 points (including the closing point)",
        );
      }

      region.location = {
        type: "Polygon",
        coordinates: [validCoordinates],
      };
    }

    await region.save();
    return region;
  }

  static async getRegions() {
    return await RegionModel.find().lean();
  }

  static async getRegionById(id: string) {
    const region = await RegionModel.findById(id).lean();
    if (!region) {
      throw new Error("Region not found");
    }
    return region;
  }

  static async deleteRegion(id: string) {
    const region = await RegionModel.findByIdAndDelete(id);
    if (!region) {
      throw new Error("Region not found");
    }
    return region;
  }

  static async findRegionsContainingPoint(longitude: number, latitude: number) {
    if (
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      throw new Error("Coordinates out of valid range");
    }

    return await RegionModel.find({
      location: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        },
      },
    }).lean();
  }

  static async findRegionsNearPoint(
    longitude: number,
    latitude: number,
    maxDistance: number,
    onlyUserRegions?: boolean,
    userId?: string,
  ) {
    if (
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      throw new Error("Coordinates out of valid range");
    }

    const query: any = {
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance,
        },
      },
    };

    if (onlyUserRegions && userId) {
      query.user = userId;
    }

    return await RegionModel.find(query).lean();
  }
}
