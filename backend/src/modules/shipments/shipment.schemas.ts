import { z } from "zod";

export const adminCreateShipmentSchema = z
  .object({
    vehicleId: z.number().int().positive(),
    materialName: z
      .string()
      .trim()
      .min(2, "Malzeme adı en az 2 karakter olmalıdır.")
      .max(150, "Malzeme adı en fazla 150 karakter olabilir."),
  })
  .strict();

export type AdminCreateShipmentInput = z.infer<
  typeof adminCreateShipmentSchema
>;

export const adminUpdateShipmentStatusSchema = z
  .object({
    status: z.enum([
      "KANTARA_CAGRILDI",
      "KANTARDA",
      "BOSALTIMDA",
      "BOSALTIM_TAMAMLANDI",
      "TAMAMLANDI",
    ]),
  })
  .strict();

export type AdminUpdateShipmentStatusInput = z.infer<
  typeof adminUpdateShipmentStatusSchema
>;

export const shipmentWeightSchema = z
  .object({
    weight: z
      .number()
      .positive(
        "Ağırlık sıfırdan büyük olmalıdır.",
      )
      .max(
        9999999999.99,
        "Gönderilen ağırlık çok büyük.",
      ),
  })
  .strict();

export type ShipmentWeightInput = z.infer<
  typeof shipmentWeightSchema
>;
