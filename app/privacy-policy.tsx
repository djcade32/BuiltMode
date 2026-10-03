import LegalDocumentScreen from "@/components/legal/LegalDocumentScreen";
import document from "@/content/legal/privacy-policy.json";

export default function PrivacyPolicyScreen() {
  return <LegalDocumentScreen title="Privacy Policy" document={document} />;
}
