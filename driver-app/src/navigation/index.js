import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OrdersScreen from "../screens/OrdersScreen";
import OrdersDeliveryScreen from "../screens/OrderDelivery";
import SignIn from "../screens/SignIn";
import SignUp from "../screens/SignUp";
import CourierVerificationScreen from "../screens/CourierVerification";
import VerificationPendingScreen from "../screens/VerificationPending";
import { useAuth } from "../contexts/AuthContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/firebase";

const Stack = createNativeStackNavigator();

const Navigation = () => {
  const { user, loading: authLoading } = useAuth();
  const [courierStatus, setCourierStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCourierStatus(null);
      setStatusLoading(false);
      return;
    }

    setStatusLoading(true);
    const userRef = doc(db, "user", user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Status can be: 'APPROVED', 'PENDING_VERIFICATION', or null/'NOT_SUBMITTED'
          setCourierStatus(data.courierStatus || "NOT_SUBMITTED");
        } else {
          setCourierStatus("NOT_SUBMITTED");
        }
        setStatusLoading(false);
      },
      (err) => {
        console.error("Error listening to courier status:", err);
        setCourierStatus("NOT_SUBMITTED");
        setStatusLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  if (authLoading || (user && statusLoading)) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#ffffff",
        }}
      >
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="SignIn" component={SignIn} />
          <Stack.Screen name="SignUp" component={SignUp} />
        </>
      ) : courierStatus === "APPROVED" ? (
        <>
          <Stack.Screen name="OrdersScreen" component={OrdersScreen} />
          <Stack.Screen
            name="OrdersDeliveryScreen"
            component={OrdersDeliveryScreen}
          />
        </>
      ) : courierStatus === "PENDING_VERIFICATION" ? (
        <Stack.Screen name="VerificationPending">
          {(props) => (
            <VerificationPendingScreen
              {...props}
              onStatusUpdate={(s) => setCourierStatus(s)}
              onResubmit={() => setCourierStatus("NOT_SUBMITTED")}
            />
          )}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="CourierVerification">
          {(props) => (
            <CourierVerificationScreen
              {...props}
              onStatusUpdate={(s) => setCourierStatus(s)}
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
};

export default Navigation;
