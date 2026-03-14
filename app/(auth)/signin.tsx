import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Signin = () => {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView>
        <ThemedText>signin</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
};

export default Signin;

const styles = StyleSheet.create({});
