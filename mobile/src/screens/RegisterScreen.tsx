import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { RegisterRequest } from "../types/auth";

export function RegisterScreen() {
  const [form, setForm] = useState<RegisterRequest>({
    fullName: "",
    email: "",
    password: "",
    plateNumber: "",
  });

  function updateField(field: keyof RegisterRequest, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function handleRegister() {
    const hasEmptyField = Object.values(form).some((value) => !value.trim());

    if (hasEmptyField) {
      Alert.alert("Eksik bilgi", "Lütfen bütün alanları doldurun.");
      return;
    }

    if (form.password.length < 6) {
      Alert.alert("Geçersiz şifre", "Şifre en az 6 karakter olmalıdır.");
      return;
    }

    Alert.alert(
      "Kayıt",
      "Kayıt API bağlantısını backend hazır olduğunda ekleyeceğiz.",
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hesap Oluştur</Text>
        <Text style={styles.subtitle}>
          Sevkiyatınızı takip etmek için şoför hesabınızı oluşturun.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Ad Soyad</Text>
        <TextInput
          style={styles.input}
          placeholder="Adınız ve soyadınız"
          value={form.fullName}
          onChangeText={(value) => updateField("fullName", value)}
        />

        <Text style={styles.label}>E-posta</Text>
        <TextInput
          style={styles.input}
          placeholder="ornek@email.com"
          value={form.email}
          onChangeText={(value) => updateField("email", value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Plaka</Text>
        <TextInput
          style={styles.input}
          placeholder="34 ABC 123"
          value={form.plateNumber}
          onChangeText={(value) =>
            updateField("plateNumber", value.toUpperCase())
          }
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Şifre</Text>
        <TextInput
          style={styles.input}
          placeholder="En az 6 karakter"
          value={form.password}
          onChangeText={(value) => updateField("password", value)}
          secureTextEntry
        />

        <Pressable
          accessibilityRole="button"
          style={styles.registerButton}
          onPress={handleRegister}
        >
          <Text style={styles.registerButtonText}>Kayıt Ol</Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#F4F7FB",
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: "#17324D",
    fontSize: 30,
    fontWeight: "700",
  },
  subtitle: {
    color: "#5F6F7E",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  label: {
    color: "#17324D",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D7DEE7",
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  registerButton: {
    alignItems: "center",
    backgroundColor: "#17324D",
    borderRadius: 10,
    paddingVertical: 16,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
