/**
 * Pantalla de chat — conversación con el sargento (rediseño dark).
 *
 * Funciones:
 * - Historial de mensajes desde Supabase.
 * - Input de texto + envío.
 * - Botón de micrófono: graba → (futuro) transcribe → responde.
 * - Cada burbuja del sargento tiene botón 🔊 para escuchar (Gemini TTS).
 * - Gate premium: sin acceso pleno → máx 3 mensajes/día.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';

import { useSession } from '../../src/store/session';
import { getCharacter } from '../../src/constants/characters';
import {
  getRecentMessages,
  getMessagesBefore,
  addMessage,
  countUserMessagesToday,
  getGoalsWithToday,
} from '../../src/lib/db';
import { generateSergeantReply, transcribeAudio, type ChatTurn } from '../../src/lib/gemini';
import { speak, stopSpeech } from '../../src/lib/tts';
import { hasFullAccess, FREE_DAILY_MESSAGE_LIMIT } from '../../src/lib/streak';
import type { Message } from '../../src/types/database';
import { ComicBubble } from '../../src/components/ComicBubble';
import { SergeantAvatar } from '../../src/components/SergeantAvatar';
import { SergeantHeader } from '../../src/components/SergeantHeader';
import { Card } from '../../src/components/Card';
import { ComicButton } from '../../src/components/ComicButton';
import { useDialog } from '../../src/components/Dialog';
import { t } from '../../src/i18n';
import { DARK, FONTS, RADIUS, accentGlow } from '../../src/constants/theme';

/** Tope de longitud del mensaje del usuario (evita payloads enormes). */
const MAX_MESSAGE_LEN = 1000;

