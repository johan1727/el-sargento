/**
 * Pantalla de paywall — aparece cuando el trial de 7 días termina.
 *
 * RevenueCat TODO (Jhonatan):
 * 1. `npm install react-native-purchases`
 * 2. Configurar el producto "El Sargento Premium" $149 MXN/mes en App Store
 *    Connect y Google Play Console, vinculados a RevenueCat.
 * 3. Reemplazar el bloque `handleSubscribe` con la compra real de RC.
 * 4. En el webhook de RC, actualizar profiles.is_premium = true vía service role.
 *
 * Por ahora muestra el flujo completo con un placeholder de compra.
 */
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useSession } from '../src/store/session';
import { getCharacter } from '../src/constants/characters';
import { updateProfile } from '../src/lib/db';
import { ComicButton } from '../src/components/ComicButton';
import { SergeantHeader } from '../src/components/SergeantHeader';
import { ActionBurst } from '../src/components/ActionBurst';
import { COMIC, comicBorder, comicShadow } from '../src/constants/theme';

const PRICE_MXN = '$149 MXN / mes';

const FEATURES = [
  { emoji: '🔊', label: 'Voz real de los sargentos (Gemini TTS)' },
  { emoji: '💬', label: 'Mensajes ilimitados' },
  { emoji: '🎤', label: 'Conversación por voz' },
  { emoji: '👥', label: 'Los 4 sargentos desbloqueados' },
  { emoji: '🔥', label: 'Seguimiento de racha y rangos' },
  { emoji: '🔔', label: 'Notificaciones de check-in diario' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useSession();
  const character = getCharacter(profile?.chosen_sergeant);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);

    // TODO: reemplazar con RevenueCat
    // const { customerInfo } = await Purchases.purchasePackage(pkg);
    // if (typeof customerInfo.entitlements.active['premium'] !== 'undefined') { ... }

    Alert.alert(
      '🚧 RevenueCat pendiente',
      'Integra react-native-purchases y configura el producto en App Store / Google Play. Ver comentarios en app/paywall.tsx.',
      [
        {
          text: '✅ Simular compra (dev)',
          onPress: async () => {
            await updateProfile(user.id, { is_premium: true });
            await refreshProfile();
            router.replace('/(app)');
            setLoading(false);
          },
        },
        { text: 'Cancelar', onPress: () => setLoading(false) },
      ],
    );
  };

  const handleSignOut = async () => {
    const { supabase } = await import('../src/lib/supabase');
    await supabase.auth.signOut();
    router.replace('/onboarding');
  };

  // Mensaje del sargento en el paywall (en personaje).
  const paywallLine: Record<string, string> = {
    gomez: '¿Te vas a rendir por $149 pesos, recluta? Tu palabra vale más que eso. Activa y cumple.',
    rex: '¡NOOOO! ¡¿SOLDIER?! ¡Ciento cuarenta y nueve pesos y te rajaste?! *WOOF!* ¡VUELVE AL CAMPO!',
    valentina: '¿En serio te vas a ir? Qué… predecible. $149 pesos. Cuánta voluntad.',
    fabianski: 'Mija, me ROMPES el corazón. ¿$149 pesitos y ya? *suspiro dramático* Vuelve. Te necesito.',
  };
  const line = paywallLine[character.id] ?? paywallLine.gomez;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COMIC.paperWarm }} edges={['top']}>
      {/* Header full-bleed del sargento */}
      <SergeantHeader character={character} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Quote del sargento */}
        <View
          style={[
            comicBorder,
            comicShadow(5, character.theme.primary),
            {
              backgroundColor: character.theme.dark,
              borderRadius: 18,
              padding: 18,
              marginBottom: 22,
            },
          ]}
        >
          <Text style={{ fontFamily: 'Bangers', fontSize: 30, color: COMIC.yellow, letterSpacing: 2, marginBottom: 8 }}>
            TU TRIAL TERMINÓ
          </Text>
          <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#FFF', lineHeight: 22, fontStyle: 'italic' }}>
            {line}
          </Text>
        </View>

        {/* Features — franja izquierda Brutalist */}
        <Text style={{ fontFamily: 'Bangers', fontSize: 26, color: COMIC.ink, letterSpacing: 1, marginBottom: 12 }}>
          CON PREMIUM TIENES:
        </Text>
        {FEATURES.map((f) => (
          <View
            key={f.label}
            style={[
              comicBorder,
              comicShadow(3),
              {
                flexDirection: 'row',
                borderRadius: 12,
                overflow: 'hidden',
                backgroundColor: '#FFFFFF',
                marginBottom: 10,
              },
            ]}
          >
            <View style={{ width: 6, backgroundColor: character.theme.accent }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, flex: 1 }}>
              <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
              <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 15, color: COMIC.ink, flex: 1 }}>{f.label}</Text>
            </View>
          </View>
        ))}

        {/* Precio */}
        <View style={[comicBorder, comicShadow(6), {
          backgroundColor: '#E01E37',
          borderRadius: 20,
          padding: 20,
          alignItems: 'center',
          marginVertical: 20,
          transform: [{ rotate: '-1deg' }],
        }]}>
          <Text style={{ fontFamily: 'Bangers', fontSize: 44, color: '#FFF', letterSpacing: 2 }}>
            {PRICE_MXN}
          </Text>
          <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#FFD23F', marginTop: 4 }}>
            Cancela cuando quieras · Sin compromisos
          </Text>
        </View>

        {/* Burst antes del botón CTA */}
        <View style={{ alignItems: 'center', marginBottom: 4, overflow: 'visible' }}>
          <ActionBurst
            text="¡AHORA!"
            color={character.theme.accent}
            size="sm"
            rotate={-8}
            position="relative"
          />
        </View>

        <ComicButton
          label={loading ? 'PROCESANDO...' : `¡ACTIVAR PREMIUM ${PRICE_MXN}!`}
          color={character.theme.primary}
          fullWidth
          size="lg"
          disabled={loading}
          onPress={handleSubscribe}
        />

        <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 11, color: '#AAA', textAlign: 'center', marginTop: 12, lineHeight: 16 }}>
          {Platform.OS === 'ios'
            ? 'La suscripción se renueva automáticamente. Gestiona en Configuración → Tu nombre → Suscripciones.'
            : 'La suscripción se renueva automáticamente. Gestiona en Google Play → Suscripciones.'}
        </Text>

        <Pressable onPress={handleSignOut} style={{ alignItems: 'center', paddingVertical: 16 }}>
          <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#888' }}>
            Cerrar sesión
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
