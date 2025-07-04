// screens/ChangePasswordScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '@env';
import globalStyles from '../styles/globalStyles';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async () => {
  if (newPassword !== confirmPassword) {
    Alert.alert('Mismatch', 'New passwords do not match.');
    return;
  }

  try {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) throw new Error("Token not found");

    const response = await axios.post(
      `${API_BASE_URL}/api/change_password/`,
      {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    Alert.alert("Success", response.data.message || "Password changed");
    navigation.goBack();
  } catch (error) {
    console.log("Change password error:", error); // 🔍 Debug log
    Alert.alert("Error", error.response?.data?.error || error.message || "Failed to change password");
  }
};

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.heading}>Change Password</Text>

      <TextInput
        placeholder="Current Password"
        secureTextEntry
        onChangeText={setCurrentPassword}
        style={globalStyles.input}
      />
      <TextInput
        placeholder="New Password"
        secureTextEntry
        onChangeText={setNewPassword}
        style={[globalStyles.input, { marginTop: SIZES.base * 2 }]}
      />
      <TextInput
        placeholder="Confirm New Password"
        secureTextEntry
        onChangeText={setConfirmPassword}
        style={[globalStyles.input, { marginTop: SIZES.base * 2 }]}
      />

      <PrimaryButton
        title="Update Password"
        onPress={handleChangePassword}
        icon="lock-open"
        style={{ marginTop: SIZES.padding * 2 }}
      />
    </View>
  );
}