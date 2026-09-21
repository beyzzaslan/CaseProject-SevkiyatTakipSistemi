import sql from "mssql";

import { getDatabasePool } from "../../database/connection.js";
import type {
  AdminCreateShipmentInput,
  AdminUpdateShipmentStatusInput,
} from "./shipment.schemas.js";
export type ShipmentStatus =
  | "YOLDA"
  | "SIRADA"
  | "KANTARA_CAGRILDI"
  | "KANTARDA"
  | "BOSALTIMDA"
  | "BOSALTIM_TAMAMLANDI"
  | "TAMAMLANDI";

export type ActiveShipment = {
  id: number;
  vehicleId: number;
  plateNumber: string;
  materialName: string;
  status: ShipmentStatus;
  queueNumber: number | null;
  arrivalTime: Date | null;
  createdAt: Date;
};

export type AdminShipment = ActiveShipment & {
  driverId: number;
  driverName: string;
  driverEmail: string;
  grossWeight: number | null;
  tareWeight: number | null;
  netWeight: number | null;
  completedAt: Date | null;
};

export type AvailableVehicle = {
  vehicleId: number;
  plateNumber: string;
  driverId: number;
  driverName: string;
  driverEmail: string;
};

export type CompletedShipmentResult =
  ActiveShipment & {
    grossWeight: number | null;
    tareWeight: number | null;
    netWeight: number | null;
    completedAt: Date | null;
  };

export type ShipmentWeightKind = "gross" | "tare";

export type WeighingRecord = {
  shipmentId: number;
  grossWeight: number | null;
  tareWeight: number | null;
  netWeight: number | null;
  grossWeighedAt: Date | null;
  tareWeighedAt: Date | null;
};

export async function findActiveShipmentByDriverId(
  driverId: number,
): Promise<ActiveShipment | null> {
  const pool = await getDatabasePool();

  const shipmentResult = await pool
    .request()
    .input("driverId", sql.Int, driverId).query<ActiveShipment>(`
      SELECT TOP (1)
        shipments.id,
        shipments.vehicle_id AS vehicleId,
        vehicles.plate_number AS plateNumber,
        shipments.material_name AS materialName,
        shipments.status,
        shipments.queue_number AS queueNumber,
        shipments.arrival_time AS arrivalTime,
        shipments.created_at AS createdAt
      FROM dbo.shipments AS shipments
      INNER JOIN dbo.vehicles AS vehicles
        ON vehicles.id = shipments.vehicle_id
      WHERE
        vehicles.driver_id = @driverId
        AND shipments.status <> 'TAMAMLANDI'
      ORDER BY shipments.created_at DESC;
    `);

  return shipmentResult.recordset[0] ?? null;
}

export async function findLatestCompletedShipmentByDriverId(
  driverId: number,
): Promise<CompletedShipmentResult | null> {
  const pool = await getDatabasePool();

  const shipmentResult = await pool
    .request()
    .input("driverId", sql.Int, driverId)
    .query<CompletedShipmentResult>(`
      SELECT TOP (1)
        shipments.id,
        shipments.vehicle_id AS vehicleId,
        vehicles.plate_number AS plateNumber,
        shipments.material_name AS materialName,
        shipments.status,
        shipments.queue_number AS queueNumber,
        shipments.arrival_time AS arrivalTime,
        shipments.created_at AS createdAt,
        shipments.completed_at AS completedAt,
        weighing.gross_weight AS grossWeight,
        weighing.tare_weight AS tareWeight,
        weighing.net_weight AS netWeight
      FROM dbo.shipments AS shipments
      INNER JOIN dbo.vehicles AS vehicles
        ON vehicles.id = shipments.vehicle_id
      LEFT JOIN dbo.weighing_records AS weighing
        ON weighing.shipment_id = shipments.id
      WHERE
        vehicles.driver_id = @driverId
        AND shipments.status = 'TAMAMLANDI'
      ORDER BY
        shipments.completed_at DESC,
        shipments.id DESC;
    `);

  return shipmentResult.recordset[0] ?? null;
}

