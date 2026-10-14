import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignIn from "../screens/SignIn";
import SignUp from "../screens/SignUp";
import UserDetails from "../screens/UserDetails";
import { StatusBar } from "expo-status-bar";

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <>
      <StatusBar hidden={false} style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <Stack.Screen name="SignIn" component={SignIn} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="User Details" component={UserDetails} />
      </Stack.Navigator>
    </>
  );
};

export default AuthStack;