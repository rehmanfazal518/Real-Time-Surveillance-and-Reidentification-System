// screens/ProfileScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, Alert, ScrollView, StyleSheet } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import globalStyles from "../styles/globalStyles";
import { COLORS, SIZES, FONTS } from "../constants/theme";
import PrimaryButton from "../components/PrimaryButton";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        console.log("Loaded token:", token); // 🔍 Debug

        if (!token) throw new Error("No token found");

        const res = await axios.get(`${API_BASE_URL}/api/current_user/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data.user);
      } catch (err) {
        console.log("Profile fetch error:", err); // 🔍 Debug
        Alert.alert(
          "Error",
          err.response?.data?.error || err.message || "Unable to fetch profile."
        );
      }
    };

    fetchUser();
  }, []);

  if (!user) {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.heading}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={globalStyles.heading}>Profile Info</Text>

      {Object.entries(user).map(([key, value]) => (
        <View key={key} style={styles.infoRow}>
          <Text style={styles.label}>{key.replace(/_/g, " ")}:</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}

      <PrimaryButton
        title="Change Password"
        onPress={() => navigation.navigate("ChangePassword")}
        icon="lock"
        style={{ marginTop: SIZES.padding * 2 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...globalStyles.container,
    paddingBottom: SIZES.padding * 2,
  },
  infoRow: {
    marginBottom: SIZES.base * 2,
  },
  label: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    fontSize: SIZES.font,
    textTransform: "capitalize",
  },
  value: {
    color: COLORS.text,
    fontSize: SIZES.fontSmall,
  },
});
