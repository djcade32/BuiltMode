import LegalDocumentScreen from "@/components/legal/LegalDocumentScreen";
import document from "@/content/legal/terms-of-service.json";

export default function TermsOfServiceScreen() {
  return <LegalDocumentScreen title="Terms of Service" document={document} />;
}
