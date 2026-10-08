import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Navigation from "./src/navigation";
import { AuthProvider } from "./src/contexts/AuthContext";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationContainer>
          <Navigation />
          <StatusBar style="auto" />
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}