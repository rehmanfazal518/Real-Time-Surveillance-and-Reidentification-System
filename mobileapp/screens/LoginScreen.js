// screens/LoginScreen.js (Updated to match desktop style)
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ImageBackground,
  StyleSheet,
} from "react-native";
import axios from "axios";
import { API_BASE_URL } from "@env";
import globalStyles from "../styles/globalStyles";
import PrimaryButton from "../components/PrimaryButton";
import { COLORS, SIZES, FONTS } from "../constants/theme";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login/`, {
        username,
        password,
        role: "Parent",
      });
      if (response.data.message) {
        await AsyncStorage.setItem("authToken", response.data.token);
        navigation.replace("Home");
      }
    } catch (error) {
      Alert.alert("Login Failed", error.response?.data?.error || "Try again");
    }
  };

  return (
    <View style={styles.container}>
      {/* Semi-transparent background overlay - mimicking the desktop CSS */}
      <View style={styles.gradient} />

      <View style={styles.centerContainer}>
        <Text style={styles.welcomeText}>Welcome Back 👋</Text>

        <View style={styles.loginCard}>
          <TextInput
            placeholder="Username"
            placeholderTextColor="rgba(201, 209, 217, 0.6)"
            onChangeText={setUsername}
            style={globalStyles.input}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="rgba(201, 209, 217, 0.6)"
            onChangeText={setPassword}
            secureTextEntry
            style={[globalStyles.input, { marginTop: SIZES.base * 2 }]}
          />

          <PrimaryButton
            title="Login"
            onPress={login}
            icon="login"
            style={{ marginTop: SIZES.padding }}
          />
          <Text
            onPress={() => navigation.navigate("ForgotPassword")}
            style={styles.forgotLink}
          >
            Forgot Password?
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
    // Mimicking radial-gradient effect from desktop CSS
    backgroundColor: COLORS.background,
    // Note: React Native doesn't support radial gradients directly
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.padding * 2,
  },
  welcomeText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.heading,
    color: COLORS.text,
    marginBottom: SIZES.padding * 2,
    textAlign: "center",
  },
  loginCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.padding * 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  forgotLink: {
    color: COLORS.primary,
    fontSize: SIZES.fontSmall,
    textAlign: "center",
    marginTop: SIZES.base * 2,
    fontFamily: FONTS.base,
  },
});
