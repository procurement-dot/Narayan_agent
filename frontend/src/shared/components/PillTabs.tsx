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
}

export function PillTabs<T extends string = string>({
  tabs,
  activeTab,
  onSelectTab,
  onSelect,
}: PillTabsProps<T>) {
  const handleSelect = onSelectTab || onSelect;

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
              style={[styles.pill, isSelected && styles.pillSelected]}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
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
});
