/** Estado de error de red reutilizable (Cuartel, Metas) — con botón de reintentar. */
import { Pressable, Text, View } from 'react-native';
import { DARK, FONTS, RADIUS, accentGlow } from '../constants/theme';
import { t } from '../i18n';

export function NetworkError({ onRetry, accent = '#C6FF4A' }: { onRetry: () => void; accent?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
      <Text style={{ fontSize: 48, marginBottom: 8 }}>📡</Text>
      <Text style={{ fontFamily: FONTS.display, fontSize: 24, color: DARK.text, letterSpacing: 0.8, textAlign: 'center' }}>
        {t('errors.networkTitle')}
      </Text>
      <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: DARK.textDim, textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 20 }}>
        {t('errors.networkBody')}
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={t('errors.retry')}
        style={[
          { backgroundColor: accent, paddingVertical: 12, paddingHorizontal: 22, borderRadius: RADIUS.md },
          accentGlow(accent, 1),
        ]}
      >
        <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 15, color: '#0B0E13' }}>{t('errors.retry')}</Text>
      </Pressable>
    </View>
  );
}
