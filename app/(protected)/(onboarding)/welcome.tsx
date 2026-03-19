import AuthHeader from "@/components/auth/AuthHeader";
import { Colors } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Welcome = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background.primary }}>
      <AuthHeader />
      <Text>welcome</Text>
    </SafeAreaView>
  );
};

export default Welcome;

const styles = StyleSheet.create({});
