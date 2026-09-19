import type {
  ActiveShipment,
  ActiveShipmentResponse,
  CompletedShipment,
  CompletedShipmentResponse,
} from "../types/shipment";

import { apiGet,apiPost } from "./api";

export async function getActiveShipment(
  token: string,
): Promise<ActiveShipment | null> {
  const response = await apiGet<ActiveShipmentResponse>(
    "/shipments/active",
    token,
  );

  
  return response.shipment;
}


export async function markShipmentAsArrived(
  shipmentId: number,
  token: string,
): Promise<ActiveShipment> {
  const response = await apiPost<ActiveShipmentResponse>(
    `/shipments/${shipmentId}/arrive`,
    {},
    token,
  );

  if (!response.shipment) {
    throw new Error("Güncel sevkiyat bilgisi alınamadı.");
  }

  return response.shipment;
}

export async function getLatestCompletedShipment(
  token: string,
): Promise<CompletedShipment | null> {
  const response =
    await apiGet<CompletedShipmentResponse>(
      "/shipments/completed/latest",
      token,
    );

  return response.shipment;
}