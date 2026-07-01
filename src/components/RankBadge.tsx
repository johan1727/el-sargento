/** Insignia de rango + racha (🔥). Usada en headers y en /ranks — versión dark. */
import { Text, View } from 'react-native';
import { DARK, FONTS, softShadow } from '../constants/theme';
import { getRank, rankLabel, type RankId } from '../constants/ranks';
import { RankIcon } from './RankIcon';
import { t } from '../i18n';

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
      <RankIcon
        id={r.id}
        emoji={r.badge}
        size={badgeSize}
        color={r.color}
        style={[{ borderWidth: 1.5, borderColor: DARK.hairlineStrong }, softShadow(1)]}
      />
      <View>
        <Text
          style={{
            fontFamily: FONTS.display,
            fontSize: compact ? 17 : 23,
            color: DARK.text,
            letterSpacing: 0.8,
          }}
        >
          {rankLabel(r)}
        </Text>
        {typeof streak === 'number' ? (
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 13, color: DARK.textDim }}>
            🔥 {t('ranks.daysShort', { n: streak })}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
