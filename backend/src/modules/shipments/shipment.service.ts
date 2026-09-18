import sql from "mssql";

import { getDatabasePool } from "../../database/connection.js";

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
};

export async function findActiveShipmentByDriverId(
  driverId: number,
): Promise<ActiveShipment | null> {
  const pool = await getDatabasePool();

  const shipmentResult = await pool
    .request()
    .input("driverId", sql.Int, driverId)
    .query<ActiveShipment>(`
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
      .input("driverId", sql.Int, driverId)
      .query<{ status: ShipmentStatus }>(`
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
      throw new ShipmentStatusConflictError(
        shipment.status,
      );
    }

    const lastQueueResult = await new sql.Request(transaction)
      .query<{ queueNumber: number }>(`
        SELECT TOP (1)
          queue_number AS queueNumber
        FROM dbo.shipments
          WITH (UPDLOCK, HOLDLOCK)
        WHERE
          status <> 'TAMAMLANDI'
          AND queue_number IS NOT NULL
        ORDER BY queue_number DESC;
      `);

    const lastQueueNumber =
      lastQueueResult.recordset[0]?.queueNumber ?? 0;

    const newQueueNumber = lastQueueNumber + 1;

    await new sql.Request(transaction)
      .input("shipmentId", sql.Int, shipmentId)
      .input("queueNumber", sql.Int, newQueueNumber)
      .query(`
        UPDATE dbo.shipments
        SET
          status = 'SIRADA',
          queue_number = @queueNumber,
          arrival_time = SYSUTCDATETIME(),
          updated_at = SYSUTCDATETIME()
        WHERE id = @shipmentId;
      `);

    const updatedShipmentResult =
      await new sql.Request(transaction)
        .input("shipmentId", sql.Int, shipmentId)
        .query<ActiveShipment>(`
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

    const updatedShipment =
      updatedShipmentResult.recordset[0];

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
        console.error(
          "Arrival transaction rollback failed:",
          rollbackError,
        );
      }
    }

    throw error;
  }
}

export async function findAllActiveShipments(): Promise<
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
        users.id AS driverId,
        users.full_name AS driverName,
        users.email AS driverEmail
      FROM dbo.shipments AS shipments
      INNER JOIN dbo.vehicles AS vehicles
        ON vehicles.id = shipments.vehicle_id
      INNER JOIN dbo.users AS users
        ON users.id = vehicles.driver_id
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