import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Rect, G, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Colors } from '../../theme/colors';
import { WirdLogo } from '../Emblem/WirdLogo';

interface Props {
  onFinish: () => void;
}

const { width, height } = Dimensions.get('window');

export const SplashScreen: React.FC<Props> = ({ onFinish }) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(25)).current;
  const verseOpacity = useRef(new Animated.Value(0)).current;
  const verseTranslateY = useRef(new Animated.Value(20)).current;
  const starRotate = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  // Floating particles
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Continuous rotation for Islamic geometry star ring
    Animated.loop(
      Animated.timing(starRotate, {
        toValue: 1,
        duration: 25000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 2. Continuous breathing glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.85,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.35,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Floating gold particles
    const floatParticle = (val: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    floatParticle(particle1, 4000);
    floatParticle(particle2, 5500);
    floatParticle(particle3, 4800);

    // 4. Staggered Entrance Choreography
    Animated.sequence([
      // Logo & Emblem appears with spring
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Title and subtitle fade in and move up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // Quranic Verse fades in
      Animated.parallel([
        Animated.timing(verseOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(verseTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        // Progress bar animates to 100%
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    ]).start(() => {
      // Auto transition after finishing intro
      setTimeout(() => {
        handleEnter();
      }, 1200);
    });
  }, []);

  const handleEnter = () => {
    Animated.timing(containerOpacity, {
      toValue: 0,
      duration: 600,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  };

  const spin = starRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const p1Y = particle1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -35],
  });
  const p2Y = particle2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -45],
  });
  const p3Y = particle3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <StatusBar style="light" />

      {/* Royal Emerald & Gold Gradient Background */}
      <LinearGradient
        colors={['#031710', '#06281e', '#0b392a', '#041710']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Rotating Background Islamic Geometry Arabesque Pattern */}
      <Animated.View
        style={[
          styles.geometricRingWrapper,
          {
            transform: [{ rotate: spin }],
          },
        ]}
      >
        <Svg width={width * 1.3} height={width * 1.3} viewBox="0 0 400 400">
          <Defs>
            <SvgGradient id="ringGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#fae7a5" stopOpacity="0.25" />
              <Stop offset="50%" stopColor="#e2ba59" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#ba8e30" stopOpacity="0.2" />
            </SvgGradient>
          </Defs>
          {/* Multi-layered 8-pointed star rosette */}
          <G transform="translate(200, 200)">
            <Circle r="185" fill="none" stroke="url(#ringGold)" strokeWidth="1" strokeDasharray="8 6" />
            <Circle r="170" fill="none" stroke="url(#ringGold)" strokeWidth="0.75" />
            <Circle r="145" fill="none" stroke="url(#ringGold)" strokeWidth="1" strokeDasharray="3 4" />
            <Rect x="-120" y="-120" width="240" height="240" fill="none" stroke="url(#ringGold)" strokeWidth="1" />
            <Rect
              x="-120"
              y="-120"
              width="240"
              height="240"
              fill="none"
              stroke="url(#ringGold)"
              strokeWidth="1"
              transform="rotate(45)"
            />
            <Rect
              x="-120"
              y="-120"
              width="240"
              height="240"
              fill="none"
              stroke="url(#ringGold)"
              strokeWidth="0.5"
              transform="rotate(22.5)"
            />
            <Rect
              x="-120"
              y="-120"
              width="240"
              height="240"
              fill="none"
              stroke="url(#ringGold)"
              strokeWidth="0.5"
              transform="rotate(67.5)"
            />
          </G>
        </Svg>
      </Animated.View>

      {/* Floating Gold Dust Particles */}
      <Animated.View
        style={[
          styles.particle,
          {
            top: height * 0.22,
            left: width * 0.18,
            transform: [{ translateY: p1Y }],
            opacity: glowPulse,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.particle,
          {
            top: height * 0.35,
            right: width * 0.15,
            width: 8,
            height: 8,
            transform: [{ translateY: p2Y }],
            opacity: glowPulse,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.particle,
          {
            bottom: height * 0.28,
            left: width * 0.22,
            width: 5,
            height: 5,
            transform: [{ translateY: p3Y }],
            opacity: glowPulse,
          },
        ]}
      />

      {/* Central Content */}
      <View style={styles.centerContent}>
        {/* Pulsing Aura Behind Emblem */}
        <Animated.View
          style={[
            styles.auraGlow,
            {
              opacity: glowPulse,
              transform: [{ scale: glowPulse.interpolate({ inputRange: [0.35, 0.85], outputRange: [0.95, 1.25] }) }],
            },
          ]}
        />

        {/* Brand Emblem */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <WirdLogo size={120} />
        </Animated.View>

        {/* Brand Typography */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Text style={styles.goldStar}>✦</Text>
            <Text style={styles.brandTitle}>وِرد</Text>
            <Text style={styles.goldStar}>✦</Text>
          </View>
          <Text style={styles.brandSubtitle}>
            رفيقك اليومي لحفظ القرآن الكريم ومراجعته
          </Text>
        </Animated.View>

        {/* Featured Quranic Verse Card */}
        <Animated.View
          style={[
            styles.verseCard,
            {
              opacity: verseOpacity,
              transform: [{ translateY: verseTranslateY }],
            },
          ]}
        >
          <View style={styles.verseBorderAccent}>
            <Text style={styles.verseText}>« وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا »</Text>
            <Text style={styles.verseRef}>سورة المزمل · الآية ٤</Text>
          </View>
        </Animated.View>
      </View>

      {/* Footer / Progress Bar & Direct Tap Option */}
      <View style={styles.footer}>
        <View style={styles.progressBarBackground}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
            <LinearGradient
              colors={['#fae7a5', '#e2ba59', '#ba8e30']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleEnter}
          style={styles.enterButton}
        >
          <Text style={styles.enterButtonText}>دخول التطبيق</Text>
          <Text style={styles.enterButtonIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.footerCopyright}>
          منصة وِرد · التكرار المتباعد والحفظ التفاعلي
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  geometricRingWrapper: {
    position: 'absolute',
    top: height * 0.12,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fae7a5',
    shadowColor: '#f5d47a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.12,
  },
  auraGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(226, 186, 89, 0.18)',
    shadowColor: '#fae7a5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
  },
  logoContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  brandTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fae7a5',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(250, 231, 165, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  goldStar: {
    fontSize: 20,
    color: '#e2ba59',
  },
  brandSubtitle: {
    fontSize: 15,
    color: '#cbd5e1',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  verseCard: {
    marginTop: 15,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 73, 56, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.35)',
    maxWidth: width * 0.88,
  },
  verseBorderAccent: {
    alignItems: 'center',
  },
  verseText: {
    fontSize: 21,
    color: '#f8fafc',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 32,
  },
  verseRef: {
    fontSize: 12,
    color: '#fae7a5',
    marginTop: 4,
    opacity: 0.85,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  progressBarBackground: {
    width: '75%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 26,
    paddingVertical: 11,
    borderRadius: 24,
    backgroundColor: 'rgba(226, 186, 89, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(250, 231, 165, 0.5)',
    marginBottom: 16,
  },
  enterButtonText: {
    color: '#fae7a5',
    fontSize: 15,
    fontWeight: '700',
  },
  enterButtonIcon: {
    color: '#fae7a5',
    fontSize: 16,
  },
  footerCopyright: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
});
