// src/components/ui/TutorialOverlay.tsx
// Overlay de onboarding exibido na primeira visita a cada tela.
// Usa um Modal fullscreen com paginação de steps.

import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { TUTORIALS, TutorialStep } from '@/constants/tutorials';
import type { TutorialScreenKey } from '@/hooks/useTutorial';

interface Props {
  visible: boolean;
  screenKey: TutorialScreenKey;
  onDismiss: () => void;
}

export function TutorialOverlay({ visible, screenKey, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const steps: TutorialStep[] = TUTORIALS[screenKey] ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const isLast = currentIndex === steps.length - 1;

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, index));
    setCurrentIndex(clamped);
    scrollRef.current?.scrollTo({ x: clamped * slideWidth, animated: true });
  };

  const handleNext = () => {
    if (isLast) {
      onDismiss();
      setCurrentIndex(0);
    } else {
      goTo(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    onDismiss();
    setCurrentIndex(0);
  };

  if (steps.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      {/* Backdrop semi-transparente */}
      <View style={styles.backdrop}>
        {/* Card central */}
        <View
          style={[
            styles.card,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
        >
          {/* Botão pular */}
          <TouchableOpacity
            onPress={handleSkip}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            style={styles.skipBtn}
            accessibilityRole="button"
            accessibilityLabel="Pular tutorial"
          >
            <Text style={styles.skipText}>pular</Text>
          </TouchableOpacity>

          {/* Slides — mede a largura real do card via onLayout */}
          <View
            style={styles.slidesContainer}
            onLayout={(e) => setSlideWidth(e.nativeEvent.layout.width)}
          >
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              style={{ width: slideWidth || '100%' }}
              contentContainerStyle={{ flexGrow: 0 }}
            >
              {steps.map((step, idx) => (
                <View
                  key={idx}
                  style={[styles.slide, { width: slideWidth || 300 }]}
                >
                  <Text style={styles.icon}>{step.icon}</Text>
                  <Text style={styles.title}>{step.title}</Text>
                  <Text style={styles.body}>{step.body}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Dots de paginação */}
          <View style={styles.dots}>
            {steps.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => goTo(idx)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`Ir para passo ${idx + 1}`}
              >
                <View
                  style={[
                    styles.dot,
                    idx === currentIndex && styles.dotActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Botão próximo / entendi */}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Entendi' : 'Próximo'}
            style={styles.nextBtn}
          >
            <Text style={styles.nextText}>
              {isLast ? 'entendi ✓' : 'próximo →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13, 27, 42, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingTop: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    alignSelf: 'stretch',
    // Shadow iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    // Elevation Android
    elevation: 12,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.md,
  },
  skipText: {
    color: Colors.muted,
    fontSize: FontSize.sm,
  },
  slidesContainer: {
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  slide: {
    alignItems: 'center',
    paddingBottom: Spacing.lg,
  },
  icon: {
    fontSize: 52,
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: 'Georgia',
    color: Colors.text,
    fontSize: FontSize.xxl,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  body: {
    color: Colors.muted,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.secondary,
    width: 20,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['3xl'],
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  nextText: {
    color: Colors.onLight,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
});
