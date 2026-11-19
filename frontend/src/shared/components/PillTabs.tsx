import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TOKENS } from '../theme/tokens';
import { FONTS } from '../theme/fonts';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
}

export interface PillTabsProps<T extends string = string> {
  tabs: readonly TabItem<T>[];
  activeTab: T;
  onSelectTab?: (tabId: T) => void;
  onSelect?: (tabId: T) => void;
  variant?: 'classic' | 'pastel';
}

export function PillTabs<T extends string = string>({
  tabs,
  activeTab,
  onSelectTab,
  onSelect,
  variant = 'classic',
}: PillTabsProps<T>) {
  const handleSelect = onSelectTab || onSelect;
  const isPastel = variant === 'pastel';

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isSelected = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.8}
              onPress={() => handleSelect?.(tab.id)}
              style={[
                isPastel ? styles.pillPastel : styles.pill,
                isSelected && (isPastel ? styles.pillPastelSelected : styles.pillSelected),
              ]}
            >
              <Text
                style={[
                  isPastel ? styles.pillPastelText : styles.pillText,
                  isSelected && (isPastel ? styles.pillPastelTextSelected : styles.pillTextSelected),
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  scrollContent: {
    gap: 8,
    paddingHorizontal: 2,
  },
  pill: {
    borderWidth: 1,
    borderColor: TOKENS.colors.tabBorder,
    backgroundColor: TOKENS.colors.paper,
    borderRadius: TOKENS.radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  pillSelected: {
    backgroundColor: TOKENS.colors.tabSelectedBg,
    borderColor: TOKENS.colors.tabSelectedBg,
  },
  pillText: {
    fontSize: TOKENS.typography.titleSize,
    color: TOKENS.colors.rowTitle,
    fontWeight: '500',
    fontFamily: FONTS.regular,
  },
  pillTextSelected: {
    color: TOKENS.colors.paper,
    fontWeight: '600',
  },
  // Exact match to index.html .n68-tabs button & .n68-tabs button.active
  pillPastel: {
    borderWidth: 1,
    borderColor: '#e1e7df',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  pillPastelSelected: {
    backgroundColor: '#dfe9df',
    borderColor: '#aabfac',
  },
  pillPastelText: {
    fontSize: 12,
    color: '#718375',
    fontWeight: '500',
  },
  pillPastelTextSelected: {
    color: '#31463a',
    fontWeight: '600',
  },
});
