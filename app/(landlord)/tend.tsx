import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, text, radius, shadow, headerBase, cardBase } from '../../lib/theme';

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
        q: 'When is rent due?',
        a: 'Rent is typically due on the 1st of each month, as stated in the lease. Check the lease for the specific due date and any grace period (usually 3–5 days).',
      },
      {
        q: 'How do tenants pay rent?',
        a: 'Tenants can submit payments via the Pay tab in this app. Accepted methods may also include check or bank transfer as specified in the lease.',
      },
      {
        q: 'What if a tenant can\'t pay on time?',
        a: 'Encourage tenants to reach out early. Many situations are resolved with a payment plan — get any agreement in writing. Document all communications.',
      },
      {
        q: 'What are late fees?',
        a: 'Late fees must be specified in the lease to be enforceable. Some states cap the amount and require a grace period. Review local landlord-tenant law to ensure your lease terms are valid.',
      },
    ],
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    questions: [
      {
        q: 'How do tenants submit a request?',
        a: 'Tenants use the Maintenance tab in the Tendly app to submit a request with a title, description, and optional photos. You\'ll be notified immediately.',
      },
      {
        q: 'What counts as an emergency?',
        a: 'Emergencies include: flooding, gas leaks, fire, no heat in winter, sewage backup, burst pipes, or electrical hazards. These require same-day response. Tenants should call 911 first for life-threatening situations.',
      },
      {
        q: 'Who pays for repairs?',
        a: 'Landlords are responsible for keeping the unit habitable: plumbing, heating, electrical, and structural repairs. Tenants are generally responsible for damage they cause and minor upkeep.',
      },
      {
        q: 'What if I can\'t fix something quickly?',
        a: 'Communicate a timeline to the tenant in writing. For habitability issues, many states require repair within 24–72 hours for emergencies. Failure to repair can expose you to rent withholding or "repair and deduct" claims.',
      },
    ],
  },
  {
    id: 'lease',
    label: 'Lease Terms',
    questions: [
      {
        q: 'When does the lease expire?',
        a: 'Lease dates are visible in the Tendly dashboard under each tenant\'s detail page. Send renewal notice 30–60 days before expiry as required by your state.',
      },
      {
        q: 'Can tenants have long-term guests?',
        a: 'Most leases limit guest stays to 7–14 consecutive days. Longer stays may constitute unauthorized occupancy. Ensure your lease includes a clear guest policy.',
      },
      {
        q: 'Can a tenant sublet?',
        a: 'Subletting without written landlord approval is prohibited in most leases and is grounds for lease termination. Always require written approval.',
      },
      {
        q: 'What happens when the lease expires?',
        a: 'The lease may auto-renew, convert to month-to-month, or require a new agreement. Send written renewal or non-renewal notice within the timeframe required by your state.',
      },
    ],
  },
  {
    id: 'moveout',
    label: 'Move Out',
    questions: [
      {
        q: 'How much notice must a tenant give?',
        a: 'Most leases require 30 days written notice for month-to-month tenancies. Fixed-term leases may specify a different notice date. Check your state\'s minimum requirements.',
      },
      {
        q: 'How do I return the security deposit?',
        a: 'Most states require returning the deposit (minus itemized deductions) within 14–30 days of move-out. Always provide an itemized statement. Failure to comply can result in penalties up to 3× the deposit.',
      },
      {
        q: 'What is a move-out inspection?',
        a: 'A walkthrough with the tenant to document the unit\'s condition. Offer this in writing. Use photos/video. It protects you from disputes over damage claims.',
      },
      {
        q: 'What can I deduct from the deposit?',
        a: 'Legitimate deductions: unpaid rent, cleaning beyond normal wear, damage caused by the tenant. You cannot deduct for normal wear and tear (minor scuffs, carpet wear from normal use).',
      },
    ],
  },
  {
    id: 'legal',
    label: 'Legal Resources',
    questions: [
      {
        q: 'HUD Landlord & Tenant Rights',
        a: 'The U.S. Department of Housing and Urban Development provides official guidance on fair housing, tenant rights, and landlord obligations.',
        link: { label: 'HUD Rental Assistance & Rights', url: 'https://www.hud.gov/topics/rental_assistance/tenantrights' },
      },
      {
        q: 'Plain-English Legal Guides (NOLO)',
        a: 'Nolo.com offers free, plain-English articles on landlord-tenant law, security deposits, evictions, and lease requirements — organized by state.',
        link: { label: 'NOLO Landlord-Tenant Law', url: 'https://www.nolo.com/legal-encyclopedia/landlord-tenant' },
      },
      {
        q: 'Find a local landlord-tenant attorney',
        a: 'Martindale.com and the American Bar Association\'s lawyer locator can connect you with landlord-tenant attorneys in your area.',
        link: { label: 'ABA Lawyer Locator', url: 'https://www.americanbar.org/groups/legal_services/flh-home/flh-bar-directories-and-lawyer-finders/' },
      },
      {
        q: 'Fair housing compliance',
        a: 'The Fair Housing Act prohibits discrimination based on race, color, national origin, religion, sex, familial status, or disability. File or respond to complaints through HUD.',
        link: { label: 'HUD Fair Housing', url: 'https://www.hud.gov/program_offices/fair_housing_equal_opp' },
      },
    ],
  },
];

export default function HelpScreen() {
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
              onPress={() => router.push('/(landlord)/messages')}
              accessibilityRole="button"
              accessibilityLabel="Go to messages"
            >
              <Text style={styles.ctaBtnText}>Go to Messages</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  answerText:  { fontSize: text.body, color: colors.gray[600], lineHeight: 24 },
  linkBtn:     { backgroundColor: colors.brand[50], borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center', minHeight: 48 },
  linkBtnText: { fontSize: text.body, color: colors.brand[700], fontWeight: '600' },
  ctaBtn:      { backgroundColor: colors.brand[600], borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center', minHeight: 48 },
  ctaBtnText:  { fontSize: text.body, color: colors.white, fontWeight: '600' },
});
