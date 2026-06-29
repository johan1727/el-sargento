import { Stack } from 'expo-router';
import { DARK } from '../../src/constants/theme';

export default function LegalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: DARK.bg },
      }}
    />
  );
}