export class ShipmentNotFoundError extends Error {
  constructor() {
    super("Sevkiyat bulunamadı.");
    this.name = "ShipmentNotFoundError";
  }
}

export class ShipmentStatusConflictError extends Error {
  constructor(public readonly currentStatus: ShipmentStatus) {
    super("Yalnızca yoldaki sevkiyat için varış bildirilebilir.");
    this.name = "ShipmentStatusConflictError";
  }
}

export class ShipmentStatusTransitionError extends Error {
  constructor(
    public readonly currentStatus: ShipmentStatus,
    public readonly requestedStatus: ShipmentStatus,
  ) {
    super(
      `Sevkiyat ${currentStatus} durumundan ${requestedStatus} durumuna geçirilemez.`,
    );

    this.name = "ShipmentStatusTransitionError";
  }
}

export class ShipmentWeightConflictError extends Error {
  constructor(
    message: string,
    public readonly currentStatus?: ShipmentStatus,
  ) {
    super(message);
    this.name = "ShipmentWeightConflictError";
  }
}

export class ShipmentVehicleNotFoundError extends Error {
  constructor() {
    super("Seçilen şoför aracı bulunamadı.");
    this.name = "ShipmentVehicleNotFoundError";
  }
}

export class ActiveShipmentAlreadyExistsError extends Error {
  constructor() {
    super("Bu aracın zaten aktif bir sevkiyatı bulunuyor.");
    this.name = "ActiveShipmentAlreadyExistsError";
  }
}

const requiredStatusByNextStatus: Record<
  AdminUpdateShipmentStatusInput["status"],
  ShipmentStatus
> = {
  KANTARA_CAGRILDI: "SIRADA",
  KANTARDA: "KANTARA_CAGRILDI",
  BOSALTIMDA: "KANTARDA",
  BOSALTIM_TAMAMLANDI: "BOSALTIMDA",
  TAMAMLANDI: "BOSALTIM_TAMAMLANDI",
};

export async function markShipmentAsArrived(
  shipmentId: number,
  driverId: number,
): Promise<ActiveShipment> {
  const pool = await getDatabasePool();
  const transaction = new sql.Transaction(pool);

  let transactionStarted = false;

  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    transactionStarted = true;

    const shipmentResult = await new sql.Request(transaction)
      .input("shipmentId", sql.Int, shipmentId)
      .input("driverId", sql.Int, driverId).query<{ status: ShipmentStatus }>(`
        SELECT TOP (1)
          shipments.status
        FROM dbo.shipments AS shipments
          WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.vehicles AS vehicles
          ON vehicles.id = shipments.vehicle_id
        WHERE
          shipments.id = @shipmentId
          AND vehicles.driver_id = @driverId;
      `);

    const shipment = shipmentResult.recordset[0];

    if (!shipment) {
      throw new ShipmentNotFoundError();
    }

    if (shipment.status !== "YOLDA") {
      throw new ShipmentStatusConflictError(shipment.status);
    }

    const lastQueueResult = await new sql.Request(transaction).query<{
      queueNumber: number;
    }>(`
        SELECT TOP (1)
          queue_number AS queueNumber
        FROM dbo.shipments
          WITH (UPDLOCK, HOLDLOCK)
        WHERE
          status <> 'TAMAMLANDI'
          AND queue_number IS NOT NULL
        ORDER BY queue_number DESC;
      `);

    const lastQueueNumber = lastQueueResult.recordset[0]?.queueNumber ?? 0;

    const newQueueNumber = lastQueueNumber + 1;

    await new sql.Request(transaction)
      .input("shipmentId", sql.Int, shipmentId)
      .input("queueNumber", sql.Int, newQueueNumber).query(`
        UPDATE dbo.shipments
        SET
          status = 'SIRADA',
          queue_number = @queueNumber,
          arrival_time = SYSUTCDATETIME(),
          updated_at = SYSUTCDATETIME()
        WHERE id = @shipmentId;
      `);

    const updatedShipmentResult = await new sql.Request(transaction).input(
      "shipmentId",
      sql.Int,
      shipmentId,
    ).query<ActiveShipment>(`
          SELECT TOP (1)
            shipments.id,
            shipments.vehicle_id AS vehicleId,
            vehicles.plate_number AS plateNumber,
            shipments.material_name AS materialName,
            shipments.status,
            shipments.queue_number AS queueNumber,
            shipments.arrival_time AS arrivalTime,
            shipments.created_at AS createdAt
          FROM dbo.shipments AS shipments
          INNER JOIN dbo.vehicles AS vehicles
            ON vehicles.id = shipments.vehicle_id
          WHERE shipments.id = @shipmentId;
        `);

    const updatedShipment = updatedShipmentResult.recordset[0];

    if (!updatedShipment) {
      throw new ShipmentNotFoundError();
    }

    await transaction.commit();
    transactionStarted = false;

    return updatedShipment;
  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Arrival transaction rollback failed:", rollbackError);
      }
    }

    throw error;
  }
}

