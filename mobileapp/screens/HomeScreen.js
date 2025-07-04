// screens/HomeScreen.js (Cleaned and styled)
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Alert, StyleSheet } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import globalStyles from "../styles/globalStyles";
import { COLORS, SIZES, FONTS } from "../constants/theme";
import PrimaryButton from "../components/PrimaryButton";
import { MaterialIcons } from "@expo/vector-icons";

export default function HomeScreen({ navigation }) {
  const [cameras, setCameras] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/cameras/`)
      .then((res) => setCameras(res.data.cameras))
      .catch((err) => console.log(err));
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/logout/`);
      await AsyncStorage.removeItem("authToken");
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Logout Failed", error.response?.data?.error || "Try again");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.cameraCard}>
      <View style={styles.cameraHeader}>
        <MaterialIcons
          name="videocam"
          size={24}
          color={COLORS.primary}
          style={{ marginRight: SIZES.base }}
        />
        <Text style={styles.cameraTitle}>{item.location}</Text>
      </View>

      <PrimaryButton
        title="Live View"
        icon="play-circle-outline"
        onPress={() =>
          navigation.navigate("VideoStream", { cameraId: item.camera_id })
        }
        style={{ marginTop: SIZES.base * 2 }}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.gradient} />

      {/* Header Title */}
      <Text style={styles.headerTitle}>Your Dashboard</Text>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <PrimaryButton
          title="Profile"
          onPress={() => navigation.navigate("Profile")}
          icon="person"
          style={styles.actionButton}
        />
        <PrimaryButton
          title="Logout"
          onPress={handleLogout}
          icon="logout"
          variant="error"
          style={styles.actionButton}
        />
      </View>

      {/* Camera List */}
      <FlatList
        data={cameras}
        contentContainerStyle={styles.listContainer}
        renderItem={renderItem}
        keyExtractor={(item) => item.camera_id.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.heading,
    color: COLORS.text,
    marginBottom: SIZES.margin,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SIZES.padding,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: SIZES.base / 2,
  },
  listContainer: {
    paddingBottom: SIZES.padding * 2,
  },
  cameraCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.padding,
    marginVertical: SIZES.base,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  cameraHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cameraTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.font,
    color: COLORS.text,
  },
});
