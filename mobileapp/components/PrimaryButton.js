// components/PrimaryButton.js (Updated to match desktop CSS styles)
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOW } from '../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function PrimaryButton({ 
  title, 
  onPress, 
  style, 
  textStyle, 
  icon,
  variant = 'primary' // Added variant prop for different button styles (primary, error, edit)
}) {
  const getButtonColor = () => {
    switch (variant) {
      case 'error':
        return COLORS.error;
      case 'edit':
        return COLORS.cardBackground;
      default:
        return COLORS.primary;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: getButtonColor() + '20' }}
      style={({ pressed }) => [{
        backgroundColor: getButtonColor(),
        paddingVertical: SIZES.base * 1.5,
        paddingHorizontal: SIZES.base * 3,
        borderRadius: SIZES.borderRadiusSm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.8 : 1,
        shadowColor: pressed ? "transparent" : "#000",
        shadowOffset: { width: 0, height: pressed ? 0 : 8 },
        shadowOpacity: pressed ? 0 : 0.3,
        shadowRadius: pressed ? 0 : 12,
        elevation: pressed ? 0 : SHADOW.elevation,
        transform: [{ translateY: pressed ? 0 : -2 }],
      }, style]}
    >
      {icon && <MaterialIcons name={icon} size={SIZES.icon} color={COLORS.text} style={{ marginRight: 8 }} />}
      <Text style={[{ 
        color: COLORS.white, 
        fontSize: SIZES.font, 
        fontFamily: FONTS.bold 
      }, textStyle]}>
        {title}
      </Text>
    </Pressable>
  );
}