export async function findAllActiveShipments(): Promise<AdminShipment[]> {
  const pool = await getDatabasePool();

  const shipmentResult = await pool.request().query<AdminShipment>(`
      SELECT
        shipments.id,
        shipments.vehicle_id AS vehicleId,
        vehicles.plate_number AS plateNumber,
        shipments.material_name AS materialName,
        shipments.status,
        shipments.queue_number AS queueNumber,
        shipments.arrival_time AS arrivalTime,
        shipments.created_at AS createdAt,
        shipments.completed_at AS completedAt,
        users.id AS driverId,
        users.full_name AS driverName,
        users.email AS driverEmail,
        weighing.gross_weight AS grossWeight,
        weighing.tare_weight AS tareWeight,
        weighing.net_weight AS netWeight
        FROM dbo.shipments AS shipments
        INNER JOIN dbo.vehicles AS vehicles
        ON vehicles.id = shipments.vehicle_id
        INNER JOIN dbo.users AS users
        ON users.id = vehicles.driver_id
        LEFT JOIN dbo.weighing_records AS weighing
        ON weighing.shipment_id = shipments.id
        WHERE shipments.status <> 'TAMAMLANDI'
        ORDER BY
        CASE
          WHEN shipments.status = 'YOLDA' THEN 1
          ELSE 0
        END,
        shipments.queue_number,
        shipments.created_at;
    `);

  return shipmentResult.recordset;
}

export async function findAllCompletedShipments(): Promise<
  AdminShipment[]
> {
  const pool = await getDatabasePool();

  const shipmentResult = await pool
    .request()
    .query<AdminShipment>(`
      SELECT
        shipments.id,
        shipments.vehicle_id AS vehicleId,
        vehicles.plate_number AS plateNumber,
        shipments.material_name AS materialName,
        shipments.status,
        shipments.queue_number AS queueNumber,
        shipments.arrival_time AS arrivalTime,
        shipments.created_at AS createdAt,
        shipments.completed_at AS completedAt,
        users.id AS driverId,
        users.full_name AS driverName,
        users.email AS driverEmail,
        weighing.gross_weight AS grossWeight,
        weighing.tare_weight AS tareWeight,
        weighing.net_weight AS netWeight
      FROM dbo.shipments AS shipments
      INNER JOIN dbo.vehicles AS vehicles
        ON vehicles.id = shipments.vehicle_id
      INNER JOIN dbo.users AS users
        ON users.id = vehicles.driver_id
      LEFT JOIN dbo.weighing_records AS weighing
        ON weighing.shipment_id = shipments.id
      WHERE shipments.status = 'TAMAMLANDI'
      ORDER BY
        shipments.completed_at DESC,
        shipments.id DESC;
    `);

  return shipmentResult.recordset;
}

export async function findVehiclesAvailableForShipment(): Promise<
  AvailableVehicle[]
