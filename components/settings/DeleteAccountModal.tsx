import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { FirebaseError } from "firebase/app";
import { EmailAuthProvider, getAuth, reauthenticateWithCredential } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

type DeleteAccountModalProps = {
  visible: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onDeleteAccount: () => Promise<void>;
};

const DELETE_CONFIRMATION = "DELETE";

const getDeleteAccountErrorMessage = (error: unknown) => {
  if (!(error instanceof FirebaseError)) {
    return "BuiltMode could not delete your account. No changes were made. Please try again.";
  }

  switch (error.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "The current password you entered is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts were made. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "A network error occurred. Check your connection and try again.";
    case "auth/requires-recent-login":
      return "For security, sign out and sign back in before deleting your account.";
    case "auth/user-token-expired":
    case "functions/unauthenticated":
      return "Your session has expired. Sign in again and retry account deletion.";
    case "functions/unavailable":
      return "The account deletion service is temporarily unavailable. Please try again.";
    case "functions/deadline-exceeded":
      return "Account deletion took too long to complete. Please try again.";
    default:
      return "BuiltMode could not delete your account. No changes were made. Please try again.";
  }
};

const DeleteAccountModal = ({ visible, isDeleting, onClose, onDeleteAccount }: DeleteAccountModalProps) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const normalizedConfirmation = confirmationText.trim().toUpperCase();
  const isConfirmationValid = normalizedConfirmation === DELETE_CONFIRMATION;
  const isSubmitDisabled = isDeleting || !currentPassword || !isConfirmationValid;

  useEffect(() => {
    if (!visible) return;

    setCurrentPassword("");
    setConfirmationText("");
    setIsPasswordVisible(false);
    setErrorMessage(null);
  }, [visible]);

  const handleClose = () => {
    if (isDeleting) return;

    Keyboard.dismiss();
    onClose();
  };

  const handleDelete = async () => {
    if (!isConfirmationValid) {
      setErrorMessage(`Type ${DELETE_CONFIRMATION} to confirm account deletion.`);
      return;
    }

    if (!currentPassword) {
      setErrorMessage("Enter your current password.");
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
      setErrorMessage(
        "This account does not use email and password sign-in. Provider-specific reauthentication is required.",
      );
      return;
    }

    try {
      setErrorMessage(null);

      const credential = EmailAuthProvider.credential(currentEmail, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);

      /*
       * The backend callable must delete all user-owned Firestore and Storage
       * data before deleting the Firebase Authentication user.
       */
      await onDeleteAccount();

      Keyboard.dismiss();
    } catch (error) {
      console.error("Unable to delete account:", error);
      setErrorMessage(getDeleteAccountErrorMessage(error));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Pressable style={styles.modalBackdrop} onPress={handleClose} />

        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.headerCopy}>
              <ThemedText style={styles.modalTitle}>Permanently Delete Account</ThemedText>
              <ThemedText style={styles.modalDescription}>
                This is the final confirmation. Once completed, your account and deleted data cannot be restored.
              </ThemedText>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={isDeleting}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close account deletion"
            >
              <Feather name="x" size={18} color={Colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.warningContainer}>
            <FontAwesome5 name="exclamation-triangle" size={16} color={Colors.error} />

            <View style={styles.warningCopy}>
              <ThemedText style={styles.warningTitle}>THIS CANNOT BE UNDONE</ThemedText>
              <ThemedText style={styles.warningText}>
                Your workouts, photos, statistics, streaks, friendships, profile, and account access will be
                permanently removed.
              </ThemedText>
            </View>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.inputLabel}>CURRENT PASSWORD</ThemedText>

            <View style={styles.passwordInputContainer}>
              <TextInput
                value={currentPassword}
                onChangeText={(value) => {
                  setCurrentPassword(value);
                  setErrorMessage(null);
                }}
                style={styles.passwordInput}
                placeholder="Enter current password"
                placeholderTextColor={Colors.icon}
                secureTextEntry={!isPasswordVisible}
                textContentType="password"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isDeleting}
                returnKeyType="next"
              />

              <TouchableOpacity
                style={styles.visibilityButton}
                onPress={() => setIsPasswordVisible((current) => !current)}
                disabled={isDeleting}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
              >
                <Feather name={isPasswordVisible ? "eye-off" : "eye"} size={17} color={Colors.icon} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.inputLabel}>TYPE {DELETE_CONFIRMATION} TO CONFIRM</ThemedText>

            <TextInput
              value={confirmationText}
              onChangeText={(value) => {
                setConfirmationText(value);
                setErrorMessage(null);
              }}
              style={[styles.confirmationInput, isConfirmationValid && styles.confirmationInputValid]}
              placeholder={DELETE_CONFIRMATION}
              placeholderTextColor={Colors.icon}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isDeleting}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (!isSubmitDisabled) {
                  void handleDelete();
                }
              }}
            />
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
              disabled={isDeleting}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.cancelButtonText}>Keep Account</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, isSubmitDisabled && styles.deleteButtonDisabled]}
              onPress={() => {
                void handleDelete();
              }}
              disabled={isSubmitDisabled}
              activeOpacity={0.8}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.deleteButtonText}>Delete Forever</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default DeleteAccountModal;

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000000C7",
  },
  modalCard: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: Border.radius.md,
    padding: 20,
    gap: 17,
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
    color: Colors.error,
  },
  modalDescription: {
    fontFamily: Typography.family.primary.regular,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text.secondary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: Border.radius.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Border.radius.md,
    backgroundColor: "#FF453A14",
    padding: 13,
  },
  warningCopy: {
    flex: 1,
    gap: 5,
  },
  warningTitle: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.error,
  },
  warningText: {
    fontFamily: Typography.family.primary.regular,
    fontSize: 11,
    lineHeight: 17,
    color: Colors.text.secondary,
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
  confirmationInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 14,
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 14,
    letterSpacing: 1.2,
    color: Colors.text.primary,
  },
  confirmationInputValid: {
    borderColor: Colors.error,
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
    backgroundColor: Colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  deleteButton: {
    minHeight: 46,
    flex: 1.5,
    borderRadius: Border.radius.md,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  deleteButtonDisabled: {
    opacity: 0.4,
  },
  deleteButtonText: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 12,
    color: "#FFFFFF",
  },
});
