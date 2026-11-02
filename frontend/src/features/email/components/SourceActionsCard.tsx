import React from 'react';
import { Text, View } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { emailStyles } from '../styles/email.styles';

const ACTIONS = [
  {
    icon: '↳',
    title: 'Turn email into a task',
    desc: 'Show exact sentence, responsible party and inferred due time',
  },
  {
    icon: '▦',
    title: 'Prepare meetings',
    desc: 'Find previous minutes, attachment references and joining links',
  },
  {
    icon: '✎',
    title: 'Draft replies',
    desc: 'Editable drafts remain unsent until explicit approval',
  },
  {
    icon: '⌫',
    title: 'Declutter carefully',
    desc: 'Suggest archiving newsletters; never delete without approval',
  },
];

export const SourceActionsCard: React.FC = () => {
  return (
    <Card>
      <Text style={emailStyles.explainerTitle}>Source-aware actions</Text>
      {ACTIONS.map((item, index) => {
        const isLast = index === ACTIONS.length - 1;
        return (
          <View
            key={item.title}
            style={[
              emailStyles.explainerRow,
              isLast && emailStyles.explainerRowLast,
            ]}
          >
            <View style={emailStyles.iconTile}>
              <Text style={emailStyles.iconText}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={emailStyles.explainerRowTitle}>{item.title}</Text>
              <Text style={emailStyles.explainerRowDesc}>{item.desc}</Text>
            </View>
          </View>
        );
      })}
    </Card>
  );
};