> {
  const pool = await getDatabasePool();

  const vehicleResult = await pool.request().query<AvailableVehicle>(`
    SELECT
      vehicles.id AS vehicleId,
      vehicles.plate_number AS plateNumber,
      users.id AS driverId,
      users.full_name AS driverName,
      users.email AS driverEmail
    FROM dbo.vehicles AS vehicles
    INNER JOIN dbo.users AS users
      ON users.id = vehicles.driver_id
    WHERE
      users.role = 'DRIVER'
      AND NOT EXISTS (
        SELECT 1
        FROM dbo.shipments AS shipments
        WHERE
          shipments.vehicle_id = vehicles.id
          AND shipments.status <> 'TAMAMLANDI'
      )
    ORDER BY users.full_name, vehicles.plate_number;
  `);

  return vehicleResult.recordset;
}

export async function createShipmentByAdmin(
  data: AdminCreateShipmentInput,
): Promise<AdminShipment> {
  const pool = await getDatabasePool();
  const transaction = new sql.Transaction(pool);
  let transactionStarted = false;

  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    transactionStarted = true;

    const vehicleResult = await new sql.Request(transaction)
      .input("vehicleId", sql.Int, data.vehicleId)
      .query<{ vehicleId: number }>(`
        SELECT vehicles.id AS vehicleId
        FROM dbo.vehicles AS vehicles WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.users AS users
          ON users.id = vehicles.driver_id
        WHERE
          vehicles.id = @vehicleId
          AND users.role = 'DRIVER';
      `);

    if (!vehicleResult.recordset[0]) {
      throw new ShipmentVehicleNotFoundError();
    }

    const activeShipmentResult = await new sql.Request(transaction)
      .input("vehicleId", sql.Int, data.vehicleId)
      .query<{ id: number }>(`
        SELECT TOP (1) id
        FROM dbo.shipments WITH (UPDLOCK, HOLDLOCK)
        WHERE
          vehicle_id = @vehicleId
          AND status <> 'TAMAMLANDI';
      `);

    if (activeShipmentResult.recordset[0]) {
      throw new ActiveShipmentAlreadyExistsError();
    }

    const insertedShipmentResult = await new sql.Request(transaction)
      .input("vehicleId", sql.Int, data.vehicleId)
      .input("materialName", sql.NVarChar(150), data.materialName)
      .query<{ id: number }>(`
        INSERT INTO dbo.shipments (
          vehicle_id,
          material_name,
          status
        )
        OUTPUT INSERTED.id
        VALUES (
          @vehicleId,
          @materialName,
          'YOLDA'
        );
      `);

    const shipmentId = insertedShipmentResult.recordset[0]?.id;

    if (!shipmentId) {
      throw new Error("Sevkiyat kaydı oluşturulamadı.");
    }

    const createdShipmentResult = await new sql.Request(transaction)
      .input("shipmentId", sql.Int, shipmentId)
      .query<AdminShipment>(`
        SELECT TOP (1)
          shipments.id,
          shipments.vehicle_id AS vehicleId,
          vehicles.plate_number AS plateNumber,
          shipments.material_name AS materialName,
          shipments.status,
          shipments.queue_number AS queueNumber,
          shipments.arrival_time AS arrivalTime,
          shipments.created_at AS createdAt,
          shipments.completed_at AS completedAt,
          users.id AS driverId,
          users.full_name AS driverName,
          users.email AS driverEmail,
          CAST(NULL AS DECIMAL(12, 2)) AS grossWeight,
          CAST(NULL AS DECIMAL(12, 2)) AS tareWeight,
          CAST(NULL AS DECIMAL(12, 2)) AS netWeight
        FROM dbo.shipments AS shipments
        INNER JOIN dbo.vehicles AS vehicles
          ON vehicles.id = shipments.vehicle_id
        INNER JOIN dbo.users AS users
          ON users.id = vehicles.driver_id
        WHERE shipments.id = @shipmentId;
      `);

    const createdShipment = createdShipmentResult.recordset[0];

    if (!createdShipment) {
      throw new Error("Oluşturulan sevkiyat okunamadı.");
    }

    await transaction.commit();
    transactionStarted = false;
    return createdShipment;
  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Shipment creation rollback failed:", rollbackError);
      }
    }

    throw error;
  }
}



