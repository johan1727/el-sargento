/**
 * Layout de la app principal — tabs: Cuartel / Chat / Metas / Rango.
 * Tab bar oscuro; el acento activo usa el color del sargento elegido.
 */
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useSession } from '../../src/store/session';
import { getCharacter } from '../../src/constants/characters';
import { DARK, FONTS, tint } from '../../src/constants/theme';

function TabIcon({ emoji, focused, accent }: { emoji: string; focused: boolean; accent: string }) {
  return (
    <View
      style={{
        width: 44,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: focused ? tint(accent, 0.16) : 'transparent',
      }}
    >
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
    </View>
  );
}

export default function AppLayout() {
  const { profile } = useSession();
  const character = getCharacter(profile?.chosen_sergeant);
  const accent = character.theme.accent;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: DARK.bgElevated,
          borderTopWidth: 1,
          borderTopColor: DARK.hairline,
          height: 70,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: DARK.textMuted,
        tabBarLabelStyle: {
          fontFamily: FONTS.display,
          fontSize: 12,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'CUARTEL',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} accent={accent} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'HABLAR',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} accent={accent} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'METAS',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎯" focused={focused} accent={accent} />,
        }}
      />
      <Tabs.Screen
        name="ranks"
        options={{
          title: 'RANGO',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏅" focused={focused} accent={accent} />,
        }}
      />
    </Tabs>
  );
}
