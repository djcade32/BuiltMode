import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Feed() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <ThemedText style={styles.builtmodeText}>
          BUILT
          <ThemedText
            style={[
              styles.builtmodeText,
              {
                color: Colors.accent.primary,
              },
            ]}
          >
            MODE
          </ThemedText>
        </ThemedText>

        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => router.push("/(protected)/(tabs)/(feed)/friendsList")}
        >
          <FontAwesome5 name="user-friends" size={14} color={Colors.gray} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#15181c49",
    alignItems: "center",
    height: 65,
  },
  builtmodeText: {
    fontSize: 20,
    fontFamily: Typography.family.tertiary.regular,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: Border.radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
});
