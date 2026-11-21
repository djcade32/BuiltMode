import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { REPORT_POST_REASONS, ReportPostReason } from "@/packages/shared/src/types/social";
import { reportFeedPost } from "@/services/social-service";
import { useUserStore } from "@/stores/user-store";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

const REASON_LABELS: Record<ReportPostReason, string> = {
  harassment: "Harassment or bullying",
  hate_speech: "Hate speech",
  sexual_content: "Sexual content",
  violence: "Violence or threats",
  spam: "Spam or scams",
  other: "Other",
};

type Props = { visible: boolean; feedItemId: string; authorUsername: string; onClose: () => void };

export default function ReportPostModal({ visible, feedItemId, authorUsername, onClose }: Props) {
  const uid = useUserStore((state) => state.user?.uid);
  const [reason, setReason] = useState<ReportPostReason | null>(null);
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const mounted = useRef(true);
  const receipt = useRef<{ uid: string; duplicate: boolean } | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const resetForm = () => {
    setReason(null);
    setDetails("");
    setError(null);
  };
  const close = () => {
    if (submitting.current) return;
    resetForm();
    onClose();
  };
  const showReceipt = () => {
    const saved = receipt.current;
    receipt.current = null;
    if (!saved || !mounted.current || useUserStore.getState().user?.uid !== saved.uid) return;
    Alert.alert(
      saved.duplicate ? "Already Reported" : "Report Submitted",
      saved.duplicate ? "You have already reported this post. Your original report is saved."
        : "Thank you for helping keep BuiltMode safe. Your report has been submitted for review.",
    );
  };

  const submit = async () => {
    if (submitting.current || !uid || !reason) return;
    if (reason === "other" && !details.trim()) {
      setError("Please describe why you are reporting this post.");
      return;
    }
    submitting.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await reportFeedPost({ feedItemId, reason, details: details.trim() });
      if (!mounted.current || useUserStore.getState().user?.uid !== uid) return;
      receipt.current = { uid, duplicate: result.status === "already_reported" };
      resetForm();
      onClose();
      // Present after the native iOS modal is fully dismissed.
      if (Platform.OS !== "ios") showReceipt();
    } catch (failure) {
      if (mounted.current && useUserStore.getState().user?.uid === uid) {
        setError(failure instanceof Error ? failure.message : "Your report could not be submitted. Please try again.");
      }
    } finally {
      submitting.current = false;
      if (mounted.current) setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close} onDismiss={showReceipt}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.card} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText style={styles.title}>Report Post</ThemedText>
          <ThemedText style={styles.description}>Why are you reporting @{authorUsername}&apos;s post?</ThemedText>
          <ThemedText style={styles.description}>Your identity will not be shared with the post author.</ThemedText>
          <View style={styles.reasons}>
            {REPORT_POST_REASONS.map((value) => (
              <TouchableOpacity
                key={value}
                style={[styles.reason, reason === value && styles.selected]}
                accessibilityRole="radio"
                accessibilityState={{ checked: reason === value, disabled: isSubmitting }}
                disabled={isSubmitting}
                onPress={() => { setReason(value); setError(null); }}
              >
                <ThemedText style={styles.reasonText}>{REASON_LABELS[value]}</ThemedText>
                <ThemedText style={styles.check}>{reason === value ? "●" : "○"}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          <ThemedText style={styles.description}>Details {reason === "other" ? "(required)" : "(optional)"}</ThemedText>
          <TextInput
            accessibilityLabel="Report details"
            style={styles.input}
            placeholder="Tell us what happened"
            placeholderTextColor={Colors.icon}
            multiline maxLength={1000} editable={!isSubmitting}
            value={details} onChangeText={setDetails}
          />
          <ThemedText style={styles.description}>{details.length}/1000</ThemedText>
          {error && <ThemedText accessibilityRole="alert" style={styles.error}>{error}</ThemedText>}
          <TouchableOpacity
            accessibilityRole="button" accessibilityLabel="Submit Report"
            style={[styles.submit, (!reason || isSubmitting || !uid) && styles.disabled]}
            disabled={!reason || isSubmitting || !uid} onPress={() => void submit()}
          >
            {isSubmitting ? <ActivityIndicator color={Colors.background.primary} /> : <ThemedText style={styles.submitText}>Submit Report</ThemedText>}
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.cancel} disabled={isSubmitting} onPress={close}>
            <ThemedText>Cancel</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.65)" },
  card: { flexGrow: 0, maxHeight: "90%", backgroundColor: Colors.background.secondary, borderRadius: Border.radius.md },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 20, fontFamily: Typography.family.primary.bold },
  description: { fontSize: 12, color: Colors.text.secondary },
  reasons: { gap: 8 },
  reason: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: Border.radius.md },
  selected: { borderColor: Colors.accent.primary },
  reasonText: { flex: 1, fontSize: 14 },
  check: { color: Colors.accent.primary },
  input: { minHeight: 80, padding: 12, color: Colors.text.primary, backgroundColor: Colors.background.primary, borderRadius: Border.radius.md, textAlignVertical: "top" },
  error: { color: Colors.error, fontSize: 12 },
  submit: { alignItems: "center", padding: 14, backgroundColor: Colors.accent.primary, borderRadius: Border.radius.md },
  submitText: { color: Colors.background.primary, fontFamily: Typography.family.primary.bold },
  disabled: { opacity: 0.5 },
  cancel: { alignItems: "center", padding: 10 },
});
