import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '@env';
import PrimaryButton from '../components/PrimaryButton';
import globalStyles from '../styles/globalStyles';
import { COLORS, SIZES, FONTS } from '../constants/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [username, setUsername] = useState('');

  const handlePasswordReset = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/request-password-reset/`, {
        username,
      });

      Alert.alert('Success', res.data.message || 'If the user exists, a temporary password has been emailed.');
      setUsername('');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>Forgot Password</Text>
        <Text style={styles.subText}>Enter your username to receive a temporary password via email.</Text>

        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          placeholderTextColor="rgba(201, 209, 217, 0.6)"
          style={[globalStyles.input, { marginVertical: SIZES.base * 2 }]}
        />

        <PrimaryButton
          title="Submit"
          onPress={handlePasswordReset}
          icon="email"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...globalStyles.container,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    ...globalStyles.card,
    width: '100%',
    maxWidth: 350,
  },
  heading: {
    ...globalStyles.heading,
    textAlign: 'center',
  },
  subText: {
    color: COLORS.text,
    fontSize: SIZES.fontSmall,
    textAlign: 'center',
  },
});
