import AuthHeader from "@/components/auth/AuthHeader";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import FormInput from "@/components/ui/FormInput";
import ThemedButton from "@/components/ui/ThemedButton";
import { Colors, Typography } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";
import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FormInputProps = {
  email: string;
  password: string;
};

const initialValues: FormInputProps = {
  email: "",
  password: "",
};

const Signin = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: initialValues,
  });
  const { email, password } = useWatch({ control });
  const { signin, isSigningIn, error } = useAuthStore();

  useEffect(() => {
    error && useAuthStore.setState({ error: null });
  }, [email, password]);

  const handleSignin = async (data: FormInputProps) => {
    const { email, password } = data;
    if (!email || !password) return;
    try {
      await signin(email, password);
    } catch (error) {
      console.error("Error Signing in: ", error);
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

            <ThemedView style={styles.formContainer}>
              <FormInput
                name="email"
                control={control}
                errors={errors.email}
                label="IDENTITY // EMAIL"
                preIcon={{
                  familyIcon: FontAwesome,
                  name: "envelope",
                }}
                placeholder="Enter your email"
              />
              <FormInput
                name="password"
                control={control}
                errors={errors.password}
                label="KEY // PASSWORD"
                preIcon={{
                  familyIcon: FontAwesome,
                  name: "lock",
                }}
                password={true}
                placeholder="••••••••••"
              />

              {error && <ThemedText style={styles.formError}>{error}</ThemedText>}

              <Link href="/forgot" asChild>
                <TouchableOpacity style={{ alignSelf: "flex-end" }}>
                  <Text style={styles.forgotCredentials}>Forgot credentials?</Text>
                </TouchableOpacity>
              </Link>
              <ThemedButton
                disabled={
                  email?.trim().length === 0 || password?.trim().length === 0 || isSigningIn
                }
                title="ENTER MODE"
                postIcon={{
                  familyIcon: FontAwesome6,
                  name: "arrow-right",
                }}
                onPress={handleSubmit(handleSignin)}
              />
            </ThemedView>

            <ThemedView style={{ flexDirection: "row", justifyContent: "center", marginTop: 45 }}>
              <ThemedText
                type="defaultSemiBold"
                style={{
                  color: Colors.text.secondary,
                }}
              >
                New here?
              </ThemedText>
              <Link href="/signup" asChild>
                <TouchableOpacity>
                  <ThemedText
                    type="defaultSemiBold"
                    style={{
                      color: Colors.accent.primary,
                    }}
                  >
                    {" "}
                    Build your account
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

export default Signin;

const styles = StyleSheet.create({
  formContainer: {
    marginTop: 25,
    alignSelf: "center",
    width: "90%",
    gap: 20,
  },
  forgotCredentials: {
    color: Colors.text.secondary,
    fontFamily: Typography.family.primary.medium,
    alignSelf: "flex-end",
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
