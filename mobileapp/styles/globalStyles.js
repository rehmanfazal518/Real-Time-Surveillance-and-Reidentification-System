// styles/globalStyles.js (Updated to match desktop CSS style)
import { StyleSheet } from "react-native";
import { COLORS, FONTS, SIZES, SHADOW } from "../constants/theme";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.padding,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: SHADOW.elevation,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    padding: SIZES.base * 2,
    borderRadius: SIZES.borderRadiusSm,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontFamily: FONTS.base,
    fontSize: SIZES.font,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.title,
    color: COLORS.text,
    marginBottom: SIZES.margin,
  },
  heading: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.heading,
    color: COLORS.text,
    marginBottom: SIZES.margin,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: SIZES.margin,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.font,
    color: COLORS.primary,
    marginVertical: SIZES.margin,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.margin,
  },
});
