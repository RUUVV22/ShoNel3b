import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { GameHeader } from '../components/GameHeader';
import { ArabicText } from '../components/ArabicText';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

const steps = [
  { icon: 'people', title: 'كوّنوا فريقين', text: 'يحتاج كل فريق إلى قائد ولاعب واحد على الأقل. القائد وحده يرى هويات البطاقات المخفية.' },
  { icon: 'bulb', title: 'أعطِ تلميحاً واحداً', text: 'يكتب القائد كلمة عربية واحدة ورقماً يدل على عدد الكلمات المرتبطة بها، من دون استخدام كلمة موجودة على اللوحة.' },
  { icon: 'hand-left', title: 'اكشف البطاقات', text: 'يختار اللاعبون بطاقات فريقهم. البطاقة الصحيحة تسمح بالمحاولة مجدداً؛ المحايدة أو بطاقة الخصم تنهي الدور.' },
  { icon: 'skull', title: 'تجنّب بطاقة الموت', text: 'اختيار البطاقة السوداء ينهي الجولة فوراً ويمنح الفوز للفريق الآخر.' },
  { icon: 'trophy', title: 'اسبق الفريق الآخر', text: 'يفوز أول فريق يكشف جميع كلماته. للفريق الذي يبدأ تسع كلمات وللآخر ثمانٍ.' },
];

export function HowToPlayScreen({ navigation }) {
  return (
    <ScreenContainer>
      <GameHeader title="كيف نلعب كود نيمز؟" subtitle="قواعد اللعب على طاولتنا" onBack={() => navigation.goBack()} />
      <View style={styles.hero}>
        <ArabicText weight="extraBold" style={styles.heroTitle}>25 كلمة. تلميح واحد.</ArabicText>
        <ArabicText style={styles.heroText}>المطلوب أن يفهم فريقك ما تقصده قبل أن تقوده الكلمة إلى بطاقة الخصم.</ArabicText>
      </View>
      <View style={styles.steps}>
        {steps.map((step, index) => (
          <View key={step.title} style={styles.step}>
            <View style={styles.iconShell}>
              <Ionicons name={step.icon} size={22} color={index % 2 ? colors.blue : colors.red} />
            </View>
            <View style={styles.copy}>
              <ArabicText weight="bold" style={styles.stepTitle}>{index + 1}. {step.title}</ArabicText>
              <ArabicText style={styles.stepText}>{step.text}</ArabicText>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.tip}>
        <Ionicons name="sparkles" size={20} color={colors.gold} />
        <ArabicText style={styles.tipText}>نصيحة: فكّر في العلاقة بين الكلمات، لا في الكلمة الأقرب فقط.</ArabicText>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.plum, borderWidth: 2, borderBottomWidth: 6, borderColor: colors.plum, marginBottom: spacing.lg },
  heroTitle: { color: colors.gold, fontSize: 25 },
  heroText: { color: colors.paperMuted, fontSize: 14, lineHeight: 24, marginTop: spacing.sm },
  steps: { gap: spacing.md },
  step: { flexDirection: 'row-reverse', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.plum, backgroundColor: colors.cream },
  iconShell: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mustard, borderWidth: 1, borderColor: colors.plum },
  copy: { flex: 1 },
  stepTitle: { fontSize: 16, color: colors.plum },
  stepText: { color: colors.inkMuted, fontSize: 13, lineHeight: 21, marginTop: 2 },
  tip: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, padding: spacing.md, marginTop: spacing.lg, borderRadius: radius.md, borderWidth: 2, borderColor: colors.plum, backgroundColor: colors.mustard },
  tipText: { flex: 1, color: colors.plum, fontSize: 13 },
});
