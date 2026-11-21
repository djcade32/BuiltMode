import { ThemedText } from "@/components/themed-text";
import { Colors, Typography } from "@/constants/theme";
import { useBlockedUsers } from "@/hooks/social/useBlockedUsers";
import { useUserStore } from "@/stores/user-store";
import { BlockedUser } from "@builtmode/shared";
import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BlockedUsers() {
  const uid = useUserStore((state) => state.user?.uid ?? "");
  const blocks = useBlockedUsers(uid);
  const router = useRouter();
  const confirmUnblock = (target: BlockedUser) => Alert.alert(
    "Unblock this user?",
    "You can send each other friend requests again. Your previous friendship and old feed posts will not be restored.",
    [{ text: "Cancel", style: "cancel" }, { text: "Unblock", onPress: async () => {
      try { await blocks.setBlocked(target, false); }
      catch { Alert.alert("Unable to unblock user", "Please check your connection and try again."); }
    } }],
  );
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
          <FontAwesome6 name="arrow-left" size={18} color={Colors.icon} />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Blocked Users</ThemedText>
      </View>
      {blocks.isLoading ? <ActivityIndicator color={Colors.icon} /> : blocks.error ? (
        <ThemedText style={styles.message}>Unable to load blocked users. Check your connection and reopen this screen.</ThemedText>
      ) : (
        <FlatList
          data={blocks.users}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<ThemedText style={styles.message}>You haven’t blocked anyone.</ThemedText>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.identity}>
                <ThemedText>{item.displayName ?? "BuiltMode user"}</ThemedText>
                {item.username ? <ThemedText style={styles.username}>@{item.username}</ThemedText> : null}
              </View>
              <TouchableOpacity disabled={blocks.isPending} onPress={() => confirmUnblock(item)} style={styles.button} accessibilityLabel={`Unblock ${item.username ?? "user"}`}>
                <ThemedText style={{ color: Colors.accent.primary, opacity: blocks.isPending ? 0.5 : 1 }}>Unblock</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: { flexDirection: "row", alignItems: "center", padding: 20, gap: 14 },
  back: { padding: 10 },
  title: { fontSize: 20, fontFamily: Typography.family.primary.bold },
  list: { padding: 20, gap: 12 },
  message: { padding: 20, textAlign: "center", color: Colors.icon },
  row: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: Colors.background.secondary, borderRadius: 12, gap: 12 },
  identity: { flex: 1, gap: 5 },
  username: { color: Colors.icon, fontSize: 12 },
  button: { padding: 10 },
});
