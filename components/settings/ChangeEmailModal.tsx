import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { FirebaseError } from "firebase/app";
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, verifyBeforeUpdateEmail } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ChangeEmailSheetProps = {
  visible: boolean;
  /**
   * Kept temporarily for compatibility with the current settings screen.
   * Firebase operations use getAuth().currentUser instead.
   */
  authUser?: unknown;
  onClose: () => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getChangeEmailErrorMessage = (error: unknown) => {
  if (!(error instanceof FirebaseError)) {
    return "BuiltMode could not send the verification email. Please try again.";
  }

  switch (error.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "The current password you entered is incorrect.";
    case "auth/email-already-in-use":
      return "An account already exists with that email address.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts were made. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "A network error occurred. Check your connection and try again.";
    case "auth/requires-recent-login":
      return "For security, sign out and sign back in before changing your email.";
    case "auth/user-token-expired":
      return "Your session has expired. Sign in again and retry the change.";
    case "auth/operation-not-allowed":
      return "Email changes are not currently enabled for this account.";
    default:
      return "BuiltMode could not send the verification email. Please try again.";
  }
};

const ChangeEmailSheet = ({ visible, onClose }: ChangeEmailSheetProps) => {
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentEmail = getAuth().currentUser?.email?.trim() ?? "";
  const normalizedNewEmail = newEmail.trim().toLowerCase();

  const isSubmitDisabled =
    isSubmitting ||
    !EMAIL_PATTERN.test(normalizedNewEmail) ||
    normalizedNewEmail === currentEmail.toLowerCase() ||
    !currentPassword;

  useEffect(() => {
    if (visible) {
      setNewEmail("");
      setCurrentPassword("");
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [visible]);

  const handleClose = () => {
    if (isSubmitting) return;

    Keyboard.dismiss();
    onClose();
  };

  const handleSubmit = async () => {
    const firebaseUser = getAuth().currentUser;

    if (!firebaseUser) {
      setErrorMessage("Your authenticated account could not be found. Sign in again and retry.");
      return;
    }

    const firebaseEmail = firebaseUser.email?.trim();

    if (!firebaseEmail) {
      setErrorMessage("Your account does not have an email address available.");
      return;
    }

    const hasPasswordProvider = firebaseUser.providerData.some((provider) => provider.providerId === "password");

    if (!hasPasswordProvider) {
      setErrorMessage("This account does not use an email and password sign-in method.");
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedNewEmail)) {
      setErrorMessage("Enter a valid email address.");
      return;
    }

    if (normalizedNewEmail === firebaseEmail.toLowerCase()) {
      setErrorMessage("Enter an email address different from your current email.");
      return;
    }

    if (!currentPassword) {
      setErrorMessage("Enter your current password.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const credential = EmailAuthProvider.credential(firebaseEmail, currentPassword);

      await reauthenticateWithCredential(firebaseUser, credential);
      await verifyBeforeUpdateEmail(firebaseUser, normalizedNewEmail);

      Keyboard.dismiss();
      onClose();

      Alert.alert(
        "Verify Your New Email",
        `A verification link was sent to ${normalizedNewEmail}. Your BuiltMode email will change after you verify that address.`,
      );
    } catch (error) {
      console.error("Unable to change email address:", error);
      setErrorMessage(getChangeEmailErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.emailModalRoot} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Pressable style={styles.emailModalBackdrop} onPress={handleClose} />

        <View style={styles.emailModalCard}>
          <View style={styles.emailModalHeader}>
            <View style={{ flex: 1, gap: 5 }}>
              <ThemedText style={styles.emailModalTitle}>Change Email Address</ThemedText>
              <ThemedText style={styles.emailModalDescription}>
                Verify your identity before changing the email connected to your BuiltMode account.
              </ThemedText>
            </View>

            <TouchableOpacity
              style={styles.emailModalCloseButton}
              onPress={handleClose}
              disabled={isSubmitting}
              hitSlop={8}
            >
              <Feather name="x" size={18} color={Colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.emailFormGroup}>
            <ThemedText style={styles.emailInputLabel}>CURRENT EMAIL</ThemedText>
            <View style={styles.currentEmailContainer}>
              <ThemedText style={styles.currentEmailText} numberOfLines={1}>
                {currentEmail || "No email available"}
              </ThemedText>
            </View>
          </View>

          <View style={styles.emailFormGroup}>
            <ThemedText style={styles.emailInputLabel}>NEW EMAIL</ThemedText>
            <TextInput
              value={newEmail}
              onChangeText={(value) => {
                setNewEmail(value);
                setErrorMessage(null);
              }}
              style={styles.emailTextInput}
              placeholder="name@example.com"
              placeholderTextColor={Colors.icon}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              editable={!isSubmitting}
              returnKeyType="next"
            />
          </View>

          <View style={styles.emailFormGroup}>
            <ThemedText style={styles.emailInputLabel}>CURRENT PASSWORD</ThemedText>
            <TextInput
              value={currentPassword}
              onChangeText={(value) => {
                setCurrentPassword(value);
                setErrorMessage(null);
              }}
              style={styles.emailTextInput}
              placeholder="Enter current password"
              placeholderTextColor={Colors.icon}
              secureTextEntry
              textContentType="password"
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (!isSubmitDisabled) {
                  void handleSubmit();
                }
              }}
            />
          </View>

          {errorMessage ? (
            <View style={styles.emailErrorContainer}>
              <FontAwesome5 name="exclamation-circle" size={12} color={Colors.error} />
              <ThemedText style={styles.emailErrorText}>{errorMessage}</ThemedText>
            </View>
          ) : null}

          <View style={styles.emailModalActions}>
            <TouchableOpacity
              style={styles.emailCancelButton}
              onPress={handleClose}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.emailCancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.emailSubmitButton, isSubmitDisabled && styles.emailSubmitButtonDisabled]}
              onPress={() => {
                void handleSubmit();
              }}
              disabled={isSubmitDisabled}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.background.primary} />
              ) : (
                <ThemedText style={styles.emailSubmitButtonText}>Send Verification</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ChangeEmailSheet;

const styles = StyleSheet.create({
  emailModalRoot: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emailModalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000000B3",
  },
  emailModalCard: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: Border.radius.md,
    padding: 20,
    gap: 18,
  },
  emailModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  emailModalTitle: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 18,
  },
  emailModalDescription: {
    fontFamily: Typography.family.primary.regular,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text.secondary,
  },
  emailModalCloseButton: {
    height: 32,
    width: 32,
    borderRadius: Border.radius.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  emailFormGroup: {
    gap: 7,
  },
  emailInputLabel: {
    fontFamily: Typography.family.secondary.medium,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.icon,
  },
  currentEmailContainer: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    backgroundColor: Colors.background.primary,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  currentEmailText: {
    fontFamily: Typography.family.primary.regular,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  emailTextInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 14,
    fontFamily: Typography.family.primary.regular,
    fontSize: 14,
    color: Colors.text.primary,
  },
  emailErrorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Border.radius.sm,
    padding: 10,
    backgroundColor: "#FF453A14",
  },
  emailErrorText: {
    flex: 1,
    fontFamily: Typography.family.primary.regular,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.error,
  },
  emailModalActions: {
    flexDirection: "row",
    gap: 10,
  },
  emailCancelButton: {
    minHeight: 46,
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background.primary,
  },
  emailCancelButtonText: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  emailSubmitButton: {
    minHeight: 46,
    flex: 1.5,
    borderRadius: Border.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: 12,
  },
  emailSubmitButtonDisabled: {
    opacity: 0.4,
  },
  emailSubmitButtonText: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 12,
    color: Colors.background.primary,
  },
});
