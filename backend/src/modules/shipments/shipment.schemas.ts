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