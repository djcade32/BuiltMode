import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { Entypo } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TextStyle, TouchableOpacity, View } from "react-native";

type SettingsRowProps = {
  title: string;
  titleStyle?: TextStyle;
  children?: React.ReactNode;
  subtitle?: string;
  preIcon?: { familyIcon: any; name: string; color?: string };
  postIcon?: { familyIcon: any; name: string; color?: string };
  disabled?: boolean;
  onPress: () => void;
};

const SettingsRow = ({
  title,
  subtitle,
  onPress,
  preIcon,
  postIcon,
  titleStyle,
  children,
  disabled = false,
}: SettingsRowProps) => {
  return (
    <TouchableOpacity style={styles.settingsSectionRow} onPress={onPress} disabled={disabled} accessibilityRole="button">
      <View style={{ flexDirection: "row", flex: 1, gap: 12, alignItems: "center" }}>
        {preIcon && (
          <View style={styles.settingsRowIcon}>
            {React.createElement(preIcon.familyIcon, {
              name: preIcon.name,
              size: 16,
              color: preIcon.color ? preIcon.color : Colors.gray,
            })}
          </View>
        )}
        <View style={{ gap: 5, flexShrink: 1 }}>
          <ThemedText style={[styles.settingsRowTitle, titleStyle]}>{title}</ThemedText>
          {subtitle && <ThemedText style={styles.settingsRowSubtitle}>{subtitle}</ThemedText>}
          {children}
        </View>
      </View>
      <View>
        {postIcon ? (
          React.createElement(postIcon.familyIcon, {
            name: postIcon.name,
            size: 20,
            color: postIcon.color ? postIcon.color : Colors.gray,
          })
        ) : (
          <Entypo name="chevron-right" size={24} color={Colors.gray} />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default SettingsRow;

const styles = StyleSheet.create({
  settingsSectionRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 16,
    justifyContent: "space-between",
    width: "100%",
  },
  settingsRowTitle: {
    fontSize: 14,
    fontFamily: Typography.family.primary.bold,
  },
  settingsRowSubtitle: {
    fontSize: 10,
    fontFamily: Typography.family.secondary.regular,
    color: Colors.icon,
  },
  settingsRowIcon: {
    backgroundColor: Colors.background.primary,
    width: 40,
    height: 40,
    borderRadius: Border.radius.md,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
