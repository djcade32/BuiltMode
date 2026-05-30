import { Colors } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";
import React from "react";
import { Button, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const profile = () => {
  const { signout } = useAuthStore();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Button title="Sign out" onPress={signout} />
    </SafeAreaView>
  );
};

export default profile;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    flex: 1,
  },
});
