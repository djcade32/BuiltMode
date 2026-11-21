import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { FontAwesome6 } from "@expo/vector-icons";
import { Link } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type Props = { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean };

export default function TermsAgreement({ checked, onChange, disabled = false }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="checkbox"
        accessibilityLabel="I agree to the Terms of Service and acknowledge the Privacy Policy"
        accessibilityState={{ checked, disabled }}
        disabled={disabled}
        onPress={() => onChange(!checked)}
        style={styles.row}
      >
        <View style={[styles.checkbox, checked && styles.checked]}>
          {checked ? <FontAwesome6 name="check" size={14} color={Colors.background.primary} /> : null}
        </View>
        <ThemedText style={styles.copy}>I agree to the Terms of Service and acknowledge the Privacy Policy.</ThemedText>
      </TouchableOpacity>
      <View style={styles.links}>
        <Link href="/terms-of-service" push asChild>
          <TouchableOpacity accessibilityRole="link" style={styles.linkButton}>
            <ThemedText style={styles.link}>Terms of Service</ThemedText>
          </TouchableOpacity>
        </Link>
        <Link href="/privacy-policy" push asChild>
          <TouchableOpacity accessibilityRole="link" style={styles.linkButton}>
            <ThemedText style={styles.link}>Privacy Policy</ThemedText>
          </TouchableOpacity>
        </Link>
      </View>
      <ThemedText style={styles.notice}>BuiltMode does not tolerate objectionable content or abusive behavior.</ThemedText>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 8, marginVertical: 16 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, minHeight: 44 },
  checkbox: { width: 24, height: 24, borderRadius: 5, borderWidth: 1, borderColor: Colors.inputBorder, alignItems: "center", justifyContent: "center", marginTop: 2 },
  checked: { backgroundColor: Colors.accent.primary, borderColor: Colors.accent.primary },
  copy: { flex: 1, fontSize: 14, lineHeight: 21, color: Colors.text.secondary },
  links: { flexDirection: "row", flexWrap: "wrap", columnGap: 18, paddingLeft: 36 },
  linkButton: { minHeight: 44, justifyContent: "center" },
  link: { fontSize: 13, color: Colors.accent.primary, textDecorationLine: "underline" },
  notice: { fontSize: 12, lineHeight: 18, color: Colors.text.secondary },
});
