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
}

export const EmailRow: React.FC<EmailRowProps> = ({
  email,
  statusOverride,
  isLast,
  onOpen,
}) => {
  const icon = KIND_ICONS[email.kind] || '✉';
  const kindLabel = KIND_LABELS[email.kind] || 'Action candidate';
  const displayStatus = statusOverride || email.time;

  return (
    <View style={[emailStyles.rowItem, isLast && emailStyles.rowItemLast]}>
      <View style={emailStyles.iconTile}>
        <Text style={emailStyles.iconText}>{icon}</Text>
      </View>

      <View style={emailStyles.rowMain}>
        <Text style={emailStyles.rowSubject} numberOfLines={2}>
          {email.subject}
        </Text>
        <Text style={emailStyles.rowPreview} numberOfLines={1}>
          {email.name} · {email.preview}
        </Text>
        <Text style={emailStyles.rowStatus}>
          {displayStatus} · {kindLabel}
        </Text>
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
