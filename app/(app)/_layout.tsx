/**
 * Layout de la app principal — tabs: Cuartel / Chat / Metas / Rango.
 * Los colores del tab bar cambian según el sargento elegido.
 */
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useSession } from '../../src/store/session';
import { getCharacter } from '../../src/constants/characters';
import { COMIC } from '../../src/constants/theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={{
      width: 44, height: 44,
      alignItems: 'center', justifyContent: 'center',
      borderRadius: 22,
      borderWidth: focused ? 2 : 0,
      borderColor: COMIC.ink,
      backgroundColor: focused ? '#FFD23F' : 'transparent',
    }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
    </View>
  );
}

export default function AppLayout() {
  const { profile } = useSession();
  const character = getCharacter(profile?.chosen_sergeant);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: character.theme.dark,
          borderTopWidth: 3,
          borderTopColor: COMIC.ink,
          height: 68,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#FFD23F',
        tabBarInactiveTintColor: '#AAAAAA',
        tabBarLabelStyle: {
          fontFamily: 'Bangers',
          fontSize: 13,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'CUARTEL',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'HABLAR',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'METAS',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎯" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="ranks"
        options={{
          title: 'RANGO',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏅" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
