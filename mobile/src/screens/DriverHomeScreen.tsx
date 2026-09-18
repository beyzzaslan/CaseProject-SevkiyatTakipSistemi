import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "../navigation/types";
import { deleteSession } from "../services/sessionStorage";

type DriverHomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "DriverHome"
>;

export function DriverHomeScreen({ navigation, route }: DriverHomeScreenProps) {
  const { user } = route.params;

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
        <Text style={styles.statusTitle}>Aktif sevkiyat bulunmuyor</Text>
        <Text style={styles.statusDescription}>
          Yeni bir sevkiyat oluşturulduğunda burada görüntülenecek.
        </Text>
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
  statusTitle: {
    color: "#17324D",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 12,
  },
  statusDescription: {
    color: "#5F6F7E",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
});
