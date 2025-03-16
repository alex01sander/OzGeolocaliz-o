import "reflect-metadata";
import * as mongoose from "mongoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import {
  pre,
  getModelForClass,
  Prop,
  Ref,
  modelOptions,
  index,
} from "@typegoose/typegoose";

const { ObjectId } = mongoose.Types;
import { UserModel } from "./user";

class Base extends TimeStamps {
  @Prop({ required: true, default: () => new ObjectId() })
  _id: mongoose.Types.ObjectId;
}

@pre<Region>("save", async function (next) {
  const region = this as Omit<any, keyof Region> & Region;

  // Certifique-se de que o polígono esteja fechado antes de salvar
  if (region.location && region.location.coordinates) {
    region.location.coordinates = Region.closePolygon(
      region.location.coordinates,
    );
  }

  if (region.isNew) {
    const user = await UserModel.findOne({ _id: region.user });
    if (user) {
      if (!user.regions.includes(region._id)) {
        user.regions.push(region._id);
      }

      user.regions = Array.from(new Set(user.regions));
      await user.save({ session: region.$session() });
    }
  }

  next();
})
@modelOptions({ schemaOptions: { validateBeforeSave: true } })
@index({ location: "2dsphere" }) // Índice geoespacial necessário para consultas
export class Region extends Base {
  @Prop({ required: true })
  name!: string;

  @Prop({
    ref: "User",
    required: true,
    type: () => mongoose.Types.ObjectId,
  })
  user: Ref<"User">;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.Mixed,
    validate: {
      validator: function (v) {
        return (
          v &&
          v.type === "Polygon" &&
          Array.isArray(v.coordinates) &&
          Array.isArray(v.coordinates[0]) &&
          v.coordinates[0].length >= 4 && // Um polígono precisa de pelo menos 4 pontos
          Region.areCoordinatesValid(v.coordinates[0])
        );
      },
      message:
        "Location must be a valid GeoJSON Polygon with at least 4 points.",
    },
  })
  location: {
    type: "Polygon";
    coordinates: [number, number][][];
  };

  static areCoordinatesValid(coordinates: [number, number][]): boolean {
    // Verifica se as coordenadas estão dentro de limites válidos
    return coordinates.every(
      ([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
    );
  }

  static closePolygon(coordinates: [number, number][][]): [number, number][][] {
    if (coordinates.length === 0 || coordinates[0].length === 0) {
      return coordinates;
    }

    const ring = coordinates[0];
    const firstPoint = ring[0];
    const lastPoint = ring[ring.length - 1];

    if (
      !lastPoint ||
      firstPoint[0] !== lastPoint[0] ||
      firstPoint[1] !== lastPoint[1]
    ) {
      ring.push([...firstPoint]);
    }

    return coordinates;
  }
}

export const RegionModel = getModelForClass(Region);

RegionModel.createIndexes().then(() => {
  console.log("Indexes created for RegionModel");
});
