import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { FirebaseError } from "firebase/app";
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
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

type ChangePasswordModalProps = {
  visible: boolean;
  /**
   * Kept temporarily for compatibility with the current settings screen.
   * Firebase operations use getAuth().currentUser instead.
   */
  authUser?: unknown;
  onClose: () => void;
};

const MINIMUM_PASSWORD_LENGTH = 8;

const getChangePasswordErrorMessage = (error: unknown) => {
  if (!(error instanceof FirebaseError)) {
    return "BuiltMode could not update your password. Please try again.";
  }

  switch (error.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "The current password you entered is incorrect.";
    case "auth/weak-password":
      return "Your new password does not meet the account password requirements.";
    case "auth/too-many-requests":
      return "Too many attempts were made. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "A network error occurred. Check your connection and try again.";
    case "auth/requires-recent-login":
      return "For security, sign out and sign back in before changing your password.";
    case "auth/user-token-expired":
      return "Your session has expired. Sign in again and retry the change.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/operation-not-allowed":
      return "Password changes are not currently enabled for this account.";
    default:
      return "BuiltMode could not update your password. Please try again.";
  }
};

const PasswordInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  visible,
  onToggleVisibility,
  editable,
  returnKeyType,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  visible: boolean;
  onToggleVisibility: () => void;
  editable: boolean;
  returnKeyType: "next" | "done";
  onSubmitEditing?: () => void;
}) => {
  return (
    <View style={styles.formGroup}>
      <ThemedText style={styles.inputLabel}>{label}</ThemedText>

      <View style={styles.passwordInputContainer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={styles.passwordInput}
          placeholder={placeholder}
          placeholderTextColor={Colors.icon}
          secureTextEntry={!visible}
          textContentType={label === "CURRENT PASSWORD" ? "password" : "newPassword"}
          autoComplete={label === "CURRENT PASSWORD" ? "current-password" : "new-password"}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />

        <TouchableOpacity
          style={styles.visibilityButton}
          onPress={onToggleVisibility}
          disabled={!editable}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          <Feather name={visible ? "eye-off" : "eye"} size={17} color={Colors.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ChangePasswordModal = ({ visible, onClose }: ChangePasswordModalProps) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmedPasswordVisible, setIsConfirmedPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordChecks = useMemo(
    () => ({
      longEnough: newPassword.length >= MINIMUM_PASSWORD_LENGTH,
      passwordsMatch: Boolean(newPassword) && newPassword === confirmedPassword,
      differentFromCurrent: Boolean(newPassword) && newPassword !== currentPassword,
    }),
    [confirmedPassword, currentPassword, newPassword],
  );

  const isSubmitDisabled =
    isSubmitting ||
    !currentPassword ||
    !passwordChecks.longEnough ||
    !passwordChecks.passwordsMatch ||
    !passwordChecks.differentFromCurrent;

  useEffect(() => {
    if (!visible) return;

    setCurrentPassword("");
    setNewPassword("");
    setConfirmedPassword("");
    setIsCurrentPasswordVisible(false);
    setIsNewPasswordVisible(false);
    setIsConfirmedPasswordVisible(false);
    setErrorMessage(null);
    setIsSubmitting(false);
  }, [visible]);

  const clearError = () => {
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;

    Keyboard.dismiss();
    onClose();
  };

  const validateForm = () => {
    if (!currentPassword) {
      return "Enter your current password.";
    }

    if (newPassword.length < MINIMUM_PASSWORD_LENGTH) {
      return `Your new password must be at least ${MINIMUM_PASSWORD_LENGTH} characters.`;
    }

    if (newPassword === currentPassword) {
      return "Your new password must be different from your current password.";
    }

    if (newPassword !== confirmedPassword) {
      return "The new passwords do not match.";
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const firebaseUser = getAuth().currentUser;

    if (!firebaseUser) {
      setErrorMessage("Your authenticated account could not be found. Sign in again and retry.");
      return;
    }

    const currentEmail = firebaseUser.email?.trim();

    if (!currentEmail) {
      setErrorMessage("Your account does not have an email address available.");
      return;
    }

    const hasPasswordProvider = firebaseUser.providerData.some((provider) => provider.providerId === "password");

    if (!hasPasswordProvider) {
      setErrorMessage("This account does not use email and password sign-in.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const credential = EmailAuthProvider.credential(currentEmail, currentPassword);

      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);

      Keyboard.dismiss();
      onClose();

      Alert.alert(
        "Password Updated",
        "Your BuiltMode password was changed successfully. Use the new password the next time you sign in.",
      );
    } catch (error) {
      console.error("Unable to change password:", error);
      setErrorMessage(getChangePasswordErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Pressable style={styles.modalBackdrop} onPress={handleClose} />

        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.headerCopy}>
              <ThemedText style={styles.modalTitle}>Change Password</ThemedText>
              <ThemedText style={styles.modalDescription}>
                Confirm your current password, then create a new password for your BuiltMode account.
              </ThemedText>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={isSubmitting}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close change password"
            >
              <Feather name="x" size={18} color={Colors.icon} />
            </TouchableOpacity>
          </View>

          <PasswordInput
            label="CURRENT PASSWORD"
            value={currentPassword}
            onChangeText={(value) => {
              setCurrentPassword(value);
              clearError();
            }}
            placeholder="Enter current password"
            visible={isCurrentPasswordVisible}
            onToggleVisibility={() => setIsCurrentPasswordVisible((current) => !current)}
            editable={!isSubmitting}
            returnKeyType="next"
          />

          <PasswordInput
            label="NEW PASSWORD"
            value={newPassword}
            onChangeText={(value) => {
              setNewPassword(value);
              clearError();
            }}
            placeholder="Create new password"
            visible={isNewPasswordVisible}
            onToggleVisibility={() => setIsNewPasswordVisible((current) => !current)}
            editable={!isSubmitting}
            returnKeyType="next"
          />

          <PasswordInput
            label="CONFIRM NEW PASSWORD"
            value={confirmedPassword}
            onChangeText={(value) => {
              setConfirmedPassword(value);
              clearError();
            }}
            placeholder="Re-enter new password"
            visible={isConfirmedPasswordVisible}
            onToggleVisibility={() => setIsConfirmedPasswordVisible((current) => !current)}
            editable={!isSubmitting}
            returnKeyType="done"
            onSubmitEditing={() => {
              if (!isSubmitDisabled) {
                void handleSubmit();
              }
            }}
          />

          <View style={styles.requirementRow}>
            <Feather
              name={passwordChecks.longEnough ? "check-circle" : "circle"}
              size={13}
              color={passwordChecks.longEnough ? Colors.accent.primary : Colors.icon}
            />
            <ThemedText
              style={[styles.requirementText, passwordChecks.longEnough && styles.requirementTextComplete]}
            >
              At least {MINIMUM_PASSWORD_LENGTH} characters
            </ThemedText>
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <FontAwesome5 name="exclamation-circle" size={12} color={Colors.error} />
              <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            </View>
          ) : null}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
              onPress={() => {
                void handleSubmit();
              }}
              disabled={isSubmitDisabled}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.background.primary} />
              ) : (
                <ThemedText style={styles.submitButtonText}>Update Password</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ChangePasswordModal;

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000000B3",
  },
  modalCard: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: Border.radius.md,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 5,
  },
  modalTitle: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 18,
  },
  modalDescription: {
    fontFamily: Typography.family.primary.regular,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text.secondary,
  },
  closeButton: {
    height: 32,
    width: 32,
    borderRadius: Border.radius.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  formGroup: {
    gap: 7,
  },
  inputLabel: {
    fontFamily: Typography.family.secondary.medium,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.icon,
  },
  passwordInputContainer: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    backgroundColor: Colors.background.primary,
  },
  passwordInput: {
    minHeight: 48,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 0,
    fontFamily: Typography.family.primary.regular,
    fontSize: 14,
    color: Colors.text.primary,
  },
  visibilityButton: {
    minHeight: 48,
    width: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  requirementText: {
    fontFamily: Typography.family.primary.regular,
    fontSize: 11,
    color: Colors.icon,
  },
  requirementTextComplete: {
    color: Colors.text.secondary,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Border.radius.sm,
    padding: 10,
    backgroundColor: "#FF453A14",
  },
  errorText: {
    flex: 1,
    fontFamily: Typography.family.primary.regular,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.error,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    minHeight: 46,
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background.primary,
  },
  cancelButtonText: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  submitButton: {
    minHeight: 46,
    flex: 1.5,
    borderRadius: Border.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: 12,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 12,
    color: Colors.background.primary,
  },
});