export default function ChatScreen() {
  const { user, profile, isGuest } = useSession();
  const { show } = useDialog();
  const router = useRouter();
  const character = getCharacter(profile?.chosen_sergeant);
  const accent = character.theme.accent;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [aiOffline, setAiOffline] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [msgCount, setMsgCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const listRef = useRef<FlatList>(null);
  const recorderRef = useRef<Audio.Recording | null>(null);
  // Evita el auto-scroll al fondo cuando prependemos mensajes viejos (paginación).
  const suppressScrollRef = useRef(false);

  const PAGE = 30;

  const isPremium = profile ? hasFullAccess(profile) : false;
  const limitReached = !isPremium && msgCount >= FREE_DAILY_MESSAGE_LIMIT;

  useEffect(() => {
    if (!user || !profile) return;
    (async () => {
      const [msgs, count] = await Promise.all([
        getRecentMessages(user.id, PAGE),
        countUserMessagesToday(user.id),
      ]);
      setMessages(msgs);
      setMsgCount(count);
      setHasMore(msgs.length >= PAGE);
    })();
  }, [user, profile]);

  // Paginación: carga mensajes anteriores (al tocar "Cargar anteriores").
  const loadMore = useCallback(async () => {
    if (!user || loadingMore || !hasMore || !messages.length) return;
    setLoadingMore(true);
    const oldest = messages[0];
    const older = await getMessagesBefore(user.id, oldest.created_at, PAGE);
    if (older.length) {
      suppressScrollRef.current = true; // no saltar al fondo al prepender
      setMessages((prev) => [...older, ...prev]);
    }
    if (older.length < PAGE) setHasMore(false);
    setLoadingMore(false);
  }, [user, loadingMore, hasMore, messages]);

  const scrollToBottom = () => {
    if (suppressScrollRef.current) {
      suppressScrollRef.current = false;
      return;
    }
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const getContext = useCallback(async () => {
    if (!user || !profile) return { displayName: null, rank: 'recluta', streak: 0, goalsToday: [] };
    const goals = await getGoalsWithToday(user.id);
    return {
      displayName: profile.display_name,
      rank: profile.rank,
      streak: profile.current_streak,
      goalsToday: goals.map((g) => ({
        title: g.title,
        completed: !!g.todayCheckin?.completed,
      })),
    };
  }, [user, profile]);

  const sendMessage = useCallback(async (text: string) => {
    if (!user || !profile || !text.trim() || sending) return;
    if (limitReached) {
      show({
        icon: '🔒',
        title: t('chat.limitTitle'),
        message: t('chat.limitMsg', { n: FREE_DAILY_MESSAGE_LIMIT }),
        accent,
        buttons: [{ text: t('common.close'), style: 'cancel' }],
      });
      return;
    }

    setSending(true);
    const userText = text.trim().slice(0, MAX_MESSAGE_LEN);
    setInput('');

    const userMsg = await addMessage(user.id, {
      role: 'user',
      content: userText,
      sergeant_id: profile.chosen_sergeant,
    });
    setMessages((prev) => [...prev, userMsg]);
    setMsgCount((c) => c + 1);
    scrollToBottom();

    const history: ChatTurn[] = messages.slice(-10).map((m) => ({
      role: m.role === 'user' ? 'user' : 'sergeant',
      content: m.content,
    }));

    const ctx = await getContext();
    const reply = await generateSergeantReply(profile.chosen_sergeant, history, userText, ctx);
    setAiOffline(!reply.fromAI);

    const sergMsg = await addMessage(user.id, {
      role: 'sergeant',
      content: reply.text,
      sergeant_id: profile.chosen_sergeant,
      has_audio: false,
    });
    setMessages((prev) => [...prev, sergMsg]);
    scrollToBottom();
    setSending(false);
  }, [user, profile, messages, sending, limitReached, getContext]);

  // ── Voz: grabar ───────────────────────────────────────────────
  const startRecording = async () => {
    if (!isPremium) {
      show({ icon: '🔒', title: t('chat.premiumOnlyTitle'), message: t('chat.premiumOnlyMsg'), accent });
      return;
    }
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        show({ icon: '🎤', title: t('chat.permissionTitle'), message: t('chat.permissionMsg'), accent });
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recorderRef.current = recording;
      setRecording(true);
    } catch (err) {
      if (__DEV__) console.warn('[chat] startRecording', err);
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;
    setRecording(false);
    try {
      await recorderRef.current.stopAndUnloadAsync();
      const uri = recorderRef.current.getURI();
      recorderRef.current = null;
      if (!uri) return;

      // Transcribe el audio con Gemini multimodal y manda el texto como mensaje.
      setTranscribing(true);
      const text = await transcribeAudio(uri);
      setTranscribing(false);

      if (text) {
        await sendMessage(text);
      } else {
        show({
          icon: '🎤',
          title: t('chat.transcribeFailTitle'),
          message: t('chat.transcribeFailMsg'),
          accent,
        });
      }
    } catch (err) {
      setTranscribing(false);
      if (__DEV__) console.warn('[chat] stopRecording', err);
    }
  };

  const handleSpeak = async (msg: Message) => {
    if (speakingId === msg.id) {
      await stopSpeech();
      setSpeakingId(null);
      return;
    }
    setSpeakingId(msg.id);
    await speak(msg.content, profile?.chosen_sergeant ?? 'gomez');
    setSpeakingId(null);
  };

  const renderItem = ({ item }: { item: Message }) => {
    if (item.role === 'sergeant') {
      return (
        <View style={{ flexDirection: 'row', gap: 8, paddingLeft: 4, paddingRight: 16 }}>
          <SergeantAvatar sergeantId={character.id} size={34} shadow={1} />
          <ComicBubble
            from="sergeant"
            accent={accent}
            text={item.content}
            onSpeak={() => handleSpeak(item)}
            speaking={speakingId === item.id}
          />
        </View>
      );
    }
    return (
      <View style={{ paddingLeft: 16, paddingRight: 4 }}>
        <ComicBubble from="user" accent={accent} text={item.content} />
      </View>
    );
  };

  // Invitado: el chat con IA y la voz requieren cuenta. Lo incitamos a registrarse.
  if (isGuest) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DARK.bg }} edges={['top']}>
        <SergeantHeader character={character} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 8 }}>
          <Text style={{ fontSize: 56 }}>🔒</Text>
          <Text style={{ fontFamily: FONTS.display, fontSize: 30, color: DARK.text, letterSpacing: 1, textAlign: 'center' }}>
            {t('guest.chatLockedTitle', { name: character.name.toUpperCase() })}
          </Text>
          <Text style={{ fontFamily: FONTS.body, fontSize: 15, color: DARK.textDim, textAlign: 'center', lineHeight: 22, marginBottom: 12 }}>
            {t('guest.chatLockedBody')}
          </Text>
          <ComicButton
            label={t('guest.createMyAccount')}
            color={accent}
            textColor="#0B0E13"
            size="lg"
            fullWidth
            onPress={() => router.push('/settings')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK.bg }} edges={['top']}>
      <SergeantHeader
        character={character}
        subtitle={!isPremium ? t('chat.messagesToday', { n: Math.max(0, FREE_DAILY_MESSAGE_LIMIT - msgCount) }) : undefined}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListHeaderComponent={
            hasMore ? (
              <Pressable
                onPress={loadMore}
                disabled={loadingMore}
                accessibilityRole="button"
                accessibilityLabel="Cargar mensajes anteriores"
                style={{ alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16, marginBottom: 4 }}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color={accent} />
                ) : (
                  <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 13, color: DARK.textDim }}>{t('chat.loadMore')}</Text>
                )}
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 48 }}>
              <Text style={{ fontSize: 40 }}>{character.emoji}</Text>
              <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 16, color: DARK.textDim, marginTop: 12, textAlign: 'center' }}>
                {t('chat.empty', { name: character.name })}
              </Text>
            </View>
          }
          ListFooterComponent={
            sending ? (
              <View style={{ flexDirection: 'row', gap: 8, paddingLeft: 4, marginTop: 4 }}>
                <SergeantAvatar sergeantId={character.id} size={34} shadow={1} />
                <Card alt elevation={0} style={{ padding: 14, alignSelf: 'flex-start' }}>
                  <ActivityIndicator color={accent} />
                </Card>
              </View>
            ) : null
          }
        />

        {/* Banner: respuesta offline (sin conexión a la IA) */}
        {aiOffline ? (
          <View style={{ backgroundColor: 'rgba(245,184,67,0.14)', borderTopWidth: 1, borderTopColor: 'rgba(245,184,67,0.4)', paddingVertical: 8, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 13 }}>⚠️</Text>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: '#F5B843', flex: 1 }}>
              {t('chat.offlineBanner')}
            </Text>
          </View>
        ) : null}

        {/* Input bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 8,
            backgroundColor: DARK.bgElevated,
            borderTopWidth: 1,
            borderTopColor: DARK.hairline,
            padding: 10,
          }}
        >
          {/* Micrófono */}
          <Pressable
            onPressIn={() => { if (!transcribing) startRecording(); }}
            onPressOut={stopRecording}
            disabled={transcribing}
            accessibilityRole="button"
            accessibilityLabel={recording ? 'Detener grabación de voz' : 'Mantén para grabar un mensaje de voz'}
            style={[
              {
                width: 48,
                height: 48,
                borderRadius: RADIUS.md,
                backgroundColor: recording ? '#E01E37' : DARK.surfaceAlt,
                borderWidth: 1,
                borderColor: recording ? '#E01E37' : DARK.hairline,
                alignItems: 'center',
                justifyContent: 'center',
              },
              recording ? accentGlow('#E01E37', 1) : null,
            ]}
          >
            {transcribing ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <Text style={{ fontSize: 20 }}>{recording ? '🔴' : '🎤'}</Text>
            )}
          </Pressable>

          {/* Texto */}
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={limitReached ? t('chat.limitPlaceholder') : t('chat.inputPlaceholder')}
            placeholderTextColor={DARK.textMuted}
            multiline
            maxLength={MAX_MESSAGE_LEN}
            editable={!limitReached}
            style={{
              flex: 1,
              backgroundColor: DARK.surfaceAlt,
              borderWidth: 1,
              borderColor: DARK.hairline,
              borderRadius: RADIUS.md,
              paddingVertical: 12,
              paddingHorizontal: 14,
              fontFamily: FONTS.bodyBold,
              fontSize: 15,
              color: DARK.text,
              maxHeight: 100,
            }}
            onSubmitEditing={() => sendMessage(input)}
          />

          {/* Enviar */}
          <Pressable
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || sending || limitReached}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
            style={[
              {
                width: 48,
                height: 48,
                borderRadius: RADIUS.md,
                backgroundColor: input.trim() && !limitReached ? accent : DARK.surfaceHigh,
                alignItems: 'center',
                justifyContent: 'center',
              },
              input.trim() && !limitReached ? accentGlow(accent, 1) : null,
            ]}
          >
            <Text style={{ fontSize: 20, color: input.trim() && !limitReached ? '#0B0E13' : DARK.textMuted }}>▶</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
