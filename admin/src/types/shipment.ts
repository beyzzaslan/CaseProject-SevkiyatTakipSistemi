export type ShipmentStatus =
  | "YOLDA"
  | "SIRADA"
  | "KANTARA_CAGRILDI"
  | "KANTARDA"
  | "BOSALTIMDA"
  | "BOSALTIM_TAMAMLANDI"
  | "TAMAMLANDI";

export type AdminManagedShipmentStatus =
  | "KANTARA_CAGRILDI"
  | "KANTARDA"
  | "BOSALTIMDA"
  | "BOSALTIM_TAMAMLANDI"
  | "TAMAMLANDI";

export type AdminShipment = {
  id: number;
  vehicleId: number;
  plateNumber: string;
  materialName: string;
  status: ShipmentStatus;
  queueNumber: number | null;
  arrivalTime: string | null;
  createdAt: string;
  driverId: number;
  driverName: string;
  driverEmail: string;
};

export type AdminShipmentListResponse = {
  shipments: AdminShipment[];
};

export type UpdateShipmentStatusResponse = {
  message: string;
  shipment: {
    id: number;
    status: ShipmentStatus;
  };
};