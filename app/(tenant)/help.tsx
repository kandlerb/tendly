import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, text, radius, shadow, headerBase, cardBase } from '../../lib/theme';
import { ScreenFade } from '../../components/ui/ScreenFade';

type Stage = 'home' | 'questions' | 'answer';

interface HelpQuestion {
  q: string;
  a: string;
  link?: { label: string; url: string };
}

interface HelpTopic {
  id: string;
  label: string;
  questions: HelpQuestion[];
}

const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'rent',
    label: 'Rent & Payments',
    questions: [
      {
        q: 'When is my rent due?',
        a: 'Your lease specifies the due date — typically the 1st of each month. Most leases include a grace period of 3–5 days before a late fee applies. Check your lease for the exact terms.',
      },
      {
        q: 'How do I pay rent?',
        a: 'Use the Pay tab in Tendly to submit your payment. If you need to pay by check or another method, contact your landlord through the Messages tab.',
      },
      {
        q: 'What if I can\'t pay on time?',
        a: 'Contact your landlord as early as possible — before the due date if you can. Many landlords will work out a payment plan. Get any agreement in writing through the Messages tab.',
      },
      {
        q: 'What are late fees?',
        a: 'Late fees must be written into your lease to be enforceable. Many states cap how much can be charged and require a grace period. Check your lease and your state\'s landlord-tenant law for limits.',
      },
    ],
  },
  {
    id: 'maintenance',
    label: 'Maintenance & Repairs',
    questions: [
      {
        q: 'How do I submit a maintenance request?',
        a: 'Tap the Requests tab and fill in a title, description, and optional photos. Your landlord is notified immediately. For emergencies, also call or message your landlord directly.',
      },
      {
        q: 'What counts as an emergency?',
        a: 'Emergencies include: flooding, gas leaks, fire, no heat in winter, sewage backup, burst pipes, or electrical hazards. Call 911 first for life-threatening situations, then notify your landlord immediately.',
      },
      {
        q: 'How long does my landlord have to fix things?',
        a: 'For emergencies, most states require a response within 24–72 hours. For non-emergency repairs, a "reasonable" timeframe applies — typically 30 days. If your unit becomes uninhabitable, you may have the right to withhold rent or "repair and deduct." Check your state\'s law.',
      },
      {
        q: 'Who pays for repairs?',
        a: 'Your landlord is responsible for keeping the unit habitable: plumbing, heating, electrical, and structural repairs. You are generally responsible for damage you or your guests cause, plus minor day-to-day upkeep.',
      },
    ],
  },
  {
    id: 'lease',
    label: 'My Lease',
    questions: [
      {
        q: 'Where can I find my lease dates?',
        a: 'Check the Documents tab in Tendly — your landlord may have uploaded your lease there. Your start and end dates are also visible in your lease agreement.',
      },
      {
        q: 'Can I have long-term guests?',
        a: 'Most leases limit guest stays to 7–14 consecutive days. Longer stays can be considered unauthorized occupancy and may violate your lease. Check your lease\'s guest policy and ask your landlord if you\'re unsure.',
      },
      {
        q: 'Can I sublet my unit?',
        a: 'Not without written landlord approval in most leases. Subletting without permission is typically grounds for lease termination. Always get approval in writing before subletting.',
      },
      {
        q: 'What happens when my lease expires?',
        a: 'Your lease may auto-renew, convert to month-to-month, or require signing a new agreement. Your landlord is required to give you advance notice — typically 30–60 days — about renewal or non-renewal. Check your state\'s requirements.',
      },
    ],
  },
  {
    id: 'moveout',
    label: 'Moving Out',
    questions: [
      {
        q: 'How much notice do I need to give?',
        a: 'Most month-to-month leases require 30 days written notice. Fixed-term leases may have different rules. Check your lease and your state\'s minimum notice requirements before setting a move-out date.',
      },
      {
        q: 'How do I get my security deposit back?',
        a: 'Your landlord must return your deposit — minus any itemized deductions — within 14–30 days of move-out, depending on your state. If they miss the deadline or deduct improperly, you may be owed penalties up to 3× the deposit amount.',
      },
      {
        q: 'What is a move-out inspection?',
        a: 'A walkthrough with your landlord to document the unit\'s condition when you leave. Request this in writing, take your own photos and video, and keep a copy. It protects you from disputed damage claims.',
      },
      {
        q: 'What can my landlord deduct from my deposit?',
        a: 'Legitimate deductions include unpaid rent, cleaning beyond normal wear, and damage you caused. Your landlord cannot deduct for normal wear and tear — minor scuffs, small nail holes, or carpet wear from regular use.',
      },
    ],
  },
  {
    id: 'legal',
    label: 'Legal Resources',
    questions: [
      {
        q: 'HUD Tenant Rights',
        a: 'The U.S. Department of Housing and Urban Development provides official guidance on tenant rights, fair housing, and rental assistance programs.',
        link: { label: 'HUD Rental Assistance & Rights', url: 'https://www.hud.gov/topics/rental_assistance/tenantrights' },
      },
      {
        q: 'Plain-English Legal Guides (NOLO)',
        a: 'Nolo.com offers free, plain-English articles on tenant rights, security deposits, lease terms, and eviction rules — organized by state.',
        link: { label: 'NOLO Tenant Rights by State', url: 'https://www.nolo.com/legal-encyclopedia/tenant-rights' },
      },
      {
        q: 'Find a local tenant attorney',
        a: 'The American Bar Association\'s lawyer locator can help you find landlord-tenant attorneys in your area. Many offer free or low-cost consultations.',
        link: { label: 'ABA Lawyer Locator', url: 'https://www.americanbar.org/groups/legal_services/flh-home/flh-bar-directories-and-lawyer-finders/' },
      },
      {
        q: 'Fair housing — your rights',
        a: 'The Fair Housing Act prohibits discrimination based on race, color, national origin, religion, sex, familial status, or disability. File a complaint with HUD if you believe your rights have been violated.',
        link: { label: 'HUD Fair Housing', url: 'https://www.hud.gov/program_offices/fair_housing_equal_opp' },
      },
    ],
  },
];

