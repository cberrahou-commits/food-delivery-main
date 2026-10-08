import { View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthStack from "../navigation/AuthStack";
import AppStack from "../navigation/AppStack";
import { UserAuth } from "../contexts/AuthContext";

const RootNavigator = () => {
  const { user, loading } = UserAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return !user ? <AuthStack /> : <AppStack />;
};

export default RootNavigator;
