/**
 * Onboarding paso 4: Crear cuenta (email) → inicia trial 7 días (rediseño dark).
 * También guarda el sargento, metas y hora elegidos.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { pendingSergeantId } from './index';
import { pendingGoals } from './goals';
import { pendingCheckinHour } from './schedule';
import { getCharacter } from '../../src/constants/characters';
import { useSession } from '../../src/store/session';
import { addGoals, updateProfile, getProfile } from '../../src/lib/db';
import { ComicButton } from '../../src/components/ComicButton';
import { SergeantAvatar } from '../../src/components/SergeantAvatar';
import { Card } from '../../src/components/Card';
import { useDialog } from '../../src/components/Dialog';
import { DARK, FONTS, RADIUS, tint } from '../../src/constants/theme';

export default function OnboardingSignupScreen() {
  const router = useRouter();
  const { signUp, signIn, signInWithGoogle, signInAsGuest, resetPassword, patchProfile } = useSession();
  const { show } = useDialog();
  const character = getCharacter(pendingSergeantId);
  const accent = character.theme.accent;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signup' | 'login'>('signup');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      show({ icon: character.emoji, title: '¡Recluta!', message: 'Correo y contraseña son obligatorios. No hay excusas.', accent });
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      show({ icon: character.emoji, title: '¡Recluta!', message: 'La contraseña necesita al menos 6 caracteres. Por seguridad.', accent });
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const r = await signUp(email.trim(), password);
        if (r.error) {
          show({ icon: '⚠️', title: 'Error', message: r.error, accent });
          setLoading(false);
          return;
        }
        if (r.needsConfirmation) {
          show({
            icon: '✉️',
            title: 'Confirma tu correo',
            message: 'Te enviamos un enlace de confirmación. Ábrelo y luego inicia sesión aquí para terminar tu alta.',
            accent,
          });
          setMode('login');
          setLoading(false);
          return;
        }
      } else {
        const r = await signIn(email.trim(), password);
        if (r.error) {
          show({ icon: '⚠️', title: 'Error', message: r.error, accent });
          setLoading(false);
          return;
        }
      }
      await finishOnboarding();
    } catch (err: any) {
      show({ icon: '⚠️', title: 'Error', message: err?.message ?? 'Error desconocido', accent });
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const r = await signInWithGoogle();
    if (r.cancelled) {
      setLoading(false);
      return;
    }
    if (r.error) {
      show({ icon: '⚠️', title: 'Google', message: r.error, accent });
      setLoading(false);
      return;
    }
    await finishOnboarding();
  };

  const handleGuest = async () => {
    setLoading(true);
    const r = await signInAsGuest();
    if (r.error) {
      show({
        icon: '🚧',
        title: 'Modo invitado no disponible',
        message: 'Activa "Anonymous sign-ins" en Supabase → Authentication para permitir probar sin cuenta.',
        accent,
      });
      setLoading(false);
      return;
    }
    await finishOnboarding();
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      show({ icon: '✉️', title: 'Correo requerido', message: 'Escribe tu correo arriba y vuelve a tocar "¿Olvidaste tu contraseña?".', accent });
      return;
    }
    const { error } = await resetPassword(email.trim());
    if (error) {
      show({ icon: '⚠️', title: 'Error', message: error, accent });
      return;
    }
    show({ icon: '✉️', title: 'Revisa tu correo', message: `Te enviamos un enlace para restablecer tu contraseña a ${email.trim()}.`, accent });
  };

  const finishOnboarding = async () => {
    // Pequeña espera para que el trigger de Supabase cree el profile.
    await new Promise((r) => setTimeout(r, 1000));

    const { supabase } = await import('../../src/lib/supabase');
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) { setLoading(false); return; }

    // Usuario que ya hizo onboarding (p.ej. login con Google de una cuenta vieja):
    // no sobreescribimos su sargento/metas, dejamos que el guard lo enrute.
    const existing = await getProfile(currentUser.id);
    if (existing?.onboarding_done) {
      patchProfile(existing);
      setLoading(false);
      return;
    }

    await updateProfile(currentUser.id, {
      display_name: name.trim() || null,
      chosen_sergeant: pendingSergeantId,
      checkin_hour: pendingCheckinHour,
      onboarding_done: true,
    });

    if (pendingGoals.length) {
      await addGoals(currentUser.id, pendingGoals);
    }

    const { scheduleCheckinNotification } = await import('../../src/lib/notifications');
    scheduleCheckinNotification(pendingCheckinHour, pendingSergeantId).catch(() => {});

    patchProfile({ onboarding_done: true, chosen_sergeant: pendingSergeantId });
    setLoading(false);
  };

  const inputStyle = {
    backgroundColor: DARK.surfaceAlt,
    borderWidth: 1,
    borderColor: DARK.hairline,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: DARK.text,
  } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <SergeantAvatar sergeantId={pendingSergeantId} size={58} />
            <Card alt elevation={1} style={{ flex: 1, padding: 12 }}>
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 15, color: DARK.text, lineHeight: 20 }}>
                "Último paso, recluta. Crea tu cuenta y el entrenamiento comienza. 7 días de prueba gratis."
              </Text>
            </Card>
          </View>

          <Text style={{ fontFamily: FONTS.display, fontSize: 28, color: DARK.text, letterSpacing: 1, marginBottom: 20 }}>
            {mode === 'signup' ? 'CREA TU CUENTA' : 'INICIA SESIÓN'}
          </Text>

          {mode === 'signup' ? (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: DARK.textDim, marginBottom: 6 }}>
                Tu nombre (opcional)
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Recluta"
                placeholderTextColor={DARK.textMuted}
                autoCapitalize="words"
                maxLength={40}
                style={inputStyle}
              />
            </View>
          ) : null}

          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: DARK.textDim, marginBottom: 6 }}>
              Correo electrónico
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="tú@correo.com"
              placeholderTextColor={DARK.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={inputStyle}
            />
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: DARK.textDim, marginBottom: 6 }}>
              Contraseña
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={DARK.textMuted}
              secureTextEntry
              style={inputStyle}
            />
          </View>

          {mode === 'signup' ? (
            <Card elevation={1} accentColor={accent} tintOpacity={0.12} style={{ padding: 12, marginBottom: 20, borderColor: tint(accent, 0.4) }}>
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: DARK.text }}>
                🎁 7 días de prueba GRATIS — acceso completo a los 4 sargentos y voz.
              </Text>
            </Card>
          ) : null}

          <ComicButton
            label={loading ? 'PROCESANDO...' : (mode === 'signup' ? '¡ENLISTARME!' : '¡ENTRAR!')}
            color={accent}
            textColor="#0B0E13"
            fullWidth
            size="lg"
            disabled={loading}
            onPress={handleSubmit}
          />

          {/* Separador */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: DARK.hairline }} />
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: DARK.textMuted }}>O</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: DARK.hairline }} />
          </View>

          {/* Google */}
          <Pressable
            onPress={handleGoogle}
            disabled={loading}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              minHeight: 52,
              borderRadius: RADIUS.md,
              backgroundColor: '#FFFFFF',
              opacity: loading ? 0.5 : 1,
            }}
          >
            <Text style={{ fontFamily: FONTS.bodyBlack, fontSize: 18, color: '#4285F4' }}>G</Text>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 15, color: '#1F1F1F' }}>Continuar con Google</Text>
          </Pressable>

          {/* Probar sin cuenta (modo invitado) */}
          <Pressable
            onPress={handleGuest}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Probar la app sin crear cuenta"
            style={{ alignItems: 'center', paddingVertical: 14, marginTop: 4, opacity: loading ? 0.5 : 1 }}
          >
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: DARK.textDim }}>
              👀 Probar sin cuenta
            </Text>
            <Text style={{ fontFamily: FONTS.body, fontSize: 11, color: DARK.textMuted, marginTop: 2 }}>
              Luego puedes crear tu cuenta y conservar tu progreso
            </Text>
          </Pressable>

          <Pressable onPress={() => setMode(mode === 'signup' ? 'login' : 'signup')} style={{ alignItems: 'center', paddingVertical: 16 }}>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: accent }}>
              {mode === 'signup' ? '¿Ya tienes cuenta? Inicia sesión' : '¿Sin cuenta? Regístrate gratis'}
            </Text>
          </Pressable>

          {mode === 'login' ? (
            <Pressable onPress={handleForgotPassword} style={{ alignItems: 'center', paddingVertical: 4 }}>
              <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: DARK.textDim }}>
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>
          ) : null}

          <Text style={{ fontFamily: FONTS.body, fontSize: 11, color: DARK.textMuted, textAlign: 'center', marginTop: 8 }}>
            Este es un coach motivacional de entretenimiento, no terapia ni consejo profesional.
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }}>
            <Pressable onPress={() => router.push('/legal/privacy')} hitSlop={8}>
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: DARK.textDim }}>Privacidad</Text>
            </Pressable>
            <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: DARK.textMuted }}>·</Text>
            <Pressable onPress={() => router.push('/legal/terms')} hitSlop={8}>
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: DARK.textDim }}>Términos</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
