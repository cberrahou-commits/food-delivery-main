import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "../screens/Home";
import RestaurantDetails from "../screens/RestaurantDetails";
import BasketScreen from "../screens/BasketScreen";
import UserDetails from "../screens/UserDetails";
import OptionsScreen from "../screens/OptionsScreen";
import OrderDetailsScreen from "../screens/OrderDetailsScreen";
import PreparingOrderScreen from "../screens/PreparingOrderScreen";
import ProfileScreen from "../screens/ProfileScreen";
import CookOnboardingScreen from "../screens/CookOnboardingScreen";
import CookDashboardScreen from "../screens/CookDashboardScreen";
import AddCookDishScreen from "../screens/AddCookDishScreen";
import MenuCategoriesScreen from "../screens/MenuCategoriesScreen";
import PlusScreen from "../screens/PlusScreen";
import RestaurantOnboardingScreen from "../screens/RestaurantOnboardingScreen";
import RestaurantsMapScreen from "../screens/RestaurantsMapScreen";

const Stack = createNativeStackNavigator();

const AppStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="MenuCategories" component={MenuCategoriesScreen} />
      <Stack.Screen name="RestaurantsMap" component={RestaurantsMapScreen} />
      <Stack.Screen name="Plus" component={PlusScreen} />
      <Stack.Screen name="Restaurant" component={RestaurantDetails} />
      <Stack.Screen
        name="Basket"
        component={BasketScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="PreparingOrderScreen"
        component={PreparingOrderScreen}
        options={{ presentation: "fullScreenModal" }}
      />
      <Stack.Screen name="Order Details" component={OrderDetailsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Options" component={OptionsScreen} />
      <Stack.Screen name="CookOnboarding" component={CookOnboardingScreen} />
      <Stack.Screen name="CookDashboard" component={CookDashboardScreen} />
      <Stack.Screen name="AddCookDish" component={AddCookDishScreen} />
      <Stack.Screen
        name="RestaurantOnboarding"
        component={RestaurantOnboardingScreen}
      />
      <Stack.Screen
        name="User Details"
        component={UserDetails}
        options={{ presentation: "fullScreenModal" }}
      />
    </Stack.Navigator>
  );
};

export default AppStack;
