import { I18nManager } from 'react-native';

export const isRTL = I18nManager.isRTL;

/**
 * The app keeps native RTL OFF (see App.tsx) and lays Arabic out manually, so
 * these helpers resolve to the physical RIGHT-to-LEFT values. They still adapt
 * if native RTL happens to be active (e.g. the launch right after a reset).
 */
export const rtlRow: 'row' | 'row-reverse' = isRTL ? 'row' : 'row-reverse';

/**
 * Align to the RIGHT in flex layouts
 */
export const rtlAlignRight: 'flex-start' | 'flex-end' = isRTL ? 'flex-start' : 'flex-end';

/**
 * Align to the LEFT in flex layouts
 */
export const rtlAlignLeft: 'flex-start' | 'flex-end' = isRTL ? 'flex-end' : 'flex-start';
