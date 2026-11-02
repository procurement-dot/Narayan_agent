import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { emailStyles } from '../styles/email.styles';

interface EmailSummaryCardProps {
  requestsCount?: number;
  lowSignalCount?: number;
  onReviewActions?: () => void;
}

export const EmailSummaryCard: React.FC<EmailSummaryCardProps> = ({
  requestsCount = 3,
  lowSignalCount = 1,
  onReviewActions,
}) => {
  return (
    <Card soft>
      <Text style={emailStyles.summaryKicker}>NRYN EMAIL INTELLIGENCE</Text>
      <Text style={emailStyles.summaryText}>
        {requestsCount} requests identified · {lowSignalCount} low-signal email · two meeting sources merged.
      </Text>
      <TouchableOpacity
        style={emailStyles.reviewBtn}
        activeOpacity={0.8}
        onPress={onReviewActions}
      >
        <Text style={emailStyles.reviewBtnText}>Review actions</Text>
      </TouchableOpacity>
    </Card>
  );
};
