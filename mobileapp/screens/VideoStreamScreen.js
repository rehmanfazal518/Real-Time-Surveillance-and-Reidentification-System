// screens/VideoStreamScreen.js (Updated to match desktop styles)
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function VideoStreamScreen({ route, navigation }) {
  const { cameraId } = route.params;
  const streamUrl = `${process.env.API_BASE_URL}/api/stream-camera/${cameraId}/`;

  // Add this JavaScript injection to prevent undefined document errors
  const injectedJS = `
    window.document = undefined;
    window.addEventListener('error', (e) => {
      e.preventDefault();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'ERROR',
        error: e.message
      }));
    });
  `;

  return (
    <View style={styles.container}>
      {/* Back button matching desktop style */}
      <Pressable 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        android_ripple={{ color: COLORS.primary + '20' }}
      >
        <MaterialIcons name="arrow-back" size={28} color={COLORS.white} />
      </Pressable>

      <View style={styles.videoContainer}>
        <WebView
          source={{ uri: streamUrl }}
          style={styles.webview}
          onMessage={(event) => {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'ERROR') console.log('WebView JS Error:', message.error);
          }}
          injectedJavaScript={injectedJS}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="compatibility"
          allowsFullscreenVideo={true}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
          }}
          renderError={(errorName) => (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error" size={48} color={COLORS.error} style={styles.errorIcon} />
              <Text style={styles.errorText}>Failed to load video stream</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backButton: {
    position: 'absolute',
    top: SIZES.padding,
    left: SIZES.padding,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  videoContainer: {
    flex: 1,
    margin: SIZES.base,
    borderRadius: SIZES.borderRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 85, 85, 0.12)',
  },
  errorIcon: {
    marginBottom: SIZES.base,
  },
  errorText: {
    color: COLORS.error,
    fontFamily: FONTS.bold,
    fontSize: SIZES.font,
  },
});