import type {
  ActiveShipment,
  ActiveShipmentResponse,
} from "../types/shipment";

import { apiGet } from "./api";

export async function getActiveShipment(
  token: string,
): Promise<ActiveShipment | null> {
  const response = await apiGet<ActiveShipmentResponse>(
    "/shipments/active",
    token,
  );

  return response.shipment;
}