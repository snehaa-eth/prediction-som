import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radii, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  visible: boolean;
  prediction: 'YES' | 'NO';
  amount: number;
  estimatedPayout: number;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmationSheet: React.FC<Props> = ({
  visible, prediction, amount, estimatedPayout, onConfirm, onClose,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const fee = amount * 0.02; // 2% contract fee
  const isYes = prediction === 'YES';
  const multiplier = (estimatedPayout / amount).toFixed(1);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.cardBg, borderColor: theme.border, paddingBottom: Math.max(insets.bottom, 40) }]} onPress={e => e.stopPropagation()}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          {/* Gamified header */}
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Confirm Trade</Text>
            <View style={[styles.multiplierBadge, { backgroundColor: 'rgba(196,149,106,0.12)' }]}>
              <Text style={[styles.multiplierText, { color: theme.accent }]}>{multiplier}x</Text>
            </View>
          </View>

          <View style={[styles.predictionBadge, {
            borderColor: isYes ? theme.accent : theme.textSecondary,
            backgroundColor: isYes ? 'rgba(196,149,106,0.08)' : theme.secondaryBg,
          }]}>
            <Text style={[styles.predictionText, { color: isYes ? theme.accent : theme.textPrimary }]}>
              {prediction}
            </Text>
          </View>

          <View style={[styles.details, { backgroundColor: theme.secondaryBg }]}>
            {[
              ['Prediction', prediction, isYes ? theme.accent : theme.textPrimary],
              ['Amount', `${amount} TFY`, theme.textPrimary],
              ['Est. Payout', `${estimatedPayout.toFixed(1)} TFY`, theme.accent],
              ['Fee (2%)', `${fee.toFixed(1)} TFY`, theme.textSecondary],
            ].map(([label, value, color], i, arr) => (
              <React.Fragment key={label as string}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
                  <Text style={[styles.detailValue, { color: color as string }]}>{value}</Text>
                </View>
                {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
              </React.Fragment>
            ))}
          </View>

          <Pressable style={[styles.confirmButton, { backgroundColor: theme.accent, shadowColor: theme.accent }]} onPress={onConfirm}>
            <Text style={[styles.confirmButtonText, { color: '#0A0A0A' }]}>Sign & Confirm</Text>
          </Pressable>
          <Text style={[styles.walletHint, { color: theme.textSecondary }]}>
            Your wallet will open to sign this transaction
          </Text>

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radii.bottomSheet, borderTopRightRadius: radii.bottomSheet, padding: spacing.xl, paddingBottom: 40, minHeight: 420, borderWidth: 1, borderBottomWidth: 0 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  multiplierBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  multiplierText: { fontSize: 14, fontWeight: '800' },
  predictionBadge: { alignSelf: 'center', paddingHorizontal: 28, paddingVertical: 12, borderRadius: radii.button, borderWidth: 2, marginBottom: 24 },
  predictionText: { fontSize: 30, fontWeight: '800', letterSpacing: 4 },
  details: { borderRadius: radii.button, padding: spacing.lg, marginBottom: 24 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  detailLabel: { fontSize: 14, fontWeight: '400' },
  detailValue: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1 },
  confirmButton: { height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  confirmButtonText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  walletHint: { fontSize: 11, textAlign: 'center', marginBottom: 8 },
  cancelButton: { height: 48, justifyContent: 'center', alignItems: 'center' },
  cancelButtonText: { fontSize: 15, fontWeight: '400' },
});
