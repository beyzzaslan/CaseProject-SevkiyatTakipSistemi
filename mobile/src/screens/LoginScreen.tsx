import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { LoginRequest } from "../types/auth";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

import { ApiError } from "../services/api";
import { login } from "../services/authService";

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: LoginScreenProps) {
  const [form, setForm] = useState<LoginRequest>({
    email: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof LoginRequest, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleLogin() {
    if (!form.email.trim() || !form.password.trim()) {
      Alert.alert("Eksik bilgi", "E-posta ve şifre alanlarını doldurun.");
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await login(form);

      Alert.alert("Giriş başarılı", `Hoş geldiniz ${result.user.fullName}.`);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Beklenmeyen bir hata oluştu.";

      Alert.alert("Giriş başarısız", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fabrika Sıra Sistemi</Text>
        <Text style={styles.subtitle}>
          Sevkiyat sürecinizi takip etmek için giriş yapın.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>E-posta</Text>
        <TextInput
          value={form.email}
          onChangeText={(value) => updateField("email", value)}
          style={styles.input}
          placeholder="ornek@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Şifre</Text>
        <TextInput
          value={form.password}
          onChangeText={(value) => updateField("password", value)}
          style={styles.input}
          placeholder="Şifrenizi girin"
          secureTextEntry
        />

        <Pressable
          accessibilityRole="button"
          style={[
            styles.loginButton,
            isSubmitting && styles.loginButtonDisabled,
          ]}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          <Text style={styles.loginButtonText}>
            {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="link"
          style={styles.registerLink}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.registerLinkText}>Hesabın yok mu? Kayıt ol</Text>
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
    marginBottom: 32,
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
    marginBottom: 18,
    fontSize: 16,
  },
  loginButton: {
    alignItems: "center",
    backgroundColor: "#17324D",
    borderRadius: 10,
    paddingVertical: 16,
  },

  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  registerLink: {
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 8,
  },
  registerLinkText: {
    color: "#17324D",
    fontSize: 14,
    fontWeight: "600",
  },
});
