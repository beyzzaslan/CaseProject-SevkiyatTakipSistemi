import type {
  AdminManagedShipmentStatus,
  AdminShipment,
  AdminShipmentListResponse,
  UpdateShipmentStatusResponse,
  ShipmentWeightKind,
ShipmentWeightResponse,
WeighingRecord,
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
export async function getCompletedAdminShipments(
  token: string,
): Promise<AdminShipment[]> {
  const response =
    await apiRequest<AdminShipmentListResponse>(
      "/shipments/admin/completed",
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

export async function recordAdminShipmentWeight(
  shipmentId: number,
  kind: ShipmentWeightKind,
  weight: number,
  token: string,
): Promise<WeighingRecord> {
  const response =
    await apiRequest<ShipmentWeightResponse>(
      `/shipments/admin/${shipmentId}/weighing/${kind}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          weight,
        }),
      },
    );

  return response.weighingRecord;
}