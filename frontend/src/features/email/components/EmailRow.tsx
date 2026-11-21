import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { KIND_ICONS, KIND_LABELS } from '../constants';
import { emailStyles } from '../styles/email.styles';
import { EmailItem } from '../types/email.types';

interface EmailRowProps {
  email: EmailItem;
  statusOverride?: string;
  isLast?: boolean;
  onOpen: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export const EmailRow: React.FC<EmailRowProps> = ({
  email,
  statusOverride,
  isLast,
  onOpen,
  isSelectable,
  isSelected,
  onToggleSelect,
}) => {
  const icon = KIND_ICONS[email.kind] || '✉';
  const kindLabel = KIND_LABELS[email.kind] || 'Action candidate';
  const displayStatus = statusOverride || email.time;

  return (
    <View style={[emailStyles.rowItem, isLast && emailStyles.rowItemLast]}>
      {isSelectable ? (
        <TouchableOpacity
          onPress={onToggleSelect}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: isSelected ? '#c0392b' : '#9ca3af',
            backgroundColor: isSelected ? '#c0392b' : '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
          }}
          activeOpacity={0.7}
        >
          {isSelected && (
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>✓</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={emailStyles.iconTile}>
          <Text style={emailStyles.iconText}>{icon}</Text>
        </View>
      )}

      <View style={emailStyles.rowMain}>
        <Text style={emailStyles.rowSubject} numberOfLines={2}>
          {email.subject}
        </Text>
        <Text style={emailStyles.rowPreview} numberOfLines={1}>
          {email.name} · {email.preview}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 4 }}>
          {email.unwantedReason && (
            <View style={{ backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#fecaca' }}>
              <Text style={{ fontSize: 10, color: '#dc2626', fontWeight: '700' }}>
                🗑 {email.unwantedReason}
              </Text>
            </View>
          )}
          {email.accountEmail && (
            <View style={emailStyles.accountBadge}>
              <Text style={emailStyles.accountBadgeText}>
                📥 {email.accountEmail.split('@')[0]}
              </Text>
            </View>
          )}
          <Text style={emailStyles.rowStatus}>
            {displayStatus} · {kindLabel}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={emailStyles.openBtn}
        onPress={onOpen}
        activeOpacity={0.7}
      >
        <Text style={emailStyles.openBtnText}>Open ↗</Text>
      </TouchableOpacity>
    </View>
  );
};
