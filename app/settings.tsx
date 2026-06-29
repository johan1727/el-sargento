/**
 * Pantalla de Ajustes — cambiar sargento, hora de check-in, nombre, y gestión de
 * cuenta (cerrar sesión, borrar cuenta). Accesible desde el engranaje del header.
 */
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useSession } from '../src/store/session';
import { CHARACTER_LIST, getCharacter, type SergeantId } from '../src/constants/characters';
import { hasFullAccess, isTrialActive, trialDaysLeft } from '../src/lib/streak';
import { updateProfile, deleteAccountData } from '../src/lib/db';
import { supabase } from '../src/lib/supabase';
import { SergeantAvatar } from '../src/components/SergeantAvatar';
import { Card } from '../src/components/Card';
import { ComicButton } from '../src/components/ComicButton';
import { useDialog } from '../src/components/Dialog';
import { DARK, FONTS, RADIUS, accentGlow, tint } from '../src/constants/theme';

const HOURS = [6, 7, 8, 9, 12, 18, 20, 21];
const fmtHour = (h: number) => (h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`);

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, patchProfile, signOut, isGuest, upgradeAccount } = useSession();
  const { show } = useDialog();
  const character = getCharacter(profile?.chosen_sergeant);
  const accent = character.theme.accent;

  const [name, setName] = useState(profile?.display_name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [busy, setBusy] = useState(false);

  // Upgrade de cuenta invitada → permanente.
  const [upEmail, setUpEmail] = useState('');
  const [upPass, setUpPass] = useState('');
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (!upEmail.trim() || upPass.length < 6) {
      show({ icon: '✉️', title: 'Faltan datos', message: 'Escribe tu correo y una contraseña de al menos 6 caracteres.', accent });
      return;
    }
    setUpgrading(true);
    const r = await upgradeAccount(upEmail.trim(), upPass);
    setUpgrading(false);
    if (r.error) {
      show({ icon: '⚠️', title: 'No se pudo', message: r.error, accent });
      return;
    }
    setUpEmail('');
    setUpPass('');
    show({
      icon: '🎉',
      title: '¡Cuenta creada!',
      message: r.needsConfirmation
        ? 'Revisa tu correo para confirmarlo. Tu progreso quedó guardado.'
        : 'Tu progreso quedó guardado en tu cuenta.',
      accent,
    });
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(app)'));

  const reschedule = async (hour: number, sergeant: SergeantId) => {
    const { scheduleCheckinNotification } = await import('../src/lib/notifications');
    scheduleCheckinNotification(hour, sergeant).catch(() => {});
  };

  const handleSaveName = async () => {
    if (!user) return;
    setSavingName(true);
    const updated = await updateProfile(user.id, { display_name: name.trim().slice(0, 40) || null });
    patchProfile(updated);
    setSavingName(false);
    show({ icon: '✅', title: 'Listo', message: 'Nombre actualizado.', accent });
  };

  const handleChangeSergeant = async (id: SergeantId) => {
    if (!user || !profile || id === profile.chosen_sergeant) return;
    setBusy(true);
    const updated = await updateProfile(user.id, { chosen_sergeant: id });
    patchProfile(updated);
    await reschedule(profile.checkin_hour ?? 8, id);
    setBusy(false);
  };

  const handleChangeHour = async (hour: number) => {
    if (!user || !profile || hour === profile.checkin_hour) return;
    setBusy(true);
    const updated = await updateProfile(user.id, { checkin_hour: hour });
    patchProfile(updated);
    await reschedule(hour, profile.chosen_sergeant);
    setBusy(false);
  };

  const doSignOut = async () => {
    await signOut();
    router.replace('/onboarding');
  };

  const handleSignOut = () => {
    // Un invitado pierde su progreso al salir (la sesión anónima no se recupera).
    if (isGuest) {
      show({
        icon: '⚠️',
        title: 'Eres invitado',
        message: 'Si cierras sesión perderás tu progreso. Crea tu cuenta arriba para conservarlo.',
        buttons: [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir igual', style: 'destructive', onPress: doSignOut },
        ],
      });
      return;
    }
    doSignOut();
  };

  const handleDelete = () => {
    show({
      icon: '⚠️',
      title: 'Borrar cuenta',
      message: 'Se eliminarán tus metas, racha, historial de chat y perfil. Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            setBusy(true);
            // Borrado completo (incluye auth.users) vía Edge Function service-role.
            const { error } = await supabase.functions.invoke('delete-account');
            if (error) {
              // Fallback (si la función aún no está desplegada): borra solo los datos.
              try {
                await deleteAccountData(user.id);
              } catch {
                // continuamos al signOut igualmente
              }
            }
            await signOut();
            setBusy(false);
            router.replace('/onboarding');
          },
        },
      ],
    });
  };

  const premiumLabel = profile?.is_premium
    ? '✅ Premium activo'
    : profile && isTrialActive(profile)
    ? `🎁 Trial — ${trialDaysLeft(profile)} día(s) restantes`
    : '🔒 Sin acceso premium';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK.bg }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: DARK.hairline,
          backgroundColor: DARK.bgElevated,
        }}
      >
        <Text style={{ fontFamily: FONTS.display, fontSize: 28, color: DARK.text, letterSpacing: 1 }}>AJUSTES</Text>
        <Pressable onPress={close} hitSlop={10} style={{ padding: 6 }}>
          <Text style={{ fontSize: 22, color: DARK.textDim }}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Upgrade de invitado */}
        {isGuest ? (
          <Card accentColor={accent} tintOpacity={0.1} elevation={1} style={{ padding: 16, borderColor: tint(accent, 0.4) }}>
            <Text style={{ fontFamily: FONTS.display, fontSize: 22, color: DARK.text, letterSpacing: 0.8, marginBottom: 4 }}>
              👀 ESTÁS DE INVITADO
            </Text>
            <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: DARK.textDim, lineHeight: 19, marginBottom: 12 }}>
              Crea tu cuenta para no perder tu racha ni tus metas, y poder entrar desde otro dispositivo.
            </Text>
            <TextInput
              value={upEmail}
              onChangeText={setUpEmail}
              placeholder="tú@correo.com"
              placeholderTextColor={DARK.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{
                backgroundColor: DARK.surfaceAlt,
                borderWidth: 1,
                borderColor: DARK.hairline,
                borderRadius: RADIUS.md,
                paddingVertical: 12,
                paddingHorizontal: 14,
                fontFamily: FONTS.bodyBold,
                fontSize: 15,
                color: DARK.text,
                marginBottom: 8,
              }}
            />
            <TextInput
              value={upPass}
              onChangeText={setUpPass}
              placeholder="Contraseña (mín. 6)"
              placeholderTextColor={DARK.textMuted}
              secureTextEntry
              style={{
                backgroundColor: DARK.surfaceAlt,
                borderWidth: 1,
                borderColor: DARK.hairline,
                borderRadius: RADIUS.md,
                paddingVertical: 12,
                paddingHorizontal: 14,
                fontFamily: FONTS.bodyBold,
                fontSize: 15,
                color: DARK.text,
                marginBottom: 12,
              }}
            />
            <ComicButton
              label={upgrading ? 'CREANDO...' : 'CREAR MI CUENTA'}
              color={accent}
              textColor="#0B0E13"
              fullWidth
              disabled={upgrading}
              onPress={handleUpgrade}
            />
          </Card>
        ) : null}

        {/* Estado premium */}
        <Card accentColor={accent} tintOpacity={0.08} elevation={1} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 15, color: DARK.text }}>{premiumLabel}</Text>
          {profile && !hasFullAccess(profile) ? (
            <Pressable onPress={() => router.push('/paywall')}>
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: accent }}>Activar →</Text>
            </Pressable>
          ) : null}
        </Card>

        {/* Nombre */}
        <View>
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: DARK.textDim, letterSpacing: 1.2, marginBottom: 8 }}>
            TU NOMBRE
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Recluta"
              placeholderTextColor={DARK.textMuted}
              autoCapitalize="words"
              maxLength={40}
              style={{
                flex: 1,
                backgroundColor: DARK.surfaceAlt,
                borderWidth: 1,
                borderColor: DARK.hairline,
                borderRadius: RADIUS.md,
                paddingVertical: 13,
                paddingHorizontal: 14,
                fontFamily: FONTS.bodyBold,
                fontSize: 16,
                color: DARK.text,
              }}
            />
            <ComicButton
              label={savingName ? '...' : 'GUARDAR'}
              color={accent}
              textColor="#0B0E13"
              size="sm"
              disabled={savingName}
              onPress={handleSaveName}
            />
          </View>
        </View>

        {/* Sargento */}
        <View>
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: DARK.textDim, letterSpacing: 1.2, marginBottom: 8 }}>
            TU SARGENTO
          </Text>
          <View style={{ gap: 10 }}>
            {CHARACTER_LIST.map((c) => {
              const selected = profile?.chosen_sergeant === c.id;
              const a = c.theme.accent;
              return (
                <Pressable key={c.id} onPress={() => handleChangeSergeant(c.id)} disabled={busy}>
                  <View
                    style={[
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        padding: 12,
                        borderRadius: RADIUS.md,
                        backgroundColor: selected ? tint(a, 0.12) : DARK.surface,
                        borderWidth: selected ? 1.5 : 1,
                        borderColor: selected ? a : DARK.hairline,
                      },
                      selected ? accentGlow(a, 1) : null,
                    ]}
                  >
                    <SergeantAvatar sergeantId={c.id} size={44} shadow={0} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: FONTS.display, fontSize: 19, color: DARK.text, letterSpacing: 0.5 }}>
                        {c.name} {c.flag}
                      </Text>
                      <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: DARK.textDim }} numberOfLines={1}>
                        {c.tagline}
                      </Text>
                    </View>
                    {selected ? <Text style={{ fontSize: 16, color: a }}>✓</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Hora de check-in */}
        <View>
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: DARK.textDim, letterSpacing: 1.2, marginBottom: 8 }}>
            HORA DEL CHECK-IN
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {HOURS.map((h) => {
              const selected = profile?.checkin_hour === h;
              return (
                <Pressable key={h} onPress={() => handleChangeHour(h)} disabled={busy}>
                  <View
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: RADIUS.md,
                      backgroundColor: selected ? tint(accent, 0.16) : DARK.surface,
                      borderWidth: 1,
                      borderColor: selected ? accent : DARK.hairline,
                    }}
                  >
                    <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: selected ? accent : DARK.textDim }}>
                      {fmtHour(h)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Legal */}
        <View>
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: DARK.textDim, letterSpacing: 1.2, marginBottom: 8 }}>
            LEGAL
          </Text>
          <View style={{ gap: 1, borderRadius: RADIUS.md, overflow: 'hidden', borderWidth: 1, borderColor: DARK.hairline }}>
            <Pressable
              onPress={() => router.push('/legal/privacy')}
              style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: DARK.surface }}
            >
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 15, color: DARK.text }}>Política de privacidad</Text>
              <Text style={{ color: DARK.textMuted }}>›</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/legal/terms')}
              style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: DARK.surface }}
            >
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 15, color: DARK.text }}>Términos de servicio</Text>
              <Text style={{ color: DARK.textMuted }}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* Cuenta */}
        <View style={{ marginTop: 8, gap: 10 }}>
          <ComicButton label="CERRAR SESIÓN" variant="ghost" color={DARK.textDim} fullWidth onPress={handleSignOut} />
          <Pressable onPress={handleDelete} disabled={busy} style={{ alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 14, color: '#FF5A65' }}>Borrar mi cuenta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
