import { RegionModel } from "../models/region";

class RegionService {
  async createRegion(regionData: any) {
    const region = new RegionModel(regionData);
    await region.save();
    return region;
  }

  async getRegions() {
    const regions = await RegionModel.find().lean();
    return regions;
  }

  async getRegionById(id: string) {
    const region = await RegionModel.findById(id).lean();
    return region;
  }

  async updateRegion(id: string, regionData: any) {
    const updatedRegion = await RegionModel.findByIdAndUpdate(id, regionData, {
      new: true,
      runValidators: true,
    });
    return updatedRegion;
  }

  async deleteRegion(id: string) {
    const region = await RegionModel.findByIdAndDelete(id);
    return region;
  }

  async findRegionsContainingPoint(lng: number, lat: number) {
    const regions = await RegionModel.find({
      location: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
        },
      },
    }).lean();
    return regions;
  }

  async findRegionsNearPoint(lng: number, lat: number, maxDistance: number) {
    const regions = await RegionModel.find({
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: maxDistance,
        },
      },
    }).lean();
    return regions;
  }
}

export default new RegionService();
