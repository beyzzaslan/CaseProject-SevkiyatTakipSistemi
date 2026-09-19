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
  arrivalTime: string | null;
  createdAt: string;
};

export type ActiveShipmentResponse = {
  shipment: ActiveShipment | null;
};

export type CompletedShipment = ActiveShipment & {
  grossWeight: number | null;
  tareWeight: number | null;
  netWeight: number | null;
  completedAt: string | null;
};

export type CompletedShipmentResponse = {
  shipment: CompletedShipment | null;
};
