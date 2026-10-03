import { ThemedText } from "@/components/themed-text";
import { Colors, Typography } from "@/constants/theme";
import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LegalDocumentScreenProps = {
  title: string;
  document: {
    title: string;
    effectiveDate: string;
    introduction: string;
    sections: { title: string; body: string }[];
  };
};

const openLink = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Unable to open link", "Please try again or open the address manually.");
  }
};

// Support the inline formatting used in the supplied documents without adding
// a Markdown dependency or allowing arbitrary HTML.
function inlineText(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https:\/\/[^)]+\)|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/g).map((part, index) => {
    if (part.startsWith("**")) {
      return <ThemedText key={index} style={styles.bold}>{inlineText(part.slice(2, -2))}</ThemedText>;
    }
    const link = part.match(/^\[([^\]]+)\]\((https:\/\/[^)]+)\)$/);
    const isEmail = /^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(part);
    if (link || isEmail) {
      const url = link ? link[2] : `mailto:${part}`;
      return (
        <ThemedText key={index} accessibilityRole="link" style={styles.link} onPress={() => void openLink(url)}>
          {link ? link[1] : part}
        </ThemedText>
      );
    }
    return part;
  });
}

function DocumentBody({ text }: { text: string }) {
  return text.split(/\n\s*\n/).map((block, index) => {
    if (block.startsWith("### ")) {
      return <ThemedText key={index} accessibilityRole="header" style={styles.subheading}>{block.slice(4)}</ThemedText>;
    }
    if (block.startsWith("- ")) {
      return (
        <View key={index} style={styles.list}>
          {block.split("\n").map((item, itemIndex) => (
            <View key={itemIndex} style={styles.listItem}>
              <ThemedText style={styles.body}>•</ThemedText>
              <ThemedText selectable style={[styles.body, styles.listText]}>{inlineText(item.slice(2))}</ThemedText>
            </View>
          ))}
        </View>
      );
    }
    return <ThemedText key={index} selectable style={styles.body}>{inlineText(block.replace(/ {2}\n/g, "\n"))}</ThemedText>;
  });
}

export default function LegalDocumentScreen({ title, document }: LegalDocumentScreenProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/")}
        >
          <FontAwesome6 name="arrow-left" size={16} color={Colors.gray} />
        </TouchableOpacity>
        <ThemedText accessibilityRole="header" style={styles.title}>{title}</ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <ThemedText accessibilityRole="header" style={styles.documentTitle}>{document.title}</ThemedText>
          <ThemedText style={styles.effectiveDate}>Effective date: {document.effectiveDate}</ThemedText>
          <DocumentBody text={document.introduction} />
        </View>
        {document.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText accessibilityRole="header" style={styles.sectionTitle}>{section.title}</ThemedText>
            <DocumentBody text={section.body} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerSpacer: { width: 44 },
  title: { flex: 1, textAlign: "center", fontFamily: Typography.family.primary.bold, fontSize: 18 },
  content: { padding: 24, gap: 24, width: "100%", maxWidth: 760, alignSelf: "center" },
  documentTitle: { fontSize: 24, fontFamily: Typography.family.primary.bold },
  effectiveDate: { fontSize: 14, fontFamily: Typography.family.primary.semibold, color: Colors.accent.primary, marginBottom: 8 },
  section: { gap: 14 },
  subheading: { fontSize: 16, fontFamily: Typography.family.primary.semibold },
  bold: { fontSize: 15, fontFamily: Typography.family.primary.semibold, color: Colors.gray },
  link: { fontSize: 15, color: Colors.accent.primary, textDecorationLine: "underline" },
  list: { gap: 8 },
  listItem: { flexDirection: "row", gap: 10 },
  listText: { flex: 1 },
  sectionTitle: { fontSize: 18, fontFamily: Typography.family.primary.semibold },
  body: { color: Colors.gray, fontSize: 15, lineHeight: 24 },
});