export async function updateShipmentStatusByAdmin(
  shipmentId: number,
  nextStatus: AdminUpdateShipmentStatusInput["status"],
): Promise<Pick<ActiveShipment, "id" | "status">> {
  const pool = await getDatabasePool();
  const transaction = new sql.Transaction(pool);

  let transactionStarted = false;

  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    transactionStarted = true;

    const currentShipmentResult = await new sql.Request(transaction).input(
      "shipmentId",
      sql.Int,
      shipmentId,
    ).query<{ status: ShipmentStatus }>(`
        SELECT
          status
        FROM dbo.shipments WITH (UPDLOCK, HOLDLOCK)
        WHERE id = @shipmentId;
      `);

    const currentShipment = currentShipmentResult.recordset[0];

    if (!currentShipment) {
      throw new ShipmentNotFoundError();
    }

    const requiredCurrentStatus = requiredStatusByNextStatus[nextStatus];

    if (currentShipment.status !== requiredCurrentStatus) {
      throw new ShipmentStatusTransitionError(
        currentShipment.status,
        nextStatus,
      );
    }

    if (nextStatus === "BOSALTIMDA" || nextStatus === "TAMAMLANDI") {
      const weightResult = await new sql.Request(transaction).input(
        "shipmentId",
        sql.Int,
        shipmentId,
      ).query<{
        grossWeight: number | null;
        tareWeight: number | null;
      }>(`
          SELECT
            gross_weight AS grossWeight,
            tare_weight AS tareWeight
          FROM dbo.weighing_records
            WITH (UPDLOCK, HOLDLOCK)
          WHERE shipment_id = @shipmentId;
        `);

      const weighingRecord = weightResult.recordset[0];

      if (
        nextStatus === "BOSALTIMDA" &&
        (!weighingRecord || weighingRecord.grossWeight === null)
      ) {
        throw new ShipmentWeightConflictError(
          "Boşaltıma geçmeden önce brüt ağırlık kaydedilmelidir.",
          currentShipment.status,
        );
      }

      if (
        nextStatus === "TAMAMLANDI" &&
        (!weighingRecord || weighingRecord.tareWeight === null)
      ) {
        throw new ShipmentWeightConflictError(
          "Sevkiyat tamamlanmadan önce dara ağırlığı kaydedilmelidir.",
          currentShipment.status,
        );
      }
    }

    const updatedShipmentResult = await new sql.Request(transaction)
      .input("shipmentId", sql.Int, shipmentId)
      .input("nextStatus", sql.VarChar(30), nextStatus).query<
      Pick<ActiveShipment, "id" | "status">
    >(`
        UPDATE dbo.shipments
        SET
          status = @nextStatus,
          completed_at =
            CASE
              WHEN @nextStatus = 'TAMAMLANDI'
                THEN SYSUTCDATETIME()
              ELSE completed_at
            END,
          updated_at = SYSUTCDATETIME()
        OUTPUT
          INSERTED.id,
          INSERTED.status
        WHERE id = @shipmentId;
      `);

    const updatedShipment = updatedShipmentResult.recordset[0];

    if (!updatedShipment) {
      throw new ShipmentNotFoundError();
    }

    await transaction.commit();
    transactionStarted = false;

    return updatedShipment;
  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Status transaction rollback failed:", rollbackError);
      }
    }

    throw error;
  }
}

