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