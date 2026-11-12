import { ReactNode, useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CURRENT_TERMS_VERSION } from "@builtmode/shared/schemas/legal";
import { acceptCurrentTerms, hasAcceptedCurrentTerms } from "@/services/legal-service";
import { useAuthStore } from "@/stores/auth-store";
import { Colors, Typography } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import ThemedButton from "@/components/ui/ThemedButton";
import TermsAgreement from "./TermsAgreement";

type Props = { uid: string; children: ReactNode };
type Status = "loading" | "required" | "accepted" | "error";

// The parent keys this component by UID so consent never crosses accounts.
export default function TermsAcceptanceGate({ uid, children }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const submitting = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    hasAcceptedCurrentTerms(uid).then((accepted) => {
      if (active) setStatus(accepted ? "accepted" : "required");
    }).catch(() => {
      if (active) {
        setMessage("We couldn’t check your agreement. Check your connection and try again.");
        setStatus("error");
      }
    });
    return () => { active = false; mounted.current = false; };
  }, [uid, attempt]);

  const accept = async () => {
    if (!checked || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setMessage("");
    try {
      await acceptCurrentTerms(uid, { accepted: true, termsVersion: CURRENT_TERMS_VERSION });
      if (mounted.current) setStatus("accepted");
    } catch {
      if (mounted.current) setMessage("Your agreement could not be saved. Check your connection and try again.");
    } finally {
      submitting.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const signout = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    try { await useAuthStore.getState().signout(); }
    catch { if (mounted.current) setMessage("Unable to sign out. Please try again."); }
    finally {
      submitting.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  if (status === "accepted") return <>{children}</>;
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.brand}>BUILTMODE</ThemedText>
        <ThemedText style={styles.title}>Before you continue</ThemedText>
        {status === "loading" ? <ActivityIndicator accessibilityLabel="Checking terms acceptance" color={Colors.accent.primary} /> : (
          <>
            {status === "required" ? (
              <>
                <ThemedText style={styles.copy}>Please review and accept our Terms of Service to continue using BuiltMode.</ThemedText>
                <TermsAgreement checked={checked} onChange={setChecked} disabled={busy} />
              </>
            ) : null}
            {message ? <ThemedText accessibilityRole="alert" style={styles.error}>{message}</ThemedText> : null}
            {status === "required" ? (
              <ThemedButton title="AGREE & CONTINUE" disabled={!checked || busy} isLoading={busy} onPress={accept} />
            ) : (
              <ThemedButton title="TRY AGAIN" disabled={busy} onPress={() => { setStatus("loading"); setMessage(""); setAttempt((value) => value + 1); }} />
            )}
          </>
        )}
        <ThemedButton title="SIGN OUT" disabled={busy} onPress={signout} style={styles.signout} textStyle={{ color: Colors.text.secondary }} />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background.primary },
  content: { flexGrow: 1, justifyContent: "center", padding: 28, gap: 20 },
  brand: { color: Colors.accent.primary, fontFamily: Typography.family.tertiary.regular, fontSize: 16 },
  title: { fontSize: 26, lineHeight: 34, fontFamily: Typography.family.primary.bold },
  copy: { color: Colors.text.secondary, fontSize: 15, lineHeight: 23 },
  error: { color: Colors.error, fontSize: 14, lineHeight: 21 },
  signout: { backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.inputBorder },
});
