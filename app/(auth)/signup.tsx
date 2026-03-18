import AuthHeader from "@/components/auth/AuthHeader";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Input from "@/components/ui/Input";
import ThemedButton from "@/components/ui/ThemedButton";
import { Border, Colors, Typography } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";
import { Link } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
  password: string;
  confirmPassword: string;
};

const initialValues: FormInput = {
  email: "",
  password: "",
  confirmPassword: "",
};

const Signup = () => {
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormInput>({
    defaultValues: initialValues,
  });
  const { email, password, confirmPassword } = useWatch({ control });
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const { signup, isSigningIn, error } = useAuthStore();

  useEffect(() => {
    error && useAuthStore.setState({ error: null });
  }, [email, password]);

  const isValidPassword = useMemo(() => {
    if (!password) return false;
    const regex = new RegExp("^(?=.*[A-Z])(?=.*\\d).{8,}$");
    return regex.test(password);
  }, [password]);

  const handleSignup = async (data: FormInput) => {
    if (!isValidForm(data)) return;
    const { email, password } = data;
    try {
      await signup(email, password);
    } catch (error) {
      console.error("Error Signing up: ", error);
    }
  };

  const isValidForm = (data: FormInput) => {
    const { email, password, confirmPassword } = data;
    clearErrors(["password", "confirmPassword"]);
    if (!email || !password || !confirmPassword) return false;
    if (!isValidPassword) {
      setError("password", {
        message:
          "Password must be at least 8 characters; contain at least one uppercase character and one digit.",
      });
      return false;
    }
    if (password !== confirmPassword) {
      setError("confirmPassword", {
        message: "Does not match password.",
      });
      return false;
    }
    return true;
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
              />
              <View>
                <Input
                  name="password"
                  control={control}
                  errors={errors.password}
                  label="PASSWORD"
                  password={true}
                  placeholder="••••••••••"
                  onFocus={() => setShowPasswordRules(true)}
                  onBlur={() => setShowPasswordRules(false)}
                />
                {showPasswordRules && !errors.password && (
                  <ThemedText
                    style={{
                      fontSize: Typography.size.xs,
                      color: Colors.text.secondary,
                      marginTop: 5,
                    }}
                  >
                    Password must be at least 8 characters; contain at least one uppercase character
                    and one digit.
                  </ThemedText>
                )}
              </View>
              <Input
                name="confirmPassword"
                control={control}
                errors={errors.confirmPassword}
                label="CONFIRM PASSWORD"
                password={true}
                placeholder="••••••••••"
              />

              {error && <ThemedText style={styles.formError}>{error}</ThemedText>}

              <ThemedButton
                disabled={
                  email?.trim().length === 0 ||
                  password?.trim().length === 0 ||
                  confirmPassword?.trim().length === 0 ||
                  isSigningIn
                }
                title="CREATE ACCOUNT"
                onPress={handleSubmit(handleSignup)}
              />
            </ThemedView>

            <ThemedView style={{ flexDirection: "row", justifyContent: "center", marginTop: 45 }}>
              <ThemedText
                type="defaultSemiBold"
                style={{
                  color: Colors.text.secondary,
                }}
              >
                Already have an account?
              </ThemedText>
              <Link href="/signin" asChild>
                <TouchableOpacity>
                  <ThemedText
                    type="defaultSemiBold"
                    style={{
                      color: Colors.accent.primary,
                    }}
                  >
                    {" "}
                    Log in
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
                <ThemedText style={styles.footerText}>
                  By continuing, you agree to our Terms and Privacy Policy
                </ThemedText>
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

export default Signup;

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
  },
  footerContainer: {
    paddingHorizontal: 20,
    bottom: 0,
    flex: 1,
    justifyContent: "flex-end",
  },
  footerText: {
    fontFamily: Typography.family.primary.regular,
    fontSize: 10,
    color: Colors.inputBorder,
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
