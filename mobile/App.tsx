import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import type { RootStackParamList } from "./src/navigation/types";
import { DriverHomeScreen } from "./src/screens/DriverHomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { getSession } from "./src/services/sessionStorage";
import type { AuthResponse } from "./src/types/auth";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const savedSession = await getSession();

        if (isMounted) {
          setSession(savedSession);
        }
      } catch {
        if (isMounted) {
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsRestoringSession(false);
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isRestoringSession) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#17324D" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />

      <NavigationContainer>
        <Stack.Navigator initialRouteName={session ? "DriverHome" : "Login"}>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: "Kayıt Ol" }}
          />

          <Stack.Screen
            name="DriverHome"
            component={DriverHomeScreen}
            initialParams={
              session
                ? {
                    user: session.user,
                  }
                : undefined
            }
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F7FB",
  },
});
