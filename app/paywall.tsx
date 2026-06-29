/**
 * Pantalla de paywall — aparece cuando el trial de 7 días termina (rediseño dark).
 *
 * RevenueCat TODO (Jhonatan):
 * 1. `npm install react-native-purchases`
 * 2. Configurar el producto "El Sargento Premium" $149 MXN/mes en App Store
 *    Connect y Google Play Console, vinculados a RevenueCat.
 * 3. Reemplazar el bloque `handleSubscribe` con la compra real de RC.
 * 4. En el webhook de RC (service role), actualizar sg_profiles.is_premium = true.
 *    El cliente NO debe poder escribir is_premium (ver src/lib/db.ts y CLAUDE.md).
 */
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useSession } from '../src/store/session';
import { getCharacter } from '../src/constants/characters';
import { devGrantPremium } from '../src/lib/db';
import { ComicButton } from '../src/components/ComicButton';
import { SergeantHeader } from '../src/components/SergeantHeader';
import { Card } from '../src/components/Card';
import { useDialog } from '../src/components/Dialog';
import { t } from '../src/i18n';
import { DARK, FONTS, RADIUS, accentGlow, tint } from '../src/constants/theme';

const PRICE_MXN = '$149 MXN / mes';

const FEATURES = [
  { emoji: '🔊', key: 'voice' },
  { emoji: '💬', key: 'unlimited' },
  { emoji: '🎤', key: 'voiceChat' },
  { emoji: '👥', key: 'allFour' },
  { emoji: '🔥', key: 'streak' },
  { emoji: '🔔', key: 'notifications' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useSession();
  const { show } = useDialog();
  const character = getCharacter(profile?.chosen_sergeant);
  const accent = character.theme.accent;
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);

    // TODO: reemplazar con RevenueCat (Purchases.purchasePackage).
    show({
      icon: '🚧',
      title: t('paywall.devTitle'),
      message: t('paywall.devMsg'),
      accent,
      buttons: [
        {
          text: t('paywall.devSimulate'),
          onPress: async () => {
            try {
              await devGrantPremium(user.id);
              await refreshProfile();
              router.replace('/(app)');
            } catch {
              // El trigger sg_protect_premium bloquea is_premium desde el cliente
              // (correcto). Para probar premium en dev, actívalo desde el dashboard.
              show({
                icon: '🛡️',
                title: t('paywall.protectedTitle'),
                message: t('paywall.protectedMsg'),
                accent,
              });
            }
            setLoading(false);
          },
        },
        { text: t('common.cancel'), style: 'cancel', onPress: () => setLoading(false) },
      ],
    });
  };

  const handleSignOut = async () => {
    const { supabase } = await import('../src/lib/supabase');
    await supabase.auth.signOut();
    router.replace('/onboarding');
  };

  const line = t(`paywall.lines.${character.id}`);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK.bg }} edges={['top']}>
      <SergeantHeader character={character} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Quote del sargento */}
        <Card accentColor={accent} tintOpacity={0.1} elevation={2} style={{ padding: 18, marginBottom: 22, borderColor: tint(accent, 0.4) }}>
          <Text style={{ fontFamily: FONTS.display, fontSize: 30, color: accent, letterSpacing: 1.5, marginBottom: 8 }}>
            {t('paywall.trialEnded')}
          </Text>
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 15, color: DARK.text, lineHeight: 22, fontStyle: 'italic' }}>
            {line}
          </Text>
        </Card>

        {/* Features */}
        <Text style={{ fontFamily: FONTS.display, fontSize: 24, color: DARK.text, letterSpacing: 1, marginBottom: 12 }}>
          {t('paywall.withPremium')}
        </Text>
        {FEATURES.map((f) => (
          <Card key={f.key} elevation={1} style={{ flexDirection: 'row', alignItems: 'center', overflow: 'hidden', marginBottom: 10 }}>
            <View style={{ width: 4, alignSelf: 'stretch', backgroundColor: accent }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, flex: 1 }}>
              <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 15, color: DARK.text, flex: 1 }}>{t(`paywall.features.${f.key}`)}</Text>
            </View>
          </Card>
        ))}

        {/* Precio */}
        <View
          style={[
            {
              backgroundColor: accent,
              borderRadius: RADIUS.xl,
              padding: 20,
              alignItems: 'center',
              marginVertical: 22,
            },
            accentGlow(accent, 2),
          ]}
        >
          <Text style={{ fontFamily: FONTS.display, fontSize: 42, color: '#0B0E13', letterSpacing: 1.5 }}>{PRICE_MXN}</Text>
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: tint('#000000', 0.6), marginTop: 2 }}>
            {t('paywall.priceSub')}
          </Text>
        </View>

        <ComicButton
          label={loading ? t('paywall.processing') : t('paywall.activateCta')}
          color={accent}
          textColor="#0B0E13"
          fullWidth
          size="lg"
          disabled={loading}
          onPress={handleSubscribe}
        />

        <Text style={{ fontFamily: FONTS.body, fontSize: 11, color: DARK.textMuted, textAlign: 'center', marginTop: 12, lineHeight: 16 }}>
          {Platform.OS === 'ios' ? t('paywall.manageIos') : t('paywall.manageAndroid')}
        </Text>

        <Pressable onPress={handleSignOut} style={{ alignItems: 'center', paddingVertical: 16 }}>
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: DARK.textMuted }}>{t('paywall.signOut')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
