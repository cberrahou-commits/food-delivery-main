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

  // Navigation libre dès le premier lancement : AppStack accessible à tous les visiteurs.
  // La création de compte ou connexion sera requise uniquement au moment de valider une commande.
  return <AppStack />;
};

export default RootNavigator;
