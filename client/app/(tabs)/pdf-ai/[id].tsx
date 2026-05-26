 import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { COLORS, TEXT_COLORS } from "@/utils/colors";
import { SPACING, BORDER_RADIUS } from "@/utils/spacing";
import { TYPOGRAPHY } from "@/utils/typography";
import { getPdfNoteById, deletePdfNote } from "@/services/pdfService";
import { Button } from "@/components/ui/Button";
import { ListChecks, KeyRound } from "lucide-react-native";

export default function PdfDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loading: authLoading } = useAuth();



  const [loading, setLoading] = useState(true);

  const [pdf, setPdf] = useState<any>(null);

  const load = async () => {
    try {
      setLoading(true);
      if (!id) return;
      const data = await getPdfNoteById(id);
      setPdf(data);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to load PDF details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, id]);

  const handleDelete = async () => {
    if (!id) return;
    Alert.alert("Delete PDF?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePdfNote(id);
            Alert.alert("Deleted", "PDF removed successfully.");
            router.back();
          } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to delete PDF");
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
              <Text style={styles.headerTitle}>PDF AI Result</Text>
              <Text style={styles.headerSubtitle}>{pdf?.fileName || "Loading..."}</Text>
            </View>
            <Button
              title="Delete"
              variant="outline"
              size="small"
              style={{ minWidth: 92 }}
              onPress={handleDelete}
            />
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : !pdf ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>PDF not found.</Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <Text style={styles.text}>{pdf.summary || ""}</Text>

              <View style={styles.subSection}>
                <View style={styles.subHeader}>
                  <ListChecks size={18} color={COLORS.primary} />
                  <Text style={styles.subHeaderText}>Important Points</Text>
                </View>
                {(pdf.importantPoints || []).length ? (
                  <View style={styles.list}>
                    {(pdf.importantPoints || []).map((p: string, idx: number) => (
                      <View key={`${idx}-${p}`} style={styles.row}>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.textSmall}>{p}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.textSmall}>No important points available.</Text>
                )}
              </View>

              <View style={styles.subSection}>
                <View style={styles.subHeader}>
                  <KeyRound size={18} color={COLORS.secondary} />
                  <Text style={styles.subHeaderText}>Keywords</Text>
                </View>
                {(pdf.keywords || []).length ? (
                  <View style={styles.keywordWrap}>
                    {(pdf.keywords || []).map((k: string) => (
                      <View key={k} style={styles.keywordChip}>
                        <Text style={styles.keywordText}>{k}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.textSmall}>No keywords available.</Text>
                )}
              </View>

              {!!pdf.extractedText ? (
                <View style={styles.subSection}>
                  <Text style={styles.subHeaderText}>Extracted Content Preview</Text>
                  <Text style={styles.textSmall}>{String(pdf.extractedText).slice(0, 1200)}</Text>
                </View>
              ) : null}
            </View>
          )}
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
    paddingBottom: 60,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.md,
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
  center: {
    paddingVertical: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
  },
  card: {
    margin: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    padding: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: TEXT_COLORS.primary,
    marginBottom: SPACING.sm,
  },
  text: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
    lineHeight: 22,
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
  list: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  dot: {
    color: COLORS.primary,
    fontWeight: "900",
    marginTop: 2,
  },
  textSmall: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
    lineHeight: 20,
    flex: 1,
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
});

