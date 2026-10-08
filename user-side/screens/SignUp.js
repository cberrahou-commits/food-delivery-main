import { useState } from "react";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { StatusBar } from "expo-status-bar";
import {
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Text,
  View,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { UserAuth } from "../contexts/AuthContext";

const SignUp = () => {
  const [value, setValue] = useState({
    email: "",
    password: "",
    emailError: "",
    passwordError: "",
  });
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { createUser, signInWithGoogle } = UserAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const onSignUp = async () => {
    let emailError = "";
    let passwordError = "";

    const cleanEmail = value.email.trim();
    if (cleanEmail === "") {
      emailError = "L'adresse email ne peut pas être vide.";
    } else if (!validateEmail(cleanEmail)) {
      emailError = "Format d'adresse email invalide.";
    }

    if (value.password === "") {
      passwordError = "Le mot de passe ne peut pas être vide.";
    } else if (!validatePassword(value.password)) {
      passwordError = "Le mot de passe doit comporter au moins 6 caractères.";
    }

    setValue({
      ...value,
      emailError,
      passwordError,
    });

    if (emailError || passwordError) {
      return;
    }

    setLoading(true);
    try {
      await createUser(cleanEmail, value.password);
      // Navigation vers User Details / AppStack se fait automatiquement dès la création du compte
    } catch (error) {
      console.error("SignUp error:", error);
      let message = error.message;
      if (error.code === "auth/email-already-in-use") {
        message = "Cette adresse email est déjà associée à un compte.";
      } else if (error.code === "auth/weak-password") {
        message = "Le mot de passe doit comporter au moins 6 caractères.";
      } else if (error.code === "auth/invalid-email") {
        message = "Format d'adresse email invalide.";
      } else if (error.code === "auth/network-request-failed") {
        message = "Erreur de connexion. Vérifiez votre accès internet.";
      }
      Alert.alert("Erreur d'inscription", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="w-full h-full bg-white flex justify-center ">
      <StatusBar style="auto" />
      <View className="mx-4 flex justify-center align-center space-y-6">
        <Text className="text-3xl font-bold text-center text-black">
          Inscription
        </Text>

        <View className="space-y-4">
          <View className="mt-1 space-y-4">
            <View className="font-main flex-row justify-center align-center rounded-r-2xl rounded-l-2xl px-1 py-1 bg-gray-200 mx-5">
              <Icon style={styles.icon} name="email" size={18} color="gray" />
              <TextInput
                placeholder="Email"
                value={value.email}
                autoCapitalize="none"
                keyboardType="email-address"
                className="flex-1 p-2 bg-white text-gray-700 rounded-xl"
                onChangeText={(text) =>
                  setValue({ ...value, email: text, emailError: "" })
                }
              />
            </View>
            {value.emailError !== "" && (
              <Text style={styles.error}>{value.emailError}</Text>
            )}

            <View className="flex-row justify-center align-center rounded-r-2xl rounded-l-2xl px-1 py-1 bg-gray-200 mx-5">
              <Icon style={styles.icon} name="lock" size={18} color="gray" />
              <TextInput
                placeholder="Mot de passe"
                className="flex-1 p-2 bg-white text-gray-700 rounded-xl"
                onChangeText={(text) =>
                  setValue({ ...value, password: text, passwordError: "" })
                }
                secureTextEntry={true}
              />
            </View>
            {value.passwordError !== "" && (
              <Text style={styles.error}>{value.passwordError}</Text>
            )}
          </View>

          <View>
            <TouchableOpacity
              onPress={onSignUp}
              disabled={loading}
              className="mx-auto w-10/12 my-2 items-center p-3 rounded-2xl duration-150 bg-green-400 border-l-4 border-b-4 border-green-600"
            >
              {loading ? (
                <ActivityIndicator color="#1f2937" />
              ) : (
                <Text className="text-center text-gray-800 font-extrabold text-xl">
                  Suivant
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View>
            <TouchableOpacity
              onPress={signInWithGoogle}
              className="mx-auto w-10/12 items-center p-3 rounded-2xl duration-150 bg-yellow-300 border-l-4 border-b-4 border-yellow-600 flex-row justify-center space-x-2"
            >
              <Text className="text-center text-gray-800 font-extrabold text-lg mr-2">
                S'inscrire avec
              </Text>
              <Icon name="google" size={22} color="#ca8a04" />
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-center text-gray-700 font-semibold text-base">
          Vous avez déjà un compte ?{" "}
          <Text
            className="text-blue underline"
            onPress={() => navigation.navigate("SignIn")}
          >
            Se connecter
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  icon: {
    padding: 10,
  },
  error: {
    color: "red",
    marginLeft: 20,
  },
});
