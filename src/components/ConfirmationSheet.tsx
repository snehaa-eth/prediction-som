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
  visible,
  prediction,
  amount,
  estimatedPayout,
  onConfirm,
  onClose,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const fee = amount * 0.007;
  const isYes = prediction === 'YES';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.cardBg, borderColor: theme.border, paddingBottom: Math.max(insets.bottom, 40) }]} onPress={e => e.stopPropagation()}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <Text style={[styles.title, { color: theme.textPrimary }]}>Confirm Trade</Text>

          <View style={[styles.predictionBadge, { borderColor: isYes ? theme.accent : theme.textSecondary, backgroundColor: theme.secondaryBg }]}>
            <Text style={[styles.predictionText, { color: isYes ? theme.accent : theme.textPrimary }]}>
              {prediction}
            </Text>
          </View>

          <View style={[styles.details, { backgroundColor: theme.secondaryBg }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Prediction</Text>
              <Text style={[styles.detailValue, { color: isYes ? theme.accent : theme.textPrimary }]}>
                {prediction}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Amount</Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>${amount.toFixed(2)}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Estimated Payout</Text>
              <Text style={[styles.detailValue, { color: theme.accent }]}>
                ${estimatedPayout.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Fees (0.7%)</Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>${fee.toFixed(2)}</Text>
            </View>
          </View>

          <Pressable style={[styles.confirmButton, { backgroundColor: theme.accent, shadowColor: theme.accent }]} onPress={onConfirm}>
            <Text style={styles.confirmButtonText}>Confirm Trade</Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radii.bottomSheet,
    borderTopRightRadius: radii.bottomSheet,
    padding: spacing.xl,
    paddingBottom: 40,
    minHeight: 420,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  predictionBadge: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: radii.button,
    borderWidth: 2,
    marginBottom: 24,
  },
  predictionText: {
    fontSize: 28,
    fontWeight: '700',
  },
  details: {
    borderRadius: radii.button,
    padding: spacing.lg,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '400',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
  },
  confirmButton: {
    height: 52,
    borderRadius: radii.button,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '400',
  },
});
