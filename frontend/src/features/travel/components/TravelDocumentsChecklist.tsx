import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useToast } from '../../../shared/components/Toast';
import { typography, colors, radii, spacing } from '../../../shared/theme/tokens';
import { useTravelStore } from '../travel.store';

const DEFAULT_MEMBERS = [
  { name: 'Self', icon: '◎' },
  { name: 'Neha', icon: '✿' },
  { name: 'Prayan', icon: '✦' },
];

const CHECKLIST_ITEMS = [
  'Passport',
  'Visa / entry rules',
  'Travel insurance',
  'Photograph',
  'Itinerary',
  'Supporting documents',
];

interface AttachedDoc {
  person: string;
  kind: string;
  file: string;
  date: string;
}

export const TravelDocumentsChecklist: React.FC = () => {
  const { documents, openModal } = useTravelStore();
  const { showToast } = useToast();

  const [members, setMembers] = useState(DEFAULT_MEMBERS);
  const [activeMember, setActiveMember] = useState('Self');
  const [attachedDocs, setAttachedDocs] = useState<AttachedDoc[]>([]);

  // Add Member modal state
  const [isAddMemberVisible, setIsAddMemberVisible] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  // Check if an item is attached (either via local attached state or backend documents)
  const getAttachedFile = (person: string, kind: string): string | null => {
    // 1. Check local attachments
    const local = attachedDocs.find(
      (d) => d.person.toLowerCase() === person.toLowerCase() && d.kind === kind
    );
    if (local) return local.file;

    // 2. Check backend documents (e.g. Passport, Visa, Insurance)
    const backendDoc = documents.find((doc) => {
      const matchPerson = doc.familyMember.toLowerCase() === person.toLowerCase();
      if (!matchPerson) return false;

      if (kind === 'Passport' && doc.docType === 'passport') return true;
      if (kind === 'Visa / entry rules' && doc.docType === 'visa') return true;
      if (kind === 'Travel insurance' && doc.docType === 'insurance') return true;
      return false;
    });

    if (backendDoc) {
      return backendDoc.docNumberMasked
        ? `${backendDoc.docTitle} (${backendDoc.docNumberMasked})`
        : backendDoc.docTitle;
    }

    return null;
  };

  const handleItemPress = (kind: string) => {
    const existingFile = getAttachedFile(activeMember, kind);

    if (existingFile) {
      showToast(`${kind} is already indexed: ${existingFile}`, 'info');
      return;
    }

    // In web, trigger file input if available
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const fileInput = document.getElementById('n69-travel-file') as HTMLInputElement | null;
      if (fileInput) {
        fileInput.onchange = (e: any) => {
          const file = e.target?.files?.[0];
          if (file) {
            setAttachedDocs((prev) => [
              ...prev,
              {
                person: activeMember,
                kind,
                file: file.name,
                date: new Date().toISOString().split('T')[0],
              },
            ]);
            showToast('File name indexed · content not uploaded or analysed', 'success');
          }
        };
        fileInput.click();
        return;
      }
    }

    // Default simulation (exact matching index.html behavior)
    const simulatedFileName = `${activeMember}_${kind.replace(/[^a-zA-Z0-9]/g, '_')}_scan.pdf`;
    setAttachedDocs((prev) => [
      ...prev,
      {
        person: activeMember,
        kind,
        file: simulatedFileName,
        date: new Date().toISOString().split('T')[0],
      },
    ]);
    showToast('File name indexed · content not uploaded or analysed', 'success');
  };

  const handleAddMember = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) {
      showToast('Please enter a member name', 'warning');
      return;
    }

    if (members.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast('Member already exists', 'info');
      setActiveMember(trimmed);
      setIsAddMemberVisible(false);
      setNewMemberName('');
      return;
    }

    const icons = ['❀', '♧', '★', '◇', '✿'];
    const assignedIcon = icons[members.length % icons.length];

    const updated = [...members, { name: trimmed, icon: assignedIcon }];
    setMembers(updated);
    setActiveMember(trimmed);
    setIsAddMemberVisible(false);
    setNewMemberName('');
    showToast(`Added ${trimmed} to family travel documents`, 'success');
  };

  return (
    <View style={styles.container}>
      {/* 1. Documents Section Title (Exact match to index.html .n69-section-title) */}
      <Text style={styles.sectionTitle}>Documents</Text>

      {/* 2. People Tiles Grid (Exact match to index.html .n69-people-tiles) */}
      <View style={styles.peopleTiles}>
        {members.map((member) => {
          const isSelected = member.name === activeMember;
          return (
            <TouchableOpacity
              key={member.name}
              style={[styles.personTile, isSelected && styles.personTileSelected]}
              onPress={() => setActiveMember(member.name)}
              activeOpacity={0.7}
            >
              <Text style={[styles.personIcon, isSelected && styles.personIconSelected]}>
                {member.icon}
              </Text>
              <Text
                style={[styles.personName, isSelected && styles.personNameSelected]}
                numberOfLines={1}
              >
                {member.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Add Member Tile */}
        <TouchableOpacity
          style={styles.personTile}
          onPress={() => setIsAddMemberVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.personIcon}>＋</Text>
          <Text style={styles.personName} numberOfLines={1}>
            Add member
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Member Checklist Section Title */}
      <Text style={styles.sectionTitle}>{activeMember} · Checklist</Text>

      {/* 4. Checklist Items (Exact match to index.html .n69-checklist) */}
      <View style={styles.checklist}>
        {CHECKLIST_ITEMS.map((item, index) => {
          const attachedFile = getAttachedFile(activeMember, item);
          const isAttached = !!attachedFile;

          return (
            <TouchableOpacity
              key={index}
              style={styles.checklistItem}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.65}
            >
              {/* Checkmark circle */}
              <View
                style={[
                  styles.checkMarkCircle,
                  isAttached && styles.checkMarkCircleAttached,
                ]}
              >
                <Text
                  style={[
                    styles.checkMarkIcon,
                    isAttached && styles.checkMarkIconAttached,
                  ]}
                >
                  {isAttached ? '✓' : '＋'}
                </Text>
              </View>

              {/* Title & Subtitle */}
              <View style={styles.checkItemCopy}>
                <Text style={styles.checkItemTitle}>{item}</Text>
                <Text
                  style={[
                    styles.checkItemSub,
                    isAttached && styles.checkItemSubAttached,
                  ]}
                >
                  {isAttached ? attachedFile : 'Not uploaded in this demo'}
                </Text>
              </View>

              {/* Right document icon: ▤ */}
              <Text style={styles.docGlyph}>▤</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hidden file input for web */}
      {Platform.OS === 'web' && (
        <input
          id="n69-travel-file"
          type="file"
          accept="image/*,.pdf"
          style={{ display: 'none' }}
        />
      )}

      {/* Add Member Modal (Matches index.html sheet('Add family member')) */}
      <Modal
        visible={isAddMemberVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddMemberVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add family member</Text>
            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newMemberName}
              onChangeText={setNewMemberName}
              placeholder="Actual name (e.g. Sulbha, Girish)"
              placeholderTextColor="#9aaba0"
              autoFocus
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setIsAddMemberVisible(false);
                  setNewMemberName('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleAddMember}
              >
                <Text style={styles.modalSaveText}>Add person</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 2,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#28362c',
    marginBottom: 12,
    marginTop: 6,
    letterSpacing: -0.3,
  },
  // 4-column People Tiles matching .n69-people-tiles
  peopleTiles: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  personTile: {
    flex: 1,
    backgroundColor: '#f0f1ee', // exact background from index.html
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 76,
  },
  personTileSelected: {
    backgroundColor: '#dce9dd', // exact green selected background from index.html
  },
  personIcon: {
    fontSize: 22,
    color: '#58715f',
    marginBottom: 6,
  },
  personIconSelected: {
    color: '#284633',
  },
  personName: {
    fontSize: 11,
    color: '#58715f',
    fontWeight: '500',
    textAlign: 'center',
  },
  personNameSelected: {
    color: '#284633',
    fontWeight: '700',
  },
  // Checklist matching .n69-checklist
  checklist: {
    marginBottom: 20,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ebe5', // exact border from index.html
    gap: 14,
  },
  checkMarkCircle: {
    width: 33,
    height: 33,
    borderRadius: 16.5,
    backgroundColor: '#e3ede3', // exact background from .n69-check-mark
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkCircleAttached: {
    backgroundColor: '#dce9dd',
  },
  checkMarkIcon: {
    fontSize: 16,
    color: '#799785', // exact color from .n69-check-mark
    fontWeight: '700',
  },
  checkMarkIconAttached: {
    color: '#385e43',
    fontWeight: '800',
  },
  checkItemCopy: {
    flex: 1,
  },
  checkItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#28362c',
    lineHeight: 18,
  },
  checkItemSub: {
    fontSize: 10,
    color: '#9aaba0', // exact color from index.html
    marginTop: 4,
    lineHeight: 14,
  },
  checkItemSubAttached: {
    color: '#496c53',
    fontWeight: '500',
  },
  docGlyph: {
    fontSize: 16,
    color: '#63816e',
    letterSpacing: -1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#28362c',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c8474',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#f7faf8',
    borderWidth: 1,
    borderColor: '#dbe5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#28362c',
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dce6dc',
  },
  modalCancelText: {
    fontSize: 13,
    color: '#556b5a',
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#47624f',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  modalSaveText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '700',
  },
});
