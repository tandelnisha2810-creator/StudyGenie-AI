import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthGuard } from '@/components/AuthGuard';
import {
  BookOpen,
  Brain,
  Clock3,
  Sparkles,
  FileText,
  Bot,
} from 'lucide-react-native';

export default function HomeScreen() {
  return (
    <AuthGuard>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        style={styles.header}>
        <Text style={styles.greeting}>👋 Hello Rahul</Text>

        <Text style={styles.title}>StudyGenie AI</Text>

        <Text style={styles.subtitle}>
          Smart AI learning assistant for students
        </Text>
      </LinearGradient>

      {/* AI CARD */}
      <View style={styles.aiCard}>
        <View style={styles.aiTop}>
          <Brain size={30} color="#4F46E5" />
          <Text style={styles.aiTitle}>AI Study Assistant</Text>
        </View>

        <Text style={styles.aiText}>
          Generate notes, quizzes, summaries and improve your productivity with
          AI.
        </Text>

        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>

      {/* FEATURES */}
      <Text style={styles.sectionTitle}>Features</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <BookOpen size={28} color="#4F46E5" />
          <Text style={styles.cardTitle}>Notes</Text>
          <Text style={styles.cardText}>
            Create smart study notes instantly
          </Text>
        </View>

        <View style={styles.card}>
          <Sparkles size={28} color="#7C3AED" />
          <Text style={styles.cardTitle}>Quiz AI</Text>
          <Text style={styles.cardText}>
            Generate quizzes using AI
          </Text>
        </View>

        <View style={styles.card}>
          <Clock3 size={28} color="#0EA5E9" />
          <Text style={styles.cardTitle}>Planner</Text>
          <Text style={styles.cardText}>
            Organize study schedules easily
          </Text>
        </View>

        <View style={styles.card}>
          <Bot size={28} color="#10B981" />
          <Text style={styles.cardTitle}>Chat Bot</Text>
          <Text style={styles.cardText}>
            Ask doubts anytime with AI
          </Text>
        </View>
      </View>

      {/* RECENT SECTION */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>

      <View style={styles.activityCard}>
        <FileText size={24} color="#4F46E5" />

        <View style={{ marginLeft: 12 }}>
          <Text style={styles.activityTitle}>
            AI Generated Physics Notes
          </Text>

          <Text style={styles.activitySub}>
            Last opened 2 hours ago
          </Text>
        </View>
      </View>

      <View style={{ height: 30 }} />
      </ScrollView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  header: {
    paddingTop: 70,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  greeting: {
    color: '#E0E7FF',
    fontSize: 18,
    marginBottom: 10,
  },

  title: {
    color: '#fff',
    fontSize: 34,
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#EDE9FE',
    fontSize: 15,
    marginTop: 10,
    lineHeight: 22,
  },

  aiCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -25,
    borderRadius: 24,
    padding: 22,
    elevation: 4,
  },

  aiTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  aiTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 10,
    color: '#111827',
  },

  aiText: {
    marginTop: 14,
    color: '#6B7280',
    lineHeight: 22,
    fontSize: 15,
  },

  startButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 20,
    alignItems: 'center',
  },

  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 16,
    color: '#111827',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  card: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
    color: '#111827',
  },

  cardText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 20,
  },

  activityCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },

  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  activitySub: {
    color: '#6B7280',
    marginTop: 4,
  },
});