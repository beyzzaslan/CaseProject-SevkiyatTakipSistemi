import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware.js";
import { findActiveShipmentByDriverId } from "./shipment.service.js";

export const shipmentRouter = Router();

shipmentRouter.get(
  "/active",
  requireAuth,
  async (request, response) => {
    const auth = request.auth;

    if (!auth) {
      response.status(401).json({
        message: "Bu işlem için giriş yapmalısınız.",
      });
      return;
    }

    if (auth.role !== "DRIVER") {
      response.status(403).json({
        message: "Bu işlem yalnızca şoförler içindir.",
      });
      return;
    }

    try {
      const shipment = await findActiveShipmentByDriverId(
        auth.userId,
      );

      response.status(200).json({
        shipment,
      });
    } catch (error) {
      console.error("Active shipment request failed:", error);

      response.status(500).json({
        message:
          "Aktif sevkiyat alınırken bir hata oluştu.",
      });
    }
  },
);