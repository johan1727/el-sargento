/** Insignia de rango + racha (🔥). Usada en headers y en /ranks — versión dark. */
import { Text, View } from 'react-native';
import { DARK, FONTS, RADIUS, softShadow } from '../constants/theme';
import { getRank, type RankId } from '../constants/ranks';

interface Props {
  rank: RankId;
  streak?: number;
  compact?: boolean;
}

export function RankBadge({ rank, streak, compact }: Props) {
  const r = getRank(rank);
  const badgeSize = compact ? 34 : 50;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={[
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            backgroundColor: r.color,
            borderWidth: 1.5,
            borderColor: DARK.hairlineStrong,
            alignItems: 'center',
            justifyContent: 'center',
          },
          softShadow(1),
        ]}
      >
        <Text style={{ fontSize: badgeSize * 0.48 }}>{r.badge}</Text>
      </View>
      <View>
        <Text
          style={{
            fontFamily: FONTS.display,
            fontSize: compact ? 17 : 23,
            color: DARK.text,
            letterSpacing: 0.8,
          }}
        >
          {r.label}
        </Text>
        {typeof streak === 'number' ? (
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 13, color: DARK.textDim }}>
            🔥 {streak} día{streak === 1 ? '' : 's'}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
