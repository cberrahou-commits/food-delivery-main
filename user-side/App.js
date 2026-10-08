import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import RootNavigator from "./navigation/RootNavigator";
import { store } from "./store.js";
import { Provider } from "react-redux";
import { AuthContextProvder } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <NavigationContainer>
          <AuthContextProvder>
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
