import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import RootNavigator from "./navigation/RootNavigator";
import { store } from "./store.js";
import { Provider } from "react-redux";
import { AuthContextProvder } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { registerForPushNotificationsAsync } from "./services/notificationService";
import NotificationWatcher from "./components/NotificationWatcher";

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <NavigationContainer>
          <AuthContextProvder>
            <NotificationWatcher />
            <Provider store={store}>
              <RootNavigator />
            </Provider>
          </AuthContextProvder>
          <StatusBar style="auto" />
        </NavigationContainer>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
