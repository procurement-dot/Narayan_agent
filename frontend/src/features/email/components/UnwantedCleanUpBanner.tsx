import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { TOKENS } from '../../../shared/theme/tokens';
import { useEmailUiStore } from '../store/emailUi.store';
import { useToast } from '../../../shared/components/Toast';

interface UnwantedCleanUpBannerProps {
  unwantedCount: number;
  allUnwantedIds: string[];
}

export const UnwantedCleanUpBanner: React.FC<UnwantedCleanUpBannerProps> = ({
  unwantedCount,
  allUnwantedIds,
}) => {
  const {
    selectedUnwantedIds,
    selectAllUnwanted,
    clearSelectedUnwanted,
    trashSelectedUnwanted,
    isLoading,
  } = useEmailUiStore();
  const { showToast } = useToast();

  const isAllSelected =
    allUnwantedIds.length > 0 && selectedUnwantedIds.length === allUnwantedIds.length;
  const selectedCount = selectedUnwantedIds.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      clearSelectedUnwanted();
    } else {
      selectAllUnwanted(allUnwantedIds);
    }
  };

  const executeDelete = async () => {
    try {
      showToast(`Moving ${selectedCount} emails to Gmail Trash...`, 'info');
      const res = await trashSelectedUnwanted();
      if (res.success) {
        showToast(
          `Successfully moved ${res.deletedCount} email${res.deletedCount > 1 ? 's' : ''} to Trash!`,
          'success'
        );
      }
    } catch {
      showToast('Failed to delete emails', 'warning');
    }
  };

  const confirmDelete = () => {
    if (selectedCount === 0) {
      showToast('Please select at least one email to delete', 'warning');
      return;
    }

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined'
        ? window.confirm(`Are you sure you want to move ${selectedCount} unwanted email${selectedCount > 1 ? 's' : ''} to Gmail Trash?`)
        : true;
      if (ok) {
        executeDelete();
      }
      return;
    }

    Alert.alert(
      'Delete Unwanted Emails?',
      `Are you sure you want to move ${selectedCount} unwanted email${selectedCount > 1 ? 's' : ''} to Gmail Trash?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Delete (${selectedCount})`,
          style: 'destructive',
          onPress: executeDelete,
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>🤖 AI CLEAN-UP ASSISTANT</Text>
        </View>
        <Text style={styles.countText}>{unwantedCount} detected</Text>
      </View>

      <Text style={styles.title}>Review & Clean Junk Emails</Text>
      <Text style={styles.description}>
        AI analyzed your inbox and flagged promotional sales, automated newsletters, and bulk marketing noise.
      </Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.selectBtn}
          onPress={handleToggleSelectAll}
          activeOpacity={0.7}
        >
          <Text style={styles.selectBtnText}>
            {isAllSelected ? 'Deselect All' : `Select All (${allUnwantedIds.length})`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.deleteBtn,
            selectedCount === 0 && styles.deleteBtnDisabled,
          ]}
          onPress={confirmDelete}
          disabled={selectedCount === 0 || isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteBtnText}>
            {isLoading ? 'Deleting...' : `Delete Selected (${selectedCount}) 🗑`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8e6dc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagBadge: {
    backgroundColor: '#fbe8e8',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b91c1c',
    letterSpacing: 0.5,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#828982',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: TOKENS.colors.ink,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#6e776e',
    lineHeight: 17,
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d3d8d3',
    backgroundColor: '#faf9f5',
  },
  selectBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#414941',
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#c0392b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnDisabled: {
    backgroundColor: '#e6a19b',
  },
  deleteBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
