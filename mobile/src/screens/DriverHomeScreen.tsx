import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { RootStackParamList } from "../navigation/types";
import { ApiError } from "../services/api";
import { getActiveShipment } from "../services/shipmentService";
import { deleteSession, getSession } from "../services/sessionStorage";
import type { ActiveShipment, ShipmentStatus } from "../types/shipment";

type DriverHomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "DriverHome"
>;

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  YOLDA: "Yolda",
  SIRADA: "Sırada",
  KANTARA_CAGRILDI: "Kantara çağrıldı",
  KANTARDA: "Kantarda",
  BOSALTIMDA: "Boşaltımda",
  BOSALTIM_TAMAMLANDI: "Boşaltım tamamlandı",
  TAMAMLANDI: "Tamamlandı",
};

export function DriverHomeScreen({ navigation, route }: DriverHomeScreenProps) {
  const { user } = route.params;

  const [activeShipment, setActiveShipment] = useState<ActiveShipment | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadActiveShipment = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const session = await getSession();

      if (!session) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
        return;
      }

      const shipment = await getActiveShipment(session.token);

      setActiveShipment(shipment);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await deleteSession();

        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
        return;
      }

      const message =
        error instanceof ApiError ? error.message : "Aktif sevkiyat alınamadı.";

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    void loadActiveShipment();
  }, [loadActiveShipment]);

  async function handleLogout() {
    try {
      await deleteSession();

      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch {
      Alert.alert("Çıkış yapılamadı", "Lütfen tekrar deneyin.");
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hoş geldiniz</Text>

          <Text style={styles.userName}>{user.fullName}</Text>

          <Text style={styles.email}>{user.email}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Çıkış</Text>
        </Pressable>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Aktif sevkiyat</Text>

        {isLoading ? (
          <View style={styles.centeredContent}>
            <ActivityIndicator size="large" color="#17324D" />
            <Text style={styles.loadingText}>Sevkiyat yükleniyor...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.centeredContent}>
            <Text style={styles.errorTitle}>Sevkiyat alınamadı</Text>

            <Text style={styles.statusDescription}>{errorMessage}</Text>

            <Pressable
              accessibilityRole="button"
              style={styles.retryButton}
              onPress={loadActiveShipment}
            >
              <Text style={styles.retryButtonText}>Tekrar dene</Text>
            </Pressable>
          </View>
        ) : activeShipment ? (
          <View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {STATUS_LABELS[activeShipment.status]}
              </Text>
            </View>

            <Text style={styles.materialName}>
              {activeShipment.materialName}
            </Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Plaka</Text>
              <Text style={styles.infoValue}>{activeShipment.plateNumber}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sıra numarası</Text>
              <Text style={styles.infoValue}>
                {activeShipment.queueNumber ?? "-"}
              </Text>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.emptyTitle}>Aktif sevkiyat bulunmuyor</Text>

            <Text style={styles.statusDescription}>
              Yeni bir sevkiyat oluşturulduğunda burada görüntülenecek.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  welcomeText: {
    color: "#5F6F7E",
    fontSize: 15,
  },
  userName: {
    color: "#17324D",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 4,
  },
  email: {
    color: "#5F6F7E",
    fontSize: 14,
    marginTop: 4,
  },
  logoutButton: {
    borderColor: "#17324D",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logoutButtonText: {
    color: "#17324D",
    fontSize: 14,
    fontWeight: "600",
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  statusLabel: {
    color: "#5F6F7E",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  centeredContent: {
    alignItems: "center",
    paddingVertical: 24,
  },
  loadingText: {
    color: "#5F6F7E",
    fontSize: 14,
    marginTop: 12,
  },
  errorTitle: {
    color: "#B42318",
    fontSize: 18,
    fontWeight: "700",
  },
  retryButton: {
    backgroundColor: "#17324D",
    borderRadius: 8,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F1FA",
    borderRadius: 20,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusBadgeText: {
    color: "#17324D",
    fontSize: 13,
    fontWeight: "700",
  },
  materialName: {
    color: "#17324D",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    marginTop: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopColor: "#E5EAF0",
    borderTopWidth: 1,
    paddingVertical: 14,
  },
  infoLabel: {
    color: "#5F6F7E",
    fontSize: 15,
  },
  infoValue: {
    color: "#17324D",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyTitle: {
    color: "#17324D",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
  },
  statusDescription: {
    color: "#5F6F7E",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
});
