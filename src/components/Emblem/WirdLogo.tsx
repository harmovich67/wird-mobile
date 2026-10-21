import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Path,
  G,
} from 'react-native-svg';

interface Props {
  size?: number;
}

export const WirdLogo: React.FC<Props> = ({ size = 96 }) => {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg viewBox="0 0 128 128" width={size} height={size}>
        <Defs>
          {/* Deep Royal Emerald Gradient */}
          <LinearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#144e3b" />
            <Stop offset="50%" stopColor="#0d3527" />
            <Stop offset="100%" stopColor="#061c14" />
          </LinearGradient>

          {/* Metallic Gold Gradient */}
          <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="80%">
            <Stop offset="0%" stopColor="#fae7a5" />
            <Stop offset="35%" stopColor="#e2ba59" />
            <Stop offset="70%" stopColor="#ba8e30" />
            <Stop offset="100%" stopColor="#f5d47a" />
          </LinearGradient>

          {/* Radial Aura Glow */}
          <RadialGradient id="auraGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#d4af37" stopOpacity="0.4" />
            <Stop offset="60%" stopColor="#19654d" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#0d3527" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Squircle base with gold border */}
        <Rect x="4" y="4" width="120" height="120" rx="28" fill="url(#bgGrad)" />
        <Rect
          x="4"
          y="4"
          width="120"
          height="120"
          rx="28"
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth="2"
          strokeOpacity="0.65"
        />
        <Rect
          x="7"
          y="7"
          width="114"
          height="114"
          rx="25"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1"
          strokeOpacity="0.15"
        />

        {/* Aura glow behind Mushaf */}
        <Circle cx="64" cy="64" r="44" fill="url(#auraGlow)" />

        {/* Islamic dashed ring */}
        <Circle
          cx="64"
          cy="64"
          r="48"
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth="0.8"
          strokeDasharray="4 3"
          strokeOpacity="0.4"
        />

        {/* 8-Pointed Rub el Hizb Star at apex */}
        <G transform="translate(64, 25) scale(0.95)">
          <Rect x="-8" y="-8" width="16" height="16" rx="2" fill="url(#goldGrad)" />
          <Rect
            x="-8"
            y="-8"
            width="16"
            height="16"
            rx="2"
            fill="url(#goldGrad)"
            transform="rotate(45)"
          />
          <Circle cx="0" cy="0" r="3.2" fill="#0d3527" />
          <Circle cx="0" cy="0" r="1.5" fill="#fae7a5" />
        </G>

        {/* Soundwaves / Tarteel Recitation Frequencies */}
        <G fill="url(#goldGrad)" opacity="0.95">
          <Rect x="62.5" y="40" width="3" height="18" rx="1.5" />
          <Rect x="56" y="44" width="2.8" height="14" rx="1.4" />
          <Rect x="69.2" y="44" width="2.8" height="14" rx="1.4" />
          <Rect x="50" y="49" width="2.5" height="9" rx="1.25" />
          <Rect x="75.5" y="49" width="2.5" height="9" rx="1.25" />
          <Rect x="44" y="53" width="2.2" height="5" rx="1.1" />
          <Rect x="81.8" y="53" width="2.2" height="5" rx="1.1" />
        </G>

        {/* The Open Mushaf / Sacred Book */}
        <Path d="M64 64 L64 96" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Left Page */}
        <Path
          d="M64 66 C53 61, 35 60, 24 67 C23 74, 23 85, 24 93 C35 86, 52 87, 64 94 Z"
          fill="url(#goldGrad)"
          fillOpacity="0.95"
        />
        <Path
          d="M60 71 C51 67, 38 67, 29 72"
          fill="none"
          stroke="#0d3527"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.6"
        />
        <Path
          d="M60 77 C51 73, 38 73, 29 78"
          fill="none"
          stroke="#0d3527"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.6"
        />
        <Path
          d="M60 83 C51 79, 38 79, 29 84"
          fill="none"
          stroke="#0d3527"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Right Page */}
        <Path
          d="M64 66 C75 61, 93 60, 104 67 C105 74, 105 85, 104 93 C93 86, 76 87, 64 94 Z"
          fill="url(#goldGrad)"
          fillOpacity="0.95"
        />
        <Path
          d="M68 71 C77 67, 90 67, 99 72"
          fill="none"
          stroke="#0d3527"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.6"
        />
        <Path
          d="M68 77 C77 73, 90 73, 99 78"
          fill="none"
          stroke="#0d3527"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.6"
        />
        <Path
          d="M68 83 C77 79, 90 79, 99 84"
          fill="none"
          stroke="#0d3527"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Mushaf Stand / Rihl Base */}
        <Path
          d="M42 98 C52 103, 76 103, 86 98"
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Path
          d="M50 102 L44 108 M78 102 L84 108"
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};
