/** Chrome compartido de las páginas legales (Privacidad / Términos). */
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DARK, FONTS } from '../constants/theme';

export interface LegalSection {
  h: string;
  b: string;
}

export function LegalScreen({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) {
  const router = useRouter();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/onboarding'));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK.bg }} edges={['top']}>
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
        <Text style={{ fontFamily: FONTS.display, fontSize: 24, color: DARK.text, letterSpacing: 0.8 }} numberOfLines={1}>
          {title}
        </Text>
        <Pressable onPress={close} hitSlop={10} style={{ padding: 6 }}>
          <Text style={{ fontSize: 22, color: DARK.textDim }}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: DARK.textMuted, marginBottom: 20 }}>
          Última actualización: {updated}
        </Text>
        {sections.map((s, i) => (
          <View key={i} style={{ marginBottom: 20 }}>
            <Text style={{ fontFamily: FONTS.bodyBlack, fontSize: 16, color: DARK.text, marginBottom: 6 }}>{s.h}</Text>
            <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: DARK.textDim, lineHeight: 21 }}>{s.b}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
