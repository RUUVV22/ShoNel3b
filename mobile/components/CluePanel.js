import React from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ArabicText } from './ArabicText';
import { PrimaryButton } from './PrimaryButton';
import { colors, teamColor } from '../theme/colors';
import { radius, spacing } from '../theme/layout';
import { useRoundInputs } from '../hooks/useRoundInputs';

const CLUE_INPUT_DEFAULTS = Object.freeze({ word: '', count: '1' });

function ClueHistory({ clues, hasCurrent = false }) {
  if (!clues.length) return null;
  return (
    <View style={styles.history}>
      <ArabicText weight="bold" style={styles.historyTitle}>تلميحات هذه الجولة</ArabicText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyList}>
        {[...clues].reverse().map((item, index) => (
          <View key={`${item.team}-${item.givenBy}-${item.word}-${index}`} style={[styles.historyItem, { borderColor: teamColor(item.team) }]}>
            <View style={[styles.historyDot, { backgroundColor: teamColor(item.team) }]} />
            <ArabicText weight="bold" style={styles.historyText}>{item.word} — {item.count}</ArabicText>
            {index === 0 && hasCurrent ? <ArabicText style={styles.currentBadge}>الحالي</ArabicText> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function CluePanel({ clue, clueHistory = [], showHistory, canGiveClue, waitingForClue, team, loading, onGiveClue, scopeKey }) {
  const { values, setField, submitAndReset } = useRoundInputs(CLUE_INPUT_DEFAULTS, scopeKey);
  const { word, count } = values;

  if (clue) {
    return (
      <View style={styles.stack}>
        <View style={[styles.display, { borderColor: teamColor(clue.team) }]}>
          <Ionicons name="bulb" size={22} color={colors.gold} />
          <View style={styles.clueCopy}>
            <ArabicText style={styles.caption}>التلميح الحالي</ArabicText>
            <ArabicText weight="extraBold" style={styles.clueText}>{clue.word} — {clue.count}</ArabicText>
          </View>
        </View>
        {showHistory ? <ClueHistory clues={clueHistory} hasCurrent /> : null}
      </View>
    );
  }

  if (canGiveClue) {
    return (
      <View style={styles.form}>
        <ArabicText weight="bold" style={styles.formTitle}>أعطِ فريقك تلميحاً</ArabicText>
        <View style={styles.fields}>
          <TextInput
            value={word}
            onChangeText={value => setField('word', value)}
            placeholder="الكلمة الدالة"
            placeholderTextColor={colors.muted}
            maxLength={24}
            returnKeyType="done"
            style={[styles.input, styles.wordInput]}
          />
          <TextInput
            value={count}
            onChangeText={(value) => setField('count', value.replace(/\D/g, '').slice(0, 1))}
            keyboardType="number-pad"
            maxLength={1}
            style={[styles.input, styles.countInput]}
          />
        </View>
        <PrimaryButton
          compact
          title="إعطاء التلميح"
          icon="bulb-outline"
          variant={team === 'RED' ? 'red' : 'blue'}
          loading={loading}
          disabled={loading || !word.trim() || !count}
          onPress={() => submitAndReset(() => onGiveClue(word, Number(count)))}
        />
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <View style={styles.waiting}>
        <Ionicons name="hourglass-outline" size={19} color={colors.muted} />
        <ArabicText style={styles.waitingText}>
          {waitingForClue ? 'بانتظار تلميح قائد الفريق…' : 'قائد الفريق الآخر يفكر في التلميح…'}
        </ArabicText>
      </View>
      {showHistory ? <ClueHistory clues={clueHistory} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.xs },
  display: {
    minHeight: 58,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: radius.md,
    backgroundColor: colors.panelRaised,
    paddingHorizontal: spacing.md,
  },
  clueCopy: { flex: 1 },
  caption: { color: colors.muted, fontSize: 11 },
  clueText: { color: colors.gold, fontSize: 21 },
  form: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.panelRaised },
  formTitle: { fontSize: 14 },
  fields: { flexDirection: 'row-reverse', gap: spacing.sm },
  input: {
    minHeight: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
    color: colors.ink,
    fontFamily: 'Tajawal_500Medium',
    fontSize: 15,
    paddingHorizontal: spacing.md,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  wordInput: { flex: 1 },
  countInput: { width: 58, textAlign: 'center', writingDirection: 'ltr' },
  waiting: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  waitingText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  history: { gap: 4 },
  historyTitle: { color: colors.paperMuted, fontSize: 10 },
  historyList: { flexDirection: 'row-reverse', gap: spacing.xs },
  historyItem: { minHeight: 28, flexDirection: 'row-reverse', alignItems: 'center', gap: 5, paddingHorizontal: 8, borderWidth: 1, borderRadius: radius.pill, backgroundColor: colors.panel },
  historyDot: { width: 6, height: 6, borderRadius: 3 },
  historyText: { color: colors.paper, fontSize: 10 },
  currentBadge: { color: colors.gold, fontSize: 8 },
});
