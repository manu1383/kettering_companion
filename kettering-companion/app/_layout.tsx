// app/_layout.tsx
import { Stack } from "expo-router";
import { AuthProvider } from "./context/AuthProvider";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack />
    </AuthProvider>
  );
}
