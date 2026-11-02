import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigationStore } from '../navigation/navigation.store';
import { useChatStore } from './chat.store';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';

const SUGGESTED_CHIPS = [
  'Review my day',
  'What emails need me?',
  'Health & training update',
  'Open commitments',
];

export const AskNrynSheet: React.FC = () => {
  const { isChatOpen, closeChat } = useNavigationStore();
  const { messages, inputText, setInputText, sendMessage } = useChatStore();

  if (!isChatOpen) return null;

  return (
    <Modal
      visible={isChatOpen}
      transparent
      animationType="slide"
      onRequestClose={closeChat}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={closeChat}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>ASK NRYN</Text>
                <Text style={styles.headerSubtitle}>A quiet space to think clearly.</Text>
              </View>
              <TouchableOpacity onPress={closeChat} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.messagesScroll}
              contentContainerStyle={styles.messagesContent}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((m) => {
                const isUser = m.sender === 'user';
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.messageBubble,
                      isUser ? styles.userBubble : styles.nrynBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isUser ? styles.userText : styles.nrynText,
                      ]}
                    >
                      {m.text}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        isUser ? styles.userTime : styles.nrynTime,
                      ]}
                    >
                      {m.timestamp}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.chipsRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {SUGGESTED_CHIPS.map((chip, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.chip}
                    onPress={() => sendMessage(chip)}
                  >
                    <Text style={styles.chipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="What's on your mind?"
                placeholderTextColor={colors.muted}
                returnKeyType="send"
                onSubmitEditing={() => sendMessage(inputText)}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim()}
              >
                <Text style={styles.sendButtonText}>➔</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.disclaimer}>
              Demo conversation · No external AI tokens consumed
            </Text>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    maxHeight: '80%',
    minHeight: '60%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderDark,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.muted,
    marginTop: 2,
  },
  closeBtn: {
    fontSize: 16,
    color: colors.ink,
    padding: 4,
  },
  messagesScroll: {
    flex: 1,
    marginVertical: spacing.sm,
  },
  messagesContent: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.lg,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  nrynBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: typography.bodySm.fontSize,
    fontFamily: typography.fontFamily.uiRegular,
    lineHeight: 19,
  },
  userText: {
    color: '#ffffff',
  },
  nrynText: {
    color: colors.ink,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  nrynTime: {
    color: colors.muted,
  },
  chipsRow: {
    marginBottom: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.inkSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: typography.bodySm.fontSize,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  disclaimer: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
