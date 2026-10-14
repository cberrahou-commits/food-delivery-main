import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 36 }}>🍲</Text>
            </View>
            <Text style={styles.title}>Une petite pause technique</Text>
            <Text style={styles.subtitle}>
              Une difficulté temporaire est survenue lors de l'affichage de cet écran. Vos données sont intactes.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReload}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>Recharger l'écran</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    maxWidth: 360,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#FFBC0D",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },
});

export default ErrorBoundary;
