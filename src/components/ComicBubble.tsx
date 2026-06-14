/**
 * Viñeta de diálogo cómic — Brutalist.
 * Sombra dura 5px, borde negro 3px, cola con borde explícito.
 * Burbujas del sargento llevan color wash de su paleta.
 */
import { Pressable, Text, View } from 'react-native';
import { comicBorder, comicShadow, COMIC } from '../constants/theme';

interface Props {
  text: string;
  from: 'sergeant' | 'user';
  color?: string;
  textColor?: string;
  onSpeak?: () => void;
  speaking?: boolean;
}

export function ComicBubble({ text, from, color, textColor, onSpeak, speaking }: Props) {
  const isSergeant = from === 'sergeant';
  const bg = color ?? (isSergeant ? '#FFFFFF' : '#FFE566');
  const fg = textColor ?? COMIC.ink;

  return (
    <View
      style={{
        alignSelf: isSergeant ? 'flex-start' : 'flex-end',
        maxWidth: '88%',
        marginBottom: 18, // espacio para la cola
      }}
    >
      <View
        style={[
          comicBorder,
          comicShadow(5),
          {
            backgroundColor: bg,
            borderRadius: 18,
            paddingVertical: 13,
            paddingHorizontal: 17,
          },
        ]}
      >
        <Text
          style={{
            fontFamily: 'Nunito_700Bold',
            fontSize: 16,
            lineHeight: 22,
            color: fg,
          }}
        >
          {text}
        </Text>

        {isSergeant && onSpeak ? (
          <Pressable
            onPress={onSpeak}
            hitSlop={10}
            style={{
              marginTop: 10,
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingVertical: 4,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: COMIC.ink,
              backgroundColor: speaking ? COMIC.yellow : '#F0F0F0',
            }}
          >
            <Text style={{ fontSize: 14 }}>{speaking ? '🔊' : '🔈'}</Text>
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 12, color: COMIC.ink }}>
              {speaking ? 'Sonando...' : 'Escuchar'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Cola de diálogo — borde exterior negro + interior del color de burbuja */}
      <View
        style={{
          position: 'absolute',
          bottom: -11,
          [isSergeant ? 'left' : 'right']: 20,
          width: 0,
          height: 0,
          borderLeftWidth: 12,
          borderRightWidth: 12,
          borderTopWidth: 14,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: COMIC.ink,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -5,
          [isSergeant ? 'left' : 'right']: 24,
          width: 0,
          height: 0,
          borderLeftWidth: 8,
          borderRightWidth: 8,
          borderTopWidth: 10,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: bg,
        }}
      />
    </View>
  );
}
