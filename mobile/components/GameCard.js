import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gsap } from 'gsap';
import { ArabicText } from './ArabicText';
import { cardColor, cardTextColor, colors } from '../theme/colors';
import { radius, shadow } from '../theme/layout';

export const CARD_SUSPENSE_MS = 900;

export const GameCard = memo(function GameCard({ card, width, disabled, selecting, onPress }) {
  const shakeX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const flip = useRef(new Animated.Value(0)).current;
  const wasRevealed = useRef(card.revealed);
  const rotation = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(card.type ? 1 : 0)).current;
  const hadIdentity = useRef(Boolean(card.type));
  const identityColor = cardColor(card.type);
  const identityTextColor = cardTextColor(card.type);

  useEffect(() => {
    if (!selecting || card.revealed) return undefined;
    const driver = { x: 0, rotation: 0, scale: 1 };
    const sync = () => {
      shakeX.setValue(driver.x);
      rotation.setValue(driver.rotation);
      scale.setValue(driver.scale);
    };
    const timeline = gsap.timeline({ onUpdate: sync });
    timeline
      .to(driver, { x: -5, rotation: -2.3, scale: 0.975, duration: 0.07, ease: 'power1.inOut' })
      .to(driver, { x: 6, rotation: 2.5, duration: 0.08, ease: 'power1.inOut' })
      .to(driver, { x: -6, rotation: -2.5, duration: 0.08, ease: 'power1.inOut' })
      .to(driver, { x: 5, rotation: 2, duration: 0.08, ease: 'power1.inOut' })
      .to(driver, { x: -4, rotation: -1.6, duration: 0.08, ease: 'power1.inOut' })
      .to(driver, { x: 4, rotation: 1.5, duration: 0.08, ease: 'power1.inOut' })
      .to(driver, { x: -2, rotation: -0.8, duration: 0.08, ease: 'power1.inOut' })
      .to(driver, { x: 0, rotation: 0, scale: 1.035, duration: 0.12, ease: 'back.out(2)' })
      .to(driver, { scale: 1, duration: 0.1, ease: 'power2.out' });

    return () => {
      timeline.kill();
      shakeX.setValue(0);
      rotation.setValue(0);
      scale.setValue(1);
    };
  }, [card.revealed, rotation, scale, selecting, shakeX]);

  useEffect(() => {
    let tween;
    if (card.type && !hadIdentity.current) {
      const driver = { value: 0 };
      reveal.setValue(0);
      tween = gsap.to(driver, {
        value: 1,
        duration: 0.58,
        ease: 'power3.out',
        onUpdate: () => reveal.setValue(driver.value),
      });
    } else if (!card.type) {
      reveal.setValue(0);
    } else {
      reveal.setValue(1);
    }
    hadIdentity.current = Boolean(card.type);
    return () => tween?.kill();
  }, [card.type, reveal]);

  // An actual 3D turn with a slight spring landing when a word is revealed.
  // Only animate NEW reveals; joining/reconnecting players see settled cards.
  useEffect(() => {
    if (card.revealed && !wasRevealed.current) {
      flip.setValue(0);
      Animated.sequence([
        Animated.timing(flip, { toValue: 1, duration: 440, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1.08, friction: 4, tension: 110, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
      ]).start();
    }
    wasRevealed.current = card.revealed;
  }, [card.revealed, flip, scale]);

  const fontSize = useMemo(() => {
    const responsiveSize = Math.min(23, Math.max(10, width * 0.15));
    return responsiveSize * (card.word.length >= 8 ? 0.82 : card.word.length >= 6 ? 0.9 : 1);
  }, [card.word, width]);

  const rotate = rotation.interpolate({ inputRange: [-3, 3], outputRange: ['-3deg', '3deg'] });
  const flipY = flip.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '92deg', '360deg'] });
  const identityScale = reveal.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.78, 1.045, 1] });
  return (
    <Animated.View style={{ width, transform: [{ translateX: shakeX }, { rotate }, { rotateY: flipY }, { scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${card.word}${card.revealed ? '، مكشوفة' : ''}`}
        accessibilityState={{ disabled: disabled || card.revealed, selected: card.revealed }}
        disabled={disabled || card.revealed}
        onPress={() => onPress(card.id)}
        style={({ pressed }) => [
          styles.card,
          { width, height: Math.max(46, width * 0.78) },
          (disabled || card.revealed) && !card.revealed && !card.type && styles.disabled,
          card.revealed && styles.revealedCard,
          pressed && styles.pressed,
        ]}
      >
        <ArabicText
          weight="bold"
          numberOfLines={2}
          adjustsFontSizeToFit
          style={[styles.word, { fontSize, lineHeight: fontSize * 1.35 }]}
        >
          {card.word}
        </ArabicText>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.identity,
            { backgroundColor: identityColor, opacity: reveal, transform: [{ scale: identityScale }] },
          ]}
        >
          {card.type === 'ASSASSIN' ? <ArabicText style={styles.assassin}>✦</ArabicText> : null}
          <ArabicText
            weight="bold"
            numberOfLines={2}
            adjustsFontSizeToFit
            style={[styles.identityWord, { color: identityTextColor, fontSize, lineHeight: fontSize * 1.35 }]}
          >
            {card.word}
          </ArabicText>
        </Animated.View>

        {card.revealed ? (
          <>
            <View pointerEvents="none" style={styles.revealedShade} />
            <View pointerEvents="none" style={styles.revealedLabel}>
              <Ionicons name="checkmark-circle" size={12} color={colors.white} />
              <ArabicText weight="bold" numberOfLines={1} adjustsFontSizeToFit style={styles.revealedText}>
                تم الاختيار
              </ArabicText>
            </View>
          </>
        ) : null}
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: radius.sm,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: colors.plum,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    shadowColor: colors.plum,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 0,
  },
  identity: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  word: { color: colors.ink, textAlign: 'center', writingDirection: 'rtl', lineHeight: 18 },
  identityWord: { textAlign: 'center', writingDirection: 'rtl', lineHeight: 18, textShadowColor: 'rgba(0,0,0,0.2)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } },
  assassin: { position: 'absolute', top: 1, left: 5, color: colors.gold, fontSize: 12 },
  revealedCard: { borderWidth: 3, borderBottomWidth: 5, borderColor: colors.mustard },
  revealedShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(53,19,38,0.16)' },
  revealedLabel: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    minHeight: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 2,
    backgroundColor: colors.plum,
  },
  revealedText: { flexShrink: 1, color: colors.white, fontSize: 8, lineHeight: 11, textAlign: 'center' },
  disabled: { opacity: 0.9 },
  pressed: { opacity: 0.92 },
});