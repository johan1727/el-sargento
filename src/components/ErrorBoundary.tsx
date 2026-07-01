/**
 * Última red de seguridad: si algo truena en el árbol de React, mostramos una
 * pantalla en personaje en vez de dejar la app en blanco. Debe ser class
 * component — es el único mecanismo de React para capturar errores de render.
 */
import { Component, type ReactNode } from 'react';
import { Text, View, Pressable } from 'react-native';
import { DARK, FONTS, RADIUS, accentGlow } from '../constants/theme';
import { t } from '../i18n';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

const ACCENT = '#C6FF4A';

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    if (__DEV__) console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={{ flex: 1, backgroundColor: DARK.bg, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <Text style={{ fontSize: 56, marginBottom: 8 }}>🪖</Text>
        <Text style={{ fontFamily: FONTS.display, fontSize: 28, color: DARK.text, letterSpacing: 1, textAlign: 'center' }}>
          {t('errors.crashTitle')}
        </Text>
        <Text style={{ fontFamily: FONTS.body, fontSize: 15, color: DARK.textDim, textAlign: 'center', marginTop: 10, marginBottom: 24, lineHeight: 21 }}>
          {t('errors.crashBody')}
        </Text>
        <Pressable
          onPress={this.handleRetry}
          accessibilityRole="button"
          accessibilityLabel={t('errors.crashRetry')}
          style={[
            {
              backgroundColor: ACCENT,
              paddingVertical: 16,
              paddingHorizontal: 28,
              borderRadius: RADIUS.md,
              minHeight: 52,
              justifyContent: 'center',
            },
            accentGlow(ACCENT, 1),
          ]}
        >
          <Text style={{ fontFamily: FONTS.display, fontSize: 18, color: '#0B0E13', letterSpacing: 1 }}>
            {t('errors.crashRetry')}
          </Text>
        </Pressable>
      </View>
    );
  }
}
