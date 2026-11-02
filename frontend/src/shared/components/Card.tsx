import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { TOKENS } from '../theme/tokens';

interface CardProps extends ViewProps {
  soft?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, soft, ...props }) => {
  return (
    <View
      style={[
        styles.card,
        soft && styles.soft,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: TOKENS.colors.paper,
    borderWidth: 1,
    borderColor: TOKENS.colors.line,
    borderRadius: TOKENS.radius.card,
    padding: 17,
    marginBottom: 12,
  },
  soft: {
    backgroundColor: TOKENS.colors.sageWash,
  },
});
