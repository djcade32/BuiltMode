import AuthHeader from "@/components/auth/AuthHeader";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Input from "@/components/ui/Input";
import ThemedButton from "@/components/ui/ThemedButton";
import { Border, Colors, Typography } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";
import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FormInput = {
  email: string;
};

const initialValues: FormInput = {
  email: "",
};

const Forgot = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: initialValues,
  });
  const { email } = useWatch({ control });
  const { resetPassword, error } = useAuthStore();
  const [sendButtonPressed, setSendButtonPressed] = useState(false);
  const [showEmailSent, setShowEmailSent] = useState(false);

  useEffect(() => {
    error && useAuthStore.setState({ error: null });
  }, [email]);

  const handleResetPassword = async (data: FormInput) => {
    const { email } = data;
    if (!email) return;
    setSendButtonPressed(true);
    try {
      await resetPassword(email);
      setShowEmailSent(true);
    } catch (error) {
      console.error("Error Signing in: ", error);
    } finally {
      setSendButtonPressed(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background.primary }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingTop: 50 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={{ flex: 1, position: "relative" }}>
            <AuthHeader />

            {showEmailSent ? (
              <ThemedView style={styles.sentEmailConfirmation}>
                <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
                  <ThemedText type="title">Email Sent</ThemedText>
                  <MaterialIcons name="check-circle" size={35} color="green" />
                </View>
                <ThemedText style={{ color: Colors.gray, marginVertical: 10 }}>
                  If email address given exists, an email with instructions to reset your password
                  will be sent to it.
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedView style={styles.formContainer}>
                <View>
                  <ThemedText type="title">RESET ACCESS</ThemedText>
                  <ThemedText
                    style={{
                      fontSize: 14,
                      color: Colors.gray,
                      paddingRight: 20,
                      marginVertical: 10,
                    }}
                  >
                    Enter your email and we'll send instructions to reset your password.
                  </ThemedText>
                </View>

                <Input
                  name="email"
                  control={control}
                  errors={errors.email}
                  label="EMAIL"
                  placeholder="johndoe@email.com"
                  rules={{
                    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    required: true,
                  }}
                  preIcon={{
                    familyIcon: FontAwesome,
                    name: "envelope",
                  }}
                />

                {error && <ThemedText style={styles.formError}>{error}</ThemedText>}

                <ThemedButton
                  disabled={email?.trim().length === 0 || sendButtonPressed}
                  title="SEND RESET LINK"
                  postIcon={{
                    familyIcon: FontAwesome6,
                    name: "arrow-right",
                  }}
                  onPress={handleSubmit(handleResetPassword)}
                />
              </ThemedView>
            )}

            <ThemedView style={{ flexDirection: "row", justifyContent: "center" }}>
              <Link href="/(auth)/signin" asChild onPress={() => setShowEmailSent(false)}>
                <TouchableOpacity>
                  <ThemedText
                    type="defaultSemiBold"
                    style={{
                      color: Colors.text.secondary,
                    }}
                  >
                    Back to Sign in
                  </ThemedText>
                </TouchableOpacity>
              </Link>
            </ThemedView>

            <ThemedView style={styles.footerContainer}>
              <View
                style={{
                  borderTopColor: Colors.inputBorder,
                  borderTopWidth: 1,
                  padding: 16,
                }}
              >
                <ThemedText style={styles.footerText}>DISCIPLINE COMPOUNDS</ThemedText>
              </View>
            </ThemedView>

            <View style={styles.accentArt1} />
            <View style={styles.accentArt2} />
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Forgot;

const styles = StyleSheet.create({
  version: {
    fontSize: 12,
    fontFamily: Typography.family.secondary.regular,
    color: Colors.accent.secondary,
    position: "absolute",
    top: -15,
    right: 70,
  },
  logo: {
    height: 40,
    width: "100%",
    objectFit: "contain",
  },
  subtitle: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  systemBadgeContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Border.radius.lg,
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  systemBadgeText: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  formContainer: {
    marginTop: 25,
    alignSelf: "center",
    width: "90%",
    gap: 20,
    flex: 1,
    justifyContent: "center",
  },
  sentEmailConfirmation: {
    marginTop: 25,
    alignSelf: "center",
    width: "90%",
    gap: 5,
    flex: 1,
    justifyContent: "center",
  },
  footerContainer: {
    paddingHorizontal: 20,
    bottom: 0,
    flex: 1,
    justifyContent: "flex-end",
  },
  footerText: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 10,
    color: Colors.inputBorder,
    letterSpacing: 2,
    textAlign: "center",
  },
  formError: {
    color: "red",
    fontSize: Typography.size.xs,
  },
  accentArt1: {
    position: "absolute",
    height: 48,
    width: 4,
    left: 0,
    top: 140,
    opacity: 0.2,
    backgroundColor: Colors.accent.primary,
  },
  accentArt2: {
    position: "absolute",
    height: 32,
    width: 4,
    right: 0,
    bottom: 240,
    opacity: 0.2,
    backgroundColor: Colors.accent.secondary,
  },
});
