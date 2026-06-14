/**
 * Onboarding paso 4: Crear cuenta (email) → inicia trial 7 días.
 * También guarda el sargento, metas y hora elegidos.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { pendingSergeantId } from './index';
import { pendingGoals } from './goals';
import { pendingCheckinHour } from './schedule';
import { getCharacter } from '../../src/constants/characters';
import { useSession } from '../../src/store/session';
import { addGoals, updateProfile } from '../../src/lib/db';
import { ComicButton } from '../../src/components/ComicButton';
import { SergeantAvatar } from '../../src/components/SergeantAvatar';
import { COMIC, comicBorder } from '../../src/constants/theme';

export default function OnboardingSignupScreen() {
  const router = useRouter();
  const { signUp, signIn, user, profile, patchProfile } = useSession();
  const character = getCharacter(pendingSergeantId);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signup' | 'login'>('signup');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('¡Recluta!', 'Correo y contraseña son obligatorios. No hay excusas.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      Alert.alert('¡Recluta!', 'La contraseña necesita al menos 6 caracteres. Por seguridad.');
      return;
    }
    setLoading(true);
    try {
      let result: { error?: string };
      if (mode === 'signup') {
        result = await signUp(email.trim(), password);
      } else {
        result = await signIn(email.trim(), password);
      }

      if (result.error) {
        Alert.alert('Error', result.error);
        setLoading(false);
        return;
      }

      // En signup: esperar a que el trigger cree el profile antes de actualizarlo.
      // En login: ir directo.
      if (mode === 'signup') {
        await finishOnboarding();
      } else {
        // Login: si el profile ya tiene onboarding_done, el guard nos llevará al app.
        // Si no, completamos aquí.
        await finishOnboarding();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Error desconocido');
      setLoading(false);
    }
  };

  const finishOnboarding = async () => {
    // Pequeña espera para que el trigger de Supabase cree el profile.
    await new Promise((r) => setTimeout(r, 1000));

    // Necesitamos el userId del nuevo usuario.
    const { supabase } = await import('../../src/lib/supabase');
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) { setLoading(false); return; }

    await updateProfile(currentUser.id, {
      display_name: name.trim() || null,
      chosen_sergeant: pendingSergeantId,
      checkin_hour: pendingCheckinHour,
      onboarding_done: true,
    });

    if (pendingGoals.length) {
      await addGoals(currentUser.id, pendingGoals);
    }

    // Programar notificación diaria de check-in.
    const { scheduleCheckinNotification } = await import('../../src/lib/notifications');
    scheduleCheckinNotification(pendingCheckinHour, pendingSergeantId).catch(() => {});

    patchProfile({ onboarding_done: true, chosen_sergeant: pendingSergeantId });
    setLoading(false);
    // El NavigationGuard redirige a /(app) automáticamente al detectar onboarding_done.
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COMIC.paper }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <SergeantAvatar sergeantId={pendingSergeantId} size={60} />
            <View style={[comicBorder, { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12 }]}>
              <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 15, color: COMIC.ink, lineHeight: 20 }}>
                "Último paso, recluta. Crea tu cuenta y el entrenamiento comienza. 7 días de prueba gratis."
              </Text>
            </View>
          </View>

          <Text style={{ fontFamily: 'Bangers', fontSize: 28, color: COMIC.ink, letterSpacing: 1, marginBottom: 20 }}>
            {mode === 'signup' ? 'CREA TU CUENTA' : 'INICIA SESIÓN'}
          </Text>

          {mode === 'signup' && (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 14, color: COMIC.ink, marginBottom: 6 }}>
                Tu nombre (opcional)
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Recluta"
                placeholderTextColor="#AAA"
                autoCapitalize="words"
                style={[comicBorder, {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  paddingVertical: 13,
                  paddingHorizontal: 14,
                  fontFamily: 'Nunito_700Bold',
                  fontSize: 16,
                  color: COMIC.ink,
                }]}
              />
            </View>
          )}

          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 14, color: COMIC.ink, marginBottom: 6 }}>
              Correo electrónico
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="tú@correo.com"
              placeholderTextColor="#AAA"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[comicBorder, {
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                paddingVertical: 13,
                paddingHorizontal: 14,
                fontFamily: 'Nunito_700Bold',
                fontSize: 16,
                color: COMIC.ink,
              }]}
            />
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 14, color: COMIC.ink, marginBottom: 6 }}>
              Contraseña
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#AAA"
              secureTextEntry
              style={[comicBorder, {
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                paddingVertical: 13,
                paddingHorizontal: 14,
                fontFamily: 'Nunito_700Bold',
                fontSize: 16,
                color: COMIC.ink,
              }]}
            />
          </View>

          {mode === 'signup' && (
            <View style={[comicBorder, { backgroundColor: '#FFE9A8', borderRadius: 12, padding: 12, marginBottom: 20 }]}>
              <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 14, color: COMIC.ink }}>
                🎁 7 días de prueba GRATIS — acceso completo a los 4 sargentos y voz.
              </Text>
            </View>
          )}

          <ComicButton
            label={loading ? 'PROCESANDO...' : (mode === 'signup' ? '¡ENLISTARME!' : '¡ENTRAR!')}
            color={character.theme.primary}
            fullWidth
            size="lg"
            disabled={loading}
            onPress={handleSubmit}
          />

          <Pressable onPress={() => setMode(mode === 'signup' ? 'login' : 'signup')} style={{ alignItems: 'center', paddingVertical: 16 }}>
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 14, color: character.theme.primary }}>
              {mode === 'signup' ? '¿Ya tienes cuenta? Inicia sesión' : '¿Sin cuenta? Regístrate gratis'}
            </Text>
          </Pressable>

          <Text style={{ fontFamily: 'Nunito_400Regular', fontSize: 11, color: '#AAA', textAlign: 'center', marginTop: 8 }}>
            Este es un coach motivacional de entretenimiento, no terapia ni consejo profesional.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
