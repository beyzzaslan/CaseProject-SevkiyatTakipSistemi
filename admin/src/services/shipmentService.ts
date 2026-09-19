import type {
  AdminManagedShipmentStatus,
  AdminShipment,
  AdminShipmentListResponse,
  UpdateShipmentStatusResponse,
} from "../types/shipment";

import { apiRequest } from "./api";

export async function getAdminShipments(
  token: string,
): Promise<AdminShipment[]> {
  const response =
    await apiRequest<AdminShipmentListResponse>(
      "/shipments/admin/active",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

  return response.shipments;
}

export async function updateAdminShipmentStatus(
  shipmentId: number,
  status: AdminManagedShipmentStatus,
  token: string,
): Promise<UpdateShipmentStatusResponse> {
  return apiRequest<UpdateShipmentStatusResponse>(
    `/shipments/admin/${shipmentId}/status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status,
      }),
    },
  );
}