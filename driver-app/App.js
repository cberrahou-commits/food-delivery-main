import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import React, { useEffect } from "react";
import Navigation from "./src/navigation";
import { AuthProvider } from "./src/contexts/AuthContext";
import { LanguageProvider } from "./src/contexts/LanguageContext";
import { registerForPushNotificationsAsync } from "./src/services/notificationService";
import DriverNotificationWatcher from "./src/components/DriverNotificationWatcher";

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <AuthProvider>
          <NavigationContainer>
            <DriverNotificationWatcher />
            <Navigation />
            <StatusBar style="auto" />
          </NavigationContainer>
        </AuthProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}