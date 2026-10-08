import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";

const SignUp = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { createUser, signInWithGoogle } = useAuth();

  const handleSignUp = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password || !confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Erreur",
        "Le mot de passe doit comporter au moins 6 caractères."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await createUser(cleanEmail, password);
    } catch (err) {
      console.error("Driver signUp error:", err);
      let message = err.message;
      if (err.code === "auth/email-already-in-use") {
        message = "Cette adresse email est déjà associée à un compte.";
      } else if (err.code === "auth/weak-password") {
        message = "Le mot de passe doit comporter au moins 6 caractères.";
      } else if (err.code === "auth/invalid-email") {
        message = "Format d'adresse email invalide.";
      } else if (err.code === "auth/network-request-failed") {
        message = "Erreur de connexion. Vérifiez votre accès internet.";
      }
      Alert.alert("Erreur d'inscription", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ justifyContent: "center", flexGrow: 1 }}
        >
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-add" size={38} color="#16a34a" />
            </View>
            <Text style={styles.title}>Devenir Livreur</Text>
            <Text style={styles.subtitle}>
              Créez votre compte livreur pour recevoir des courses
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#6b7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#6b7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#6b7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor="#9ca3af"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>S'inscrire</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={signInWithGoogle}
            >
              <FontAwesome
                name="google"
                size={20}
                color="#ca8a04"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.googleButtonText}>S'inscrire avec Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Vous avez déjà un compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
              <Text style={styles.linkText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
    marginTop: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
  },
  button: {
    backgroundColor: "#22c55e",
    borderBottomWidth: 4,
    borderLeftWidth: 3,
    borderColor: "#16a34a",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  googleButton: {
    backgroundColor: "#fef08a",
    borderBottomWidth: 4,
    borderLeftWidth: 3,
    borderColor: "#eab308",
    borderRadius: 14,
    height: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#854d0e",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  footerText: {
    fontSize: 15,
    color: "#4b5563",
  },
  linkText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2563eb",
    textDecorationLine: "underline",
  },
});

