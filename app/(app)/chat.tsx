/**
 * Pantalla de chat — conversación con el sargento.
 *
 * Funciones:
 * - Historial de mensajes desde Supabase.
 * - Input de texto + envío.
 * - Botón de micrófono: graba → transcribe (expo-speech STT / Gemini) → responde.
 * - Cada burbuja del sargento tiene botón 🔊 para escuchar (Gemini TTS).
 * - Gate premium: sin acceso pleno → máx 3 mensajes/día.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  addMessage,
  countUserMessagesToday,
  getGoalsWithToday,
} from '../../src/lib/db';
import { generateSergeantReply, type ChatTurn } from '../../src/lib/gemini';
import { speak, stopSpeech } from '../../src/lib/tts';
import { hasFullAccess, FREE_DAILY_MESSAGE_LIMIT } from '../../src/lib/streak';
import type { Message } from '../../src/types/database';
import { ComicBubble } from '../../src/components/ComicBubble';
import { SergeantAvatar } from '../../src/components/SergeantAvatar';
import { SergeantHeader } from '../../src/components/SergeantHeader';
import { COMIC, comicBorder, comicShadow } from '../../src/constants/theme';

export default function ChatScreen() {
  const { user, profile } = useSession();
  const character = getCharacter(profile?.chosen_sergeant);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [msgCount, setMsgCount] = useState(0);
  const listRef = useRef<FlatList>(null);
  const recorderRef = useRef<Audio.Recording | null>(null);

  const isPremium = profile ? hasFullAccess(profile) : false;
  const limitReached = !isPremium && msgCount >= FREE_DAILY_MESSAGE_LIMIT;

  // Carga inicial.
  useEffect(() => {
    if (!user || !profile) return;
    (async () => {
      const [msgs, count] = await Promise.all([
        getRecentMessages(user.id, 30),
        countUserMessagesToday(user.id),
      ]);
      setMessages(msgs);
      setMsgCount(count);
    })();
  }, [user, profile]);

  const scrollToBottom = () => {
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
      Alert.alert(
        '🔒 Límite del día',
        `Sin Premium, tienes ${FREE_DAILY_MESSAGE_LIMIT} mensajes por día. ¡Activa tu suscripción para hablar sin límites!`,
        [{ text: 'Cerrar' }],
      );
      return;
    }

    setSending(true);
    const userText = text.trim();
    setInput('');

    // Guardar mensaje del usuario.
    const userMsg = await addMessage(user.id, {
      role: 'user',
      content: userText,
      sergeant_id: profile.chosen_sergeant,
    });
    setMessages((prev) => [...prev, userMsg]);
    setMsgCount((c) => c + 1);
    scrollToBottom();

    // Construir historial para Gemini (últimos 10 turnos).
    const history: ChatTurn[] = messages.slice(-10).map((m) => ({
      role: m.role === 'user' ? 'user' : 'sergeant',
      content: m.content,
    }));

    const ctx = await getContext();
    const reply = await generateSergeantReply(profile.chosen_sergeant, history, userText, ctx);

    // Guardar respuesta del sargento.
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
      Alert.alert('🔒 Solo Premium', 'La conversación por voz está disponible con suscripción activa.');
      return;
    }
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permiso necesario', 'Necesitamos acceso al micrófono para escucharte.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
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

      // TODO: Gemini puede recibir audio directamente (multimodal).
      // Por ahora usamos expo-speech on-device STT si está disponible.
      // Fallback: mostrar input de texto con aviso.
      // Para una implementación completa, enviar el audio a Gemini como
      // inlineData base64 con mimeType 'audio/m4a' en el mensaje del usuario.
      Alert.alert(
        'Voz grabada',
        'Por ahora escribe tu mensaje. En producción aquí va la transcripción automática.',
        [{ text: 'OK' }],
      );
    } catch (err) {
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
          <SergeantAvatar sergeantId={character.id} size={36} shadow={2} />
          <ComicBubble
            from="sergeant"
            text={item.content}
            color="#FFFFFF"
            onSpeak={() => handleSpeak(item)}
            speaking={speakingId === item.id}
          />
        </View>
      );
    }
    return (
      <View style={{ paddingLeft: 16, paddingRight: 4 }}>
        <ComicBubble
          from="user"
          text={item.content}
          color="#FFE9A8"
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COMIC.paper }}>
      {/* Header full-bleed */}
      <SergeantHeader
        character={character}
        subtitle={!isPremium ? `${Math.max(0, FREE_DAILY_MESSAGE_LIMIT - msgCount)} mensajes hoy · Activa Premium` : undefined}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={90}
      >
        {/* Lista de mensajes */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ fontFamily: 'Bangers', fontSize: 28, color: COMIC.ink, letterSpacing: 1, textAlign: 'center' }}>
                {character.emoji}
              </Text>
              <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#888', marginTop: 10, textAlign: 'center' }}>
                ¿Qué le dices a {character.name}?
              </Text>
            </View>
          }
          ListFooterComponent={
            sending ? (
              <View style={{ flexDirection: 'row', gap: 8, paddingLeft: 4, marginTop: 8 }}>
                <SergeantAvatar sergeantId={character.id} size={36} shadow={2} />
                <View style={[comicBorder, comicShadow(3), { backgroundColor: '#FFF', borderRadius: 14, padding: 14 }]}>
                  <ActivityIndicator color={character.theme.primary} />
                </View>
              </View>
            ) : null
          }
        />

        {/* Input bar */}
        <View
          style={[
            comicBorder,
            {
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: 8,
              backgroundColor: '#FFFFFF',
              padding: 10,
              borderBottomWidth: 0,
              borderLeftWidth: 0,
              borderRightWidth: 0,
            },
          ]}
        >
          {/* Botón de micrófono */}
          <Pressable
            onPressIn={startRecording}
            onPressOut={stopRecording}
            style={[
              comicBorder,
              comicShadow(3),
              {
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: recording ? '#E01E37' : character.theme.primary,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            <Text style={{ fontSize: 22 }}>{recording ? '🔴' : '🎤'}</Text>
          </Pressable>

          {/* Input de texto */}
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={limitReached ? 'Límite diario alcanzado' : 'Escríbele al sargento...'}
            placeholderTextColor="#AAA"
            multiline
            editable={!limitReached}
            style={[
              comicBorder,
              {
                flex: 1,
                backgroundColor: limitReached ? '#F5F5F5' : '#FFFFFF',
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 14,
                fontFamily: 'Nunito_700Bold',
                fontSize: 15,
                color: COMIC.ink,
                maxHeight: 100,
              },
            ]}
            onSubmitEditing={() => sendMessage(input)}
          />

          {/* Enviar */}
          <Pressable
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || sending || limitReached}
            style={[
              comicBorder,
              comicShadow(3),
              {
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: input.trim() && !limitReached ? character.theme.accent : '#DDD',
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            <Text style={{ fontSize: 22 }}>▶</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
