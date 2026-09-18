import type { AuthUser } from "../types/auth";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  DriverHome: {
    user: AuthUser;
  };
};