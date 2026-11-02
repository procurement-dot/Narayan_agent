import React from 'react';
import { Text } from 'react-native';
import { emailStyles } from '../styles/email.styles';

export const TrustFooter: React.FC = () => {
  return (
    <Text style={emailStyles.trustText}>
      Demonstration data only · Not connected to WhatsApp, email, Garmin, banks or your phone. Proposed external actions require your review and permission.
    </Text>
  );
};
