import "reflect-metadata";
import * as mongoose from "mongoose";
import {
  pre,
  getModelForClass,
  Prop,
  modelOptions,
} from "@typegoose/typegoose";
import lib from "../utils/lib";

@pre<User>("save", async function (next) {
  // Validação estrita: deve ter OU endereço OU coordenadas, mas não ambos
  if (this.address && this.coordinates) {
    return next(
      new Error("Você deve fornecer endereço ou coordenadas, mas não ambos."),
    );
  }

  try {
    // Se só tem endereço, resolve coordenadas
    if (this.address && !this.coordinates) {
      const [lat, lng] = await lib.getCoordinatesFromAddress(this.address);
      this.coordinates = [lng, lat];
      console.log(
        `Coordenadas resolvidas - Endereço: ${this.address}, Coordenadas: ${this.coordinates}`,
      );
    }

    // Se só tem coordenadas, resolve endereço
    if (this.coordinates && !this.address) {
      this.address = await lib.getAddressFromCoordinates(this.coordinates);
      console.log(
        `Endereço resolvido - Coordenadas: ${this.coordinates}, Endereço: ${this.address}`,
      );
    }

    next();
  } catch (error) {
    next(error);
  }
})
@modelOptions({
  schemaOptions: {
    timestamps: true,
    validateBeforeSave: true,
  },
})
export class User {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: "E-mail inválido",
    },
  })
  email: string;

  @Prop({
    required: [
      function () {
        // Requer endereço se não tiver coordenadas
        return !this.coordinates;
      },
      "Forneça endereço ou coordenadas.",
    ],
    trim: true,
  })
  address?: string;

  @Prop({
    required: [
      function () {
        // Requer coordenadas se não tiver endereço
        return !this.address;
      },
      "Forneça endereço ou coordenadas.",
    ],
    type: () => [Number],
    validate: {
      validator: function (v) {
        return (
          v &&
          v.length === 2 &&
          v[0] >= -180 &&
          v[0] <= 180 &&
          v[1] >= -90 &&
          v[1] <= 90
        );
      },
      message: "Coordenadas inválidas. Formato: [longitude, latitude]",
    },
  })
  coordinates?: [number, number];
}

export const UserModel = getModelForClass(User);
