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
  grossWeight: number | null;
  tareWeight: number | null;
  netWeight: number | null;
  completedAt: string | null;
};

export type AdminShipmentListResponse = {
  shipments: AdminShipment[];
};

export type AvailableVehicle = {
  vehicleId: number;
  plateNumber: string;
  driverId: number;
  driverName: string;
  driverEmail: string;
};

export type AvailableVehicleListResponse = {
  vehicles: AvailableVehicle[];
};

export type CreateShipmentResponse = {
  message: string;
  shipment: AdminShipment;
};

export type UpdateShipmentStatusResponse = {
  message: string;
  shipment: {
    id: number;
    status: ShipmentStatus;
  };
};

export type ShipmentWeightKind =
  | "gross"
  | "tare";

export type WeighingRecord = {
  shipmentId: number;
  grossWeight: number | null;
  tareWeight: number | null;
  netWeight: number | null;
  grossWeighedAt: string | null;
  tareWeighedAt: string | null;
};

export type ShipmentWeightResponse = {
  message: string;
  weighingRecord: WeighingRecord;
};
