import { ThemedText } from "@/components/themed-text";
import { Colors, Typography } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

export default function DeloadWeekBadge() {
  return (
    <View style={styles.badge}>
      <MaterialIcons name="restore" size={14} color={Colors.accent.secondary} />
      <ThemedText style={styles.text}>DELOAD WEEK</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#4A6C8C38",
    borderColor: "#4A6C8C52",
    borderWidth: 1,
    borderRadius: 9999,
  },
  text: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 12,
    color: Colors.accent.secondary,
  },
});
