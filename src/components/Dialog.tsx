/**
 * Diálogo propio con el diseño dark — reemplaza el Alert nativo (feo, blanco).
 *
 * Uso imperativo, casi drop-in de Alert.alert:
 *   const { show } = useDialog();
 *   show({ title: '¡Recluta!', message: '...', buttons: [{ text: 'Entendido' }] });
 *
 * Monta <DialogProvider> una vez en el root layout.
 */
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { DARK, FONTS, RADIUS, accentGlow } from '../constants/theme';

export interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface DialogConfig {
  title: string;
  message?: string;
  buttons?: DialogButton[];
  /** color de acento del botón principal (default lima) */
  accent?: string;
  /** emoji opcional grande arriba */
  icon?: string;
}

interface DialogApi {
  show: (config: DialogConfig) => void;
  hide: () => void;
}

const DEFAULT_ACCENT = '#C6FF4A';
const DialogContext = createContext<DialogApi | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DialogConfig | null>(null);

  const show = useCallback((c: DialogConfig) => setConfig(c), []);
  const hide = useCallback(() => setConfig(null), []);

  const buttons = config?.buttons?.length ? config.buttons : [{ text: 'OK' }];
  const accent = config?.accent ?? DEFAULT_ACCENT;
  const stacked = buttons.length > 2;

  return (
    <DialogContext.Provider value={{ show, hide }}>
      {children}
      <Modal visible={!!config} transparent animationType="fade" onRequestClose={hide} statusBarTranslucent>
        <Pressable
          onPress={hide}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 28 }}
        >
          {/* Pressable interno para no cerrar al tocar la tarjeta */}
          <Pressable
            onPress={() => {}}
            style={[
              {
                width: '100%',
                maxWidth: 360,
                backgroundColor: DARK.surface,
                borderRadius: RADIUS.xl,
                borderWidth: 1,
                borderColor: DARK.hairlineStrong,
                padding: 22,
              },
              accentGlow(accent, 2),
            ]}
          >
            {config?.icon ? (
              <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 6 }}>{config.icon}</Text>
            ) : null}

            <Text style={{ fontFamily: FONTS.display, fontSize: 26, color: DARK.text, letterSpacing: 0.8, marginBottom: config?.message ? 8 : 16 }}>
              {config?.title}
            </Text>

            {config?.message ? (
              <Text style={{ fontFamily: FONTS.body, fontSize: 15, color: DARK.textDim, lineHeight: 22, marginBottom: 18 }}>
                {config.message}
              </Text>
            ) : null}

            <View style={{ flexDirection: stacked ? 'column' : 'row', gap: 10, justifyContent: 'flex-end' }}>
              {buttons.map((b, i) => {
                const destructive = b.style === 'destructive';
                const cancel = b.style === 'cancel';
                const filled = !destructive && !cancel;
                return (
                  <Pressable
                    key={`${b.text}-${i}`}
                    onPress={() => {
                      hide();
                      b.onPress?.();
                    }}
                    style={[
                      {
                        paddingVertical: 12,
                        paddingHorizontal: 18,
                        borderRadius: RADIUS.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 48,
                        flex: stacked ? undefined : filled ? 1 : undefined,
                        backgroundColor: filled ? accent : 'transparent',
                        borderWidth: cancel || destructive ? 1 : 0,
                        borderColor: destructive ? '#FF5A65' : DARK.hairlineStrong,
                      },
                      filled ? accentGlow(accent, 1) : null,
                    ]}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.bodyBold,
                        fontSize: 15,
                        color: filled ? '#0B0E13' : destructive ? '#FF5A65' : DARK.textDim,
                      }}
                    >
                      {b.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog debe usarse dentro de <DialogProvider>');
  return ctx;
}
