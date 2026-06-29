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
import { t } from '../../src/i18n';
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
      show({ icon: character.emoji, title: t('onboarding.recruitTitle'), message: t('signup.needEmailPass'), accent });
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      show({ icon: character.emoji, title: t('onboarding.recruitTitle'), message: t('signup.passTooShort'), accent });
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const r = await signUp(email.trim(), password);
        if (r.error) {
          show({ icon: '⚠️', title: t('common.error'), message: r.error, accent });
          setLoading(false);
          return;
        }
        if (r.needsConfirmation) {
          show({
            icon: '✉️',
            title: t('signup.confirmEmailTitle'),
            message: t('signup.confirmEmailMsg'),
            accent,
          });
          setMode('login');
          setLoading(false);
          return;
        }
      } else {
        const r = await signIn(email.trim(), password);
        if (r.error) {
          show({ icon: '⚠️', title: t('common.error'), message: r.error, accent });
          setLoading(false);
          return;
        }
      }
      await finishOnboarding();
    } catch (err: any) {
      show({ icon: '⚠️', title: t('common.error'), message: err?.message ?? 'Error', accent });
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
        title: t('signup.guestUnavailable'),
        message: t('signup.guestUnavailableMsg'),
        accent,
      });
      setLoading(false);
      return;
    }
    await finishOnboarding();
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      show({ icon: '✉️', title: t('signup.emailRequired'), message: t('signup.emailRequiredMsg'), accent });
      return;
    }
    const { error } = await resetPassword(email.trim());
    if (error) {
      show({ icon: '⚠️', title: t('common.error'), message: error, accent });
      return;
    }
    show({ icon: '✉️', title: t('signup.checkEmail'), message: t('signup.resetSent', { email: email.trim() }), accent });
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
                {t('signup.headerBubble')}
              </Text>
            </Card>
          </View>

          <Text style={{ fontFamily: FONTS.display, fontSize: 28, color: DARK.text, letterSpacing: 1, marginBottom: 20 }}>
            {mode === 'signup' ? t('signup.createAccount') : t('signup.signIn')}
          </Text>

          {mode === 'signup' ? (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: DARK.textDim, marginBottom: 6 }}>
                {t('signup.nameOptional')}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('signup.namePlaceholder')}
                placeholderTextColor={DARK.textMuted}
                autoCapitalize="words"
                maxLength={40}
                style={inputStyle}
              />
            </View>
          ) : null}

          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: DARK.textDim, marginBottom: 6 }}>
              {t('signup.email')}
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('signup.emailPlaceholder')}
              placeholderTextColor={DARK.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={inputStyle}
            />
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: DARK.textDim, marginBottom: 6 }}>
              {t('signup.password')}
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t('signup.passwordPlaceholder')}
              placeholderTextColor={DARK.textMuted}
              secureTextEntry
              style={inputStyle}
            />
          </View>

          {mode === 'signup' ? (
            <Card elevation={1} accentColor={accent} tintOpacity={0.12} style={{ padding: 12, marginBottom: 20, borderColor: tint(accent, 0.4) }}>
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: DARK.text }}>
                {t('signup.trialBadge')}
              </Text>
            </Card>
          ) : null}

          <ComicButton
            label={loading ? t('signup.processing') : (mode === 'signup' ? t('signup.enlist') : t('signup.enter'))}
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
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: DARK.textMuted }}>{t('common.or')}</Text>
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
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 15, color: '#1F1F1F' }}>{t('signup.googleContinue')}</Text>
          </Pressable>

          {/* Probar sin cuenta (modo invitado) */}
          <Pressable
            onPress={handleGuest}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={t('signup.guestTry')}
            style={{ alignItems: 'center', paddingVertical: 14, marginTop: 4, opacity: loading ? 0.5 : 1 }}
          >
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: DARK.textDim }}>
              {t('signup.guestTry')}
            </Text>
            <Text style={{ fontFamily: FONTS.body, fontSize: 11, color: DARK.textMuted, marginTop: 2 }}>
              {t('signup.guestSub')}
            </Text>
          </Pressable>

          <Pressable onPress={() => setMode(mode === 'signup' ? 'login' : 'signup')} style={{ alignItems: 'center', paddingVertical: 16 }}>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: accent }}>
              {mode === 'signup' ? t('signup.haveAccount') : t('signup.noAccount')}
            </Text>
          </Pressable>

          {mode === 'login' ? (
            <Pressable onPress={handleForgotPassword} style={{ alignItems: 'center', paddingVertical: 4 }}>
              <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: DARK.textDim }}>
                {t('signup.forgot')}
              </Text>
            </Pressable>
          ) : null}

          <Text style={{ fontFamily: FONTS.body, fontSize: 11, color: DARK.textMuted, textAlign: 'center', marginTop: 8 }}>
            {t('signup.disclaimer')}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }}>
            <Pressable onPress={() => router.push('/legal/privacy')} hitSlop={8}>
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: DARK.textDim }}>{t('signup.privacy')}</Text>
            </Pressable>
            <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: DARK.textMuted }}>·</Text>
            <Pressable onPress={() => router.push('/legal/terms')} hitSlop={8}>
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: DARK.textDim }}>{t('signup.terms')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