export async function recordShipmentWeight(
  shipmentId: number,
  kind: ShipmentWeightKind,
  weight: number,
): Promise<WeighingRecord> {
  const pool = await getDatabasePool();
  const transaction = new sql.Transaction(pool);

  let transactionStarted = false;

  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    transactionStarted = true;

    const shipmentResult = await new sql.Request(transaction).input(
      "shipmentId",
      sql.Int,
      shipmentId,
    ).query<{ status: ShipmentStatus }>(`
        SELECT
          status
        FROM dbo.shipments WITH (UPDLOCK, HOLDLOCK)
        WHERE id = @shipmentId;
      `);

    const shipment = shipmentResult.recordset[0];

    if (!shipment) {
      throw new ShipmentNotFoundError();
    }

    const requiredStatus: ShipmentStatus =
      kind === "gross" ? "KANTARDA" : "BOSALTIM_TAMAMLANDI";

    if (shipment.status !== requiredStatus) {
      throw new ShipmentWeightConflictError(
        kind === "gross"
          ? "Brüt ağırlık yalnızca araç kantardayken kaydedilebilir."
          : "Dara ağırlığı yalnızca boşaltım tamamlandıktan sonra kaydedilebilir.",
        shipment.status,
      );
    }

    if (kind === "gross") {
      await new sql.Request(transaction)
        .input("shipmentId", sql.Int, shipmentId)
        .input("weight", sql.Decimal(12, 2), weight).query(`
          IF EXISTS (
            SELECT 1
            FROM dbo.weighing_records WITH (
              UPDLOCK,
              HOLDLOCK
            )
            WHERE shipment_id = @shipmentId
          )
          BEGIN
            UPDATE dbo.weighing_records
            SET
              gross_weight = @weight,
              gross_weighed_at = SYSUTCDATETIME(),
              tare_weight = NULL,
              tare_weighed_at = NULL,
              net_weight = NULL,
              updated_at = SYSUTCDATETIME()
            WHERE shipment_id = @shipmentId;
          END
          ELSE
          BEGIN
            INSERT INTO dbo.weighing_records (
              shipment_id,
              gross_weight,
              gross_weighed_at
            )
            VALUES (
              @shipmentId,
              @weight,
              SYSUTCDATETIME()
            );
          END;
        `);
    } else {
      const existingWeightResult = await new sql.Request(transaction).input(
        "shipmentId",
        sql.Int,
        shipmentId,
      ).query<{ grossWeight: number | null }>(`
            SELECT
              gross_weight AS grossWeight
            FROM dbo.weighing_records
              WITH (UPDLOCK, HOLDLOCK)
            WHERE shipment_id = @shipmentId;
          `);

      const grossWeight = existingWeightResult.recordset[0]?.grossWeight;

      if (grossWeight === null || grossWeight === undefined) {
        throw new ShipmentWeightConflictError(
          "Dara ağırlığından önce brüt ağırlık kaydedilmelidir.",
          shipment.status,
        );
      }

      if (weight > grossWeight) {
        throw new ShipmentWeightConflictError(
          "Dara ağırlığı brüt ağırlıktan büyük olamaz.",
          shipment.status,
        );
      }

      await new sql.Request(transaction)
        .input("shipmentId", sql.Int, shipmentId)
        .input("weight", sql.Decimal(12, 2), weight).query(`
          UPDATE dbo.weighing_records
          SET
            tare_weight = @weight,
            tare_weighed_at = SYSUTCDATETIME(),
            net_weight = gross_weight - @weight,
            updated_at = SYSUTCDATETIME()
          WHERE shipment_id = @shipmentId;
        `);
    }

    const updatedWeightResult = await new sql.Request(transaction).input(
      "shipmentId",
      sql.Int,
      shipmentId,
    ).query<WeighingRecord>(`
          SELECT
            shipment_id AS shipmentId,
            gross_weight AS grossWeight,
            tare_weight AS tareWeight,
            net_weight AS netWeight,
            gross_weighed_at AS grossWeighedAt,
            tare_weighed_at AS tareWeighedAt
          FROM dbo.weighing_records
          WHERE shipment_id = @shipmentId;
        `);

    const weighingRecord = updatedWeightResult.recordset[0];

    if (!weighingRecord) {
      throw new ShipmentWeightConflictError(
        "Kantar kaydı oluşturulamadı.",
        shipment.status,
      );
    }

    await transaction.commit();
    transactionStarted = false;

    return weighingRecord;
  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Weight transaction rollback failed:", rollbackError);
      }
    }

    throw error;
  }
}