export default function TenantHelpScreen() {
  const [stage, setStage] = useState<Stage>('home');
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<HelpQuestion | null>(null);
  const router = useRouter();

  function selectTopic(topic: HelpTopic) {
    setSelectedTopic(topic);
    setStage('questions');
  }

  function selectQuestion(question: HelpQuestion) {
    setSelectedQuestion(question);
    setStage('answer');
  }

  function goBack() {
    if (stage === 'answer') {
      setStage('questions');
    } else {
      setStage('home');
      setSelectedTopic(null);
    }
  }

  const headerTitle =
    stage === 'home' ? 'Help' :
    stage === 'questions' ? selectedTopic!.label :
    'Answer';

  return (
    <ScreenFade>
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {stage !== 'home' && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={22} color={colors.gray[700]} />
          </TouchableOpacity>
        )}
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          {stage === 'home' && (
            <Text style={styles.headerSub}>Browse common questions by topic</Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {stage === 'home' && HELP_TOPICS.map((topic) => (
          <TouchableOpacity
            key={topic.id}
            style={styles.topicRow}
            onPress={() => selectTopic(topic)}
            accessibilityRole="button"
            accessibilityLabel={topic.label}
          >
            <Text style={styles.topicLabel}>{topic.label}</Text>
            <ChevronRight size={18} color={colors.brand[600]} />
          </TouchableOpacity>
        ))}

        {stage === 'questions' && selectedTopic && selectedTopic.questions.map((q, i) => (
          <TouchableOpacity
            key={i}
            style={styles.questionRow}
            onPress={() => selectQuestion(q)}
            accessibilityRole="button"
            accessibilityLabel={q.q}
          >
            <Text style={styles.questionText}>{q.q}</Text>
            <ChevronRight size={18} color={colors.gray[400]} />
          </TouchableOpacity>
        ))}

        {stage === 'answer' && selectedQuestion && (
          <View style={styles.answerCard}>
            <Text style={styles.answerQ}>{selectedQuestion.q}</Text>
            <Text style={styles.answerText}>{selectedQuestion.a}</Text>
            {selectedQuestion.link && (
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => Linking.openURL(selectedQuestion!.link!.url)}
                accessibilityRole="button"
                accessibilityLabel={selectedQuestion.link.label}
              >
                <Text style={styles.linkBtnText}>{selectedQuestion.link.label} →</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => router.push('/(tenant)/messages')}
              accessibilityRole="button"
              accessibilityLabel="Message my landlord"
            >
              <Text style={styles.ctaBtnText}>Message My Landlord</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
    </ScreenFade>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.gray[50] },
  header:      { ...headerBase, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn:     { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center', marginLeft: -12 },
  headerText:  { flex: 1 },
  headerTitle: { fontSize: text.pageTitle, fontWeight: '700', color: colors.gray[900] },
  headerSub:   { fontSize: text.caption, color: colors.gray[400], marginTop: 2 },
  scroll:      { flex: 1 },
  content:     { padding: 16, gap: 10 },

  topicRow:    { ...cardBase, ...shadow.sm, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, minHeight: 56 },
  topicLabel:  { flex: 1, fontSize: text.body, fontWeight: '600', color: colors.gray[800] },

  questionRow: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.gray[100], flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, minHeight: 52 },
  questionText:{ flex: 1, fontSize: text.body, color: colors.gray[800], marginRight: 8 },

  answerCard:  { ...cardBase, ...shadow.sm, padding: 24, gap: 16 },
  answerQ:     { fontSize: text.subheading, fontWeight: '700', color: colors.gray[900] },
  answerText:  { fontSize: text.body, color: colors.gray[500], lineHeight: 24 },
  linkBtn:     { backgroundColor: colors.brand[50], borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center', minHeight: 48 },
  linkBtnText: { fontSize: text.body, color: colors.brand[700], fontWeight: '600' },
  ctaBtn:      { backgroundColor: colors.brand[600], borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center', minHeight: 48 },
  ctaBtnText:  { fontSize: text.body, color: colors.white, fontWeight: '600' },
});
