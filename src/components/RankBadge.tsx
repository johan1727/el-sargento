/** Insignia de rango + racha (🔥). Usada en el header del Home y en /ranks. */
import { Text, View } from 'react-native';
import { comicBorder, comicShadow, COMIC } from '../constants/theme';
import { getRank, type RankId } from '../constants/ranks';

interface Props {
  rank: RankId;
  streak?: number;
  compact?: boolean;
}

export function RankBadge({ rank, streak, compact }: Props) {
  const r = getRank(rank);
  const badgeSize = compact ? 38 : 52;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={[
          comicBorder,
          comicShadow(3),
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            backgroundColor: r.color,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Text style={{ fontSize: badgeSize * 0.5 }}>{r.badge}</Text>
      </View>
      <View>
        <Text
          style={{
            fontFamily: 'Bangers',
            fontSize: compact ? 18 : 24,
            color: COMIC.ink,
            letterSpacing: 1,
          }}
        >
          {r.label}
        </Text>
        {typeof streak === 'number' ? (
          <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#444' }}>
            🔥 {streak} día{streak === 1 ? '' : 's'}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
