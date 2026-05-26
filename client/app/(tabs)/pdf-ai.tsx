import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/Button";
import { COLORS, TEXT_COLORS } from "@/utils/colors";
import { SPACING, BORDER_RADIUS } from "@/utils/spacing";
import { TYPOGRAPHY } from "@/utils/typography";
import { PdfCard, PdfNoteItem } from "@/components/PdfCard";
import { uploadPdf, getPdfNotes, deletePdfNote } from "@/services/pdfService";
import { useRouter } from "expo-router";
import { FileUp, Sparkles, KeyRound, ListChecks, UploadCloud } from "lucide-react-native";

function formatKeywords(keywords: string[] = []) {
  return keywords.filter(Boolean);
}

export default function PdfAiScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [items, setItems] = useState<PdfNoteItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [selectedFile, setSelectedFile] = useState<
    | {
        uri: string;
        name: string;
        size?: number;
        type?: string;
      }
    | null
  >(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    summary?: string;
    importantPoints?: string[];
    keywords?: string[];
    extractedTextPreview?: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [isBusyId, setIsBusyId] = useState<string | null>(null);

  const dropZoneHint = useMemo(() => {
    if (Platform.OS !== "web") return "";
    return "Drop PDF here (web) or use Upload";
  }, []);

  const load = async () => {
    try {
      setLoadingList(true);
      if (!user?.uid) {
        setItems([]);
        return;
      }
      const pdfNotes = await getPdfNotes(user.uid);
      setItems(pdfNotes);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!authLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, authLoading]);

  const pickPdf = async () => {
    try {
      setErrorMessage("");
      setResult(null);

      const res = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (res.canceled) return;

      const file = res.assets?.[0];
      if (!file) return;
      if (!file.mimeType?.includes("pdf") && !file.name?.toLowerCase().endsWith(".pdf")) {
        Alert.alert("Invalid file", "Please select a PDF file.");
        return;
      }

      // Save web File (if present) + native uri.
      const assetAny = file as any;
      const webFile: File | undefined = assetAny?.file;

      setSelectedFile({
        uri: file.uri,
        name: file.name || "uploaded.pdf",
        size: file.size,
        type: file.mimeType,
        ...(webFile ? { file: webFile } : null),
      } as any);
    } catch (e) {
      console.error(e);
      Alert.alert("Upload error", "Failed to pick PDF.");
    }
  };

  const handleUploadAndSummarize = async () => {
    if (!user?.uid) {
      Alert.alert("Not signed in", "Please login first.");
      return;
    }
    if (!selectedFile?.uri || !selectedFile?.name) {
      Alert.alert("No PDF selected", "Choose a PDF file to upload.");
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage("");

      const formData = new FormData();

      // IMPORTANT (Expo Web): use the real File object when available.
      // expo-document-picker returns:
      // - native: { uri, name, mimeType }
      // - web: asset.file (native File)
      // Our backend expects multer field name: "pdf".
      const pickedAssetAny = (selectedFile as any);
      const webFile: File | undefined = pickedAssetAny?.file;

      const fileToUpload: any = webFile
        ? webFile
        : {
            uri: selectedFile.uri,
            name: selectedFile.name,
            type: selectedFile.type || "application/pdf",
          };

      console.log("================================");
      console.log("WEB PDF DEBUG");
      console.log("Selected file:", selectedFile);
      console.log("fileToUpload instanceof File:", webFile ? webFile instanceof File : false);
      console.log("fileToUpload:", webFile ? { name: webFile.name, type: webFile.type, size: webFile.size } : fileToUpload);
      console.log("================================");

      formData.append("pdf", fileToUpload);
      formData.append("userId", user.uid);

      const pdf = await uploadPdf(formData, user.uid);

      if (!pdf) throw new Error("No response from server");

      setResult({
        summary: pdf.summary,
        importantPoints: pdf.importantPoints,
        keywords: pdf.keywords,
        extractedTextPreview: (pdf.extractedText || "").slice(0, 600),
      });

      // Refresh list
      await load();
      Alert.alert("Success", "PDF uploaded and AI summary generated.");
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Failed to upload PDF";
      setErrorMessage(msg);
      Alert.alert("Error", msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete PDF?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setIsBusyId(id);
            // Optimistic
            setItems((prev) => prev.filter((x) => x.id !== id));
            await deletePdfNote(id);
            await load();
            Alert.alert("Deleted", "PDF removed successfully.");
          } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to delete PDF.");
            await load();
          } finally {
            setIsBusyId(null);
          }
        },
      },
    ]);
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <AuthGuard>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>📄 PDF AI</Text>
              <Text style={styles.headerSubtitle}>Upload a PDF and get an instant study summary.</Text>
            </View>
          </View>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>❌ {errorMessage}</Text>
            </View>
          ) : null}

          {/* Upload card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Upload PDF</Text>

            <TouchableOpacity
              style={styles.uploadArea}
              onPress={pickPdf}
              activeOpacity={0.8}
            >
              <UploadCloud size={32} color={COLORS.primary} />
              <Text style={styles.uploadTitle}>{Platform.OS === "web" ? "Drag & drop or upload" : "Choose a PDF"}</Text>
              {dropZoneHint ? <Text style={styles.uploadHint}>{dropZoneHint}</Text> : null}
            </TouchableOpacity>

            <View style={styles.selectedFileRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Selected file</Text>
                <Text style={styles.selectedFileText} numberOfLines={2}>
                  {selectedFile?.name || "No file selected"}
                </Text>
              </View>

              <Button
                title={selectedFile ? "Replace" : "Upload"}
                icon={<FileUp size={16} color={COLORS.white} />}
                onPress={pickPdf}
                variant="primary"
                size="small"
              />
            </View>

            <View style={styles.actionsRow}>
              <Button
                title={isProcessing ? "Processing..." : "Upload & Summarize"}
                onPress={handleUploadAndSummarize}
                disabled={isProcessing}
                icon={<Sparkles size={16} color={COLORS.white} />}
                style={{ flex: 1 }}
              />
            </View>

            {isProcessing ? (
              <View style={styles.processingRow}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.processingText}>Extracting text + generating summary...</Text>
              </View>
            ) : null}

            {/* AI result */}
            {result ? (
              <View style={{ marginTop: SPACING.lg }}>
                <Text style={styles.sectionTitle}>AI Summary</Text>
                {result.summary ? <Text style={styles.resultText}>{result.summary}</Text> : null}

                <View style={styles.subSection}>
                  <View style={styles.subHeader}>
                    <ListChecks size={18} color={COLORS.primary} />
                    <Text style={styles.subHeaderText}>Important Points</Text>
                  </View>
                  {(result.importantPoints || []).length ? (
                    <View style={styles.bullets}>
                      {(result.importantPoints || []).slice(0, 10).map((p, idx) => (
                        <View key={`${idx}-${p}`} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{p}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>No important points found.</Text>
                  )}
                </View>

                <View style={styles.subSection}>
                  <View style={styles.subHeader}>
                    <KeyRound size={18} color={COLORS.secondary} />
                    <Text style={styles.subHeaderText}>Keywords</Text>
                  </View>
                  {(formatKeywords(result.keywords) || []).length ? (
                    <View style={styles.keywordWrap}>
                      {formatKeywords(result.keywords).slice(0, 16).map((k) => (
                        <View key={k} style={styles.keywordChip}>
                          <Text style={styles.keywordText}>{k}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>No keywords found.</Text>
                  )}
                </View>

                {!!result.extractedTextPreview ? (
                  <View style={styles.subSection}>
                    <Text style={styles.subHeaderText}>Extracted Text Preview</Text>
                    <Text style={styles.resultTextSmall}>{result.extractedTextPreview}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* History */}
          <View style={styles.historyWrap}>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>PDF History</Text>
              <Text style={styles.historyCount}>{items.length} files</Text>
            </View>

            {loadingList ? (
              <View style={styles.centerRow}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : items.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📚</Text>
                <Text style={styles.emptyTitle}>No PDFs uploaded yet</Text>
                <Text style={styles.emptyDescription}>Upload a PDF to generate summaries and save them here.</Text>
              </View>
            ) : (
              <View style={styles.cardsCol}>
                {items.map((item) => (
                  <PdfCard
                    key={item.id}
                    item={item}
                    isBusy={isBusyId === item.id}
                    onViewDetails={() => router.push({ pathname: "/pdf-ai/[id]", params: { id: item.id } })}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  scroll: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: TEXT_COLORS.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
  },
  errorBanner: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.errorLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.error,
  },
  errorText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.error,
    fontWeight: "600",
  },
  card: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    shadowColor: "rgba(79,70,229,0.15)",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: TEXT_COLORS.primary,
    marginBottom: SPACING.md,
  },
  uploadArea: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: "rgba(79,70,229,0.28)",
    padding: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(79,70,229,0.06)",
    marginBottom: SPACING.lg,
  },
  uploadTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: TEXT_COLORS.primary,
    marginTop: SPACING.sm,
    fontWeight: "700",
    textAlign: "center",
  },
  uploadHint: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
    marginTop: SPACING.xs,
    textAlign: "center",
  },
  selectedFileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
    marginBottom: 4,
  },
  selectedFileText: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.primary,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  processingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginTop: SPACING.lg,
    justifyContent: "center",
  },
  processingText: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
  },
  resultText: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
    lineHeight: 22,
  },
  resultTextSmall: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
    lineHeight: 20,
  },
  subSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  subHeaderText: {
    ...TYPOGRAPHY.bodyMedium,
    color: TEXT_COLORS.primary,
    fontWeight: "800",
  },
  bullets: {
    gap: 6,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  bulletDot: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: "900",
  },
  bulletText: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
    flex: 1,
    lineHeight: 20,
  },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
  },
  keywordWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  keywordChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.35)",
    backgroundColor: "rgba(99,102,241,0.10)",
  },
  keywordText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "700",
  },
  historyWrap: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  historyCount: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
  },
  cardsCol: {
    paddingBottom: SPACING.xxl,
  },
  centerRow: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    paddingVertical: SPACING.xxl,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: TEXT_COLORS.primary,
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  emptyDescription: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
    textAlign: "center",
    paddingHorizontal: SPACING.lg,
    lineHeight: 20,
  },
});

