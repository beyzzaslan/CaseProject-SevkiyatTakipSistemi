import { Router } from "express";

import {
  requireAuth,
  requireRole,
} from "../../middleware/auth.middleware.js";

import {
  adminUpdateShipmentStatusSchema,
  shipmentWeightSchema,
} from "./shipment.schemas.js";

import {
  ShipmentNotFoundError,
  ShipmentStatusConflictError,
  ShipmentStatusTransitionError,
  ShipmentWeightConflictError,
  findActiveShipmentByDriverId,
  findAllActiveShipments,
  findAllCompletedShipments,
  findLatestCompletedShipmentByDriverId,
  markShipmentAsArrived,
  recordShipmentWeight,
  updateShipmentStatusByAdmin,
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
  "/admin/completed",
  requireAuth,
  requireRole("ADMIN"),
  async (_request, response) => {
    try {
      const shipments =
        await findAllCompletedShipments();

      response.status(200).json({
        shipments,
      });
    } catch (error) {
      console.error(
        "Completed shipment list request failed:",
        error,
      );

      response.status(500).json({
        message:
          "Tamamlanan sevkiyatlar alınırken bir hata oluştu.",
      });
    }
  },
);

shipmentRouter.patch(
  "/admin/:shipmentId/status",
  requireAuth,
  requireRole("ADMIN"),
  async (request, response) => {
    const shipmentId = Number(
      request.params.shipmentId,
    );

    if (
      !Number.isInteger(shipmentId) ||
      shipmentId <= 0
    ) {
      response.status(400).json({
        message:
          "Geçerli bir sevkiyat numarası gönderilmelidir.",
      });
      return;
    }

    const validationResult =
      adminUpdateShipmentStatusSchema.safeParse(
        request.body,
      );

    if (!validationResult.success) {
      response.status(400).json({
        message:
          "Gönderilen sevkiyat durumu geçersiz.",
        errors: validationResult.error.flatten(),
      });
      return;
    }

    try {
      const shipment =
        await updateShipmentStatusByAdmin(
          shipmentId,
          validationResult.data.status,
        );

      response.status(200).json({
        message:
          "Sevkiyat durumu başarıyla güncellendi.",
        shipment,
      });
    } catch (error) {
      if (error instanceof ShipmentNotFoundError) {
        response.status(404).json({
          message: error.message,
        });
        return;
      }

      if (
        error instanceof
        ShipmentStatusTransitionError
      ) {
        response.status(409).json({
          message: error.message,
          currentStatus: error.currentStatus,
          requestedStatus: error.requestedStatus,
        });
        return;
      }

      if (
  error instanceof
  ShipmentWeightConflictError
) {
  response.status(409).json({
    message: error.message,
    currentStatus: error.currentStatus,
  });
  return;
}

      console.error(
        "Admin shipment status update failed:",
        error,
      );

      response.status(500).json({
        message:
          "Sevkiyat durumu güncellenirken bir hata oluştu.",
      });
    }
  },
);

shipmentRouter.post(
  "/admin/:shipmentId/weighing/:weightKind",
  requireAuth,
  requireRole("ADMIN"),
  async (request, response) => {
    const shipmentId = Number(
      request.params.shipmentId,
    );

    if (
      !Number.isInteger(shipmentId) ||
      shipmentId <= 0
    ) {
      response.status(400).json({
        message:
          "Geçerli bir sevkiyat numarası gönderilmelidir.",
      });
      return;
    }

    const weightKind =
      request.params.weightKind;

    if (
      weightKind !== "gross" &&
      weightKind !== "tare"
    ) {
      response.status(400).json({
        message:
          "Ağırlık türü gross veya tare olmalıdır.",
      });
      return;
    }

    const validationResult =
      shipmentWeightSchema.safeParse(
        request.body,
      );

    if (!validationResult.success) {
      response.status(400).json({
        message:
          "Gönderilen ağırlık geçersiz.",
        errors: validationResult.error.flatten(),
      });
      return;
    }

    try {
      const weighingRecord =
        await recordShipmentWeight(
          shipmentId,
          weightKind,
          validationResult.data.weight,
        );

      response.status(200).json({
        message:
          weightKind === "gross"
            ? "Brüt ağırlık kaydedildi."
            : "Dara ağırlığı kaydedildi.",
        weighingRecord,
      });
    } catch (error) {
      if (error instanceof ShipmentNotFoundError) {
        response.status(404).json({
          message: error.message,
        });
        return;
      }

      if (
        error instanceof
        ShipmentWeightConflictError
      ) {
        response.status(409).json({
          message: error.message,
          currentStatus: error.currentStatus,
        });
        return;
      }

      console.error(
        "Shipment weight request failed:",
        error,
      );

      response.status(500).json({
        message:
          "Kantar ağırlığı kaydedilirken bir hata oluştu.",
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

shipmentRouter.get(
  "/completed/latest",
  requireAuth,
  async (request, response) => {
    const auth = request.auth;

    if (!auth) {
      response.status(401).json({
        message:
          "Bu işlem için giriş yapmalısınız.",
      });
      return;
    }

    if (auth.role !== "DRIVER") {
      response.status(403).json({
        message:
          "Bu işlem yalnızca şoförler içindir.",
      });
      return;
    }

    try {
      const shipment =
        await findLatestCompletedShipmentByDriverId(
          auth.userId,
        );

      response.status(200).json({
        shipment,
      });
    } catch (error) {
      console.error(
        "Completed shipment result request failed:",
        error,
      );

      response.status(500).json({
        message:
          "Tamamlanan sevkiyat sonucu alınırken bir hata oluştu.",
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