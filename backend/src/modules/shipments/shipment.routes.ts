import { Router } from "express";

import {
  requireAuth,
  requireRole,
} from "../../middleware/auth.middleware.js";import {
  ShipmentNotFoundError,
  ShipmentStatusConflictError,
  findActiveShipmentByDriverId,
  findAllActiveShipments,
  markShipmentAsArrived,
} from "./shipment.service.js";
export const shipmentRouter = Router();

shipmentRouter.get(
  "/admin/active",
  requireAuth,
  requireRole("ADMIN"),
  async (_request, response) => {
    try {
      const shipments =
        await findAllActiveShipments();

      response.status(200).json({
        shipments,
      });
    } catch (error) {
      console.error(
        "Admin shipment list request failed:",
        error,
      );

      response.status(500).json({
        message:
          "Sevkiyat listesi alınırken bir hata oluştu.",
      });
    }
  },
);

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

shipmentRouter.post(
  "/:shipmentId/arrive",
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

    const shipmentId = Number(
      request.params.shipmentId,
    );

    if (
      !Number.isInteger(shipmentId) ||
      shipmentId <= 0
    ) {
      response.status(400).json({
        message: "Geçerli bir sevkiyat numarası gönderilmelidir.",
      });
      return;
    }

    try {
      const shipment = await markShipmentAsArrived(
        shipmentId,
        auth.userId,
      );

      response.status(200).json({
        shipment,
      });
    } catch (error) {
      if (error instanceof ShipmentNotFoundError) {
        response.status(404).json({
          message: error.message,
        });
        return;
      }

      if (error instanceof ShipmentStatusConflictError) {
        response.status(409).json({
          message: error.message,
          currentStatus: error.currentStatus,
        });
        return;
      }

      console.error(
        "Shipment arrival request failed:",
        error,
      );

      response.status(500).json({
        message:
          "Varış bildirimi sırasında bir hata oluştu.",
      });
    }
  },
);