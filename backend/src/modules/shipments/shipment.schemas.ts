import { z } from "zod";

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