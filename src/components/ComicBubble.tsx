/**
 * Burbuja de chat — moderna sobre fondo oscuro.
 * Sargento: superficie alt + hairline. Usuario: tinte del acento + borde de acento.
 * Botón "Escuchar" como pastilla discreta con el color del sargento.
 */
import { Pressable, Text, View } from 'react-native';
import { DARK, FONTS, RADIUS, tint } from '../constants/theme';

interface Props {
  text: string;
  from: 'sergeant' | 'user';
  /** color de acento del sargento (para la burbuja del usuario y el botón de voz) */
  accent?: string;
  onSpeak?: () => void;
  speaking?: boolean;
}

export function ComicBubble({ text, from, accent = '#FFFFFF', onSpeak, speaking }: Props) {
  const isSergeant = from === 'sergeant';

  return (
    <View
      style={{
        alignSelf: isSergeant ? 'flex-start' : 'flex-end',
        maxWidth: '88%',
        marginBottom: 4,
      }}
    >
      <View
        style={{
          backgroundColor: isSergeant ? DARK.surfaceAlt : tint(accent, 0.18),
          borderWidth: 1,
          borderColor: isSergeant ? DARK.hairline : tint(accent, 0.5),
          borderRadius: RADIUS.lg,
          borderTopLeftRadius: isSergeant ? 6 : RADIUS.lg,
          borderTopRightRadius: isSergeant ? RADIUS.lg : 6,
          paddingVertical: 12,
          paddingHorizontal: 16,
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.bodyBold,
            fontSize: 15.5,
            lineHeight: 22,
            color: DARK.text,
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
              gap: 6,
              paddingVertical: 5,
              paddingHorizontal: 12,
              borderRadius: RADIUS.pill,
              borderWidth: 1,
              borderColor: speaking ? accent : DARK.hairlineStrong,
              backgroundColor: speaking ? tint(accent, 0.18) : 'transparent',
            }}
          >
            <Text style={{ fontSize: 13 }}>{speaking ? '🔊' : '🔈'}</Text>
            <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: speaking ? accent : DARK.textDim }}>
              {speaking ? 'Sonando...' : 'Escuchar'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
