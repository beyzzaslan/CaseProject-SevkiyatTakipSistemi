import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { ApiError } from "../services/api";
import { register } from "../services/authService";
import type { RegisterRequest } from "../types/auth";

type RegisterScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Register"
>;
export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [form, setForm] = useState<RegisterRequest>({
    fullName: "",
    email: "",
    password: "",
    plateNumber: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof RegisterRequest, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleRegister() {
    const hasEmptyField = Object.values(form).some((value) => !value.trim());

    if (hasEmptyField) {
      Alert.alert("Eksik bilgi", "Lütfen bütün alanları doldurun.");
      return;
    }

    if (form.password.length < 8) {
      Alert.alert("Geçersiz şifre", "Şifre en az 8 karakter olmalıdır.");
      return;
    }

    try {
      setIsSubmitting(true);

      await register(form);

      Alert.alert(
        "Kayıt başarılı",
        "Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.",
        [
          {
            text: "Giriş ekranına dön",
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Beklenmeyen bir hata oluştu.";

      Alert.alert("Kayıt başarısız", message);
    } finally {
      setIsSubmitting(false);
    }
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
          placeholder="En az 8 karakter"
          value={form.password}
          onChangeText={(value) => updateField("password", value)}
          secureTextEntry
        />

        <Pressable
          accessibilityRole="button"
          style={[
            styles.registerButton,
            isSubmitting && styles.registerButtonDisabled,
          ]}
          onPress={handleRegister}
          disabled={isSubmitting}
        >
          <Text style={styles.registerButtonText}>
            {isSubmitting ? "Kaydediliyor..." : "Kayıt Ol"}
          </Text>
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

  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
