import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput as RNTextInput,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../ThemeContext';
import { radii, spacing, shadows } from '../../theme';
import {
  getCommunityShelf,
  addCommunityShelfItem,
  deductCommunityShelf,
  addCommunityShelfStock,
  deleteCommunityShelfItem,
} from '../../db/sqlite';
import { importInventory } from '../../db/csvImporter';
import { INVENTORY_CSV } from '../../db/csvSeeds';
import type { InventoryItem } from '../../db/types';

// Master drug list from the 57 essential medicines CSV
const MASTER_MEDICINES = importInventory(INVENTORY_CSV);

interface AdjustModalState {
  item: InventoryItem;
  mode: 'add' | 'deduct';
}

export const VillageMedicineShelf: React.FC = () => {
  const { i18n } = useTranslation();
  const { colors, mode } = useAppTheme();
  const isLg = i18n.language === 'lg';

  const [shelfItems, setShelfItems] = useState<InventoryItem[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [adjustModal, setAdjustModal] = useState<AdjustModalState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<InventoryItem | null>(null);
  const [customQty, setCustomQty] = useState('');
  const [adjustAmt, setAdjustAmt] = useState('');

  const filteredMaster = MASTER_MEDICINES.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !shelfItems.some((s) => s.name.toLowerCase() === m.name.toLowerCase())
  );

  const loadShelf = useCallback(async () => {
    try {
      const data = await getCommunityShelf();
      setShelfItems(data);
    } catch (e) {
      console.error('Failed to load community shelf', e);
    }
  }, []);

  useEffect(() => {
    loadShelf();
  }, [loadShelf]);

  const handleAddToShelf = async () => {
    if (!selectedMedicine) {
      Alert.alert(isLg ? 'Londa Eddagala' : 'Select Medicine', isLg ? 'Sooka londa eddagala' : 'Please select a medicine first.');
      return;
    }
    const qty = parseInt(customQty, 10);
    if (isNaN(qty) || qty < 0) {
      Alert.alert(isLg ? 'Omuwendo Omulabika' : 'Invalid Amount', isLg ? 'Yingiza omuwendo omulungi' : 'Enter a valid positive quantity.');
      return;
    }
    try {
      await addCommunityShelfItem({
        name: selectedMedicine.name,
        quantity: qty,
        unit: selectedMedicine.unit,
        minimumThreshold: selectedMedicine.minimumThreshold,
      });
      setAddModalVisible(false);
      setSelectedMedicine(null);
      setSearchQuery('');
      setCustomQty('');
      await loadShelf();
    } catch (e) {
      console.error('Failed to add shelf item', e);
    }
  };

  const handleAdjust = async () => {
    if (!adjustModal) return;
    const amount = parseInt(adjustAmt, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(isLg ? 'Omuwendo Omulabika' : 'Invalid Amount', isLg ? 'Yingiza omuwendo omulungi' : 'Enter a valid positive number.');
      return;
    }
    if (adjustModal.mode === 'add') {
      await addCommunityShelfStock(adjustModal.item.id, amount);
    } else {
      await deductCommunityShelf(adjustModal.item.id, amount);
    }
    setAdjustModal(null);
    setAdjustAmt('');
    await loadShelf();
  };

  const handleDelete = (item: InventoryItem) => {
    Alert.alert(
      isLg ? 'Gyako ku Ssanduuko' : 'Remove from Shelf',
      isLg ? `Oyagala okuggyako ${item.name} ku ssanduuko yo?` : `Remove ${item.name} from your medicine shelf?`,
      [
        { text: isLg ? 'Nedda' : 'Cancel', style: 'cancel' },
        {
          text: isLg ? 'Gyako' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteCommunityShelfItem(item.id);
            await loadShelf();
          },
        },
      ]
    );
  };

  const getStockPercent = (item: InventoryItem): number => {
    if (item.minimumThreshold === 0) return 100;
    const ratio = item.quantity / (item.minimumThreshold * 2);
    return Math.min(Math.round(ratio * 100), 100);
  };

  const getStockColor = (item: InventoryItem): string => {
    const pct = getStockPercent(item);
    if (pct <= 25) return '#C53030'; // red - critical
    if (pct <= 60) return '#D69E2E'; // amber - low
    return '#38A169'; // green - good
  };

  const isDark = mode === 'dark';
  const cardBg = isDark ? colors.surface : '#FFFFFF';
  const sectionBg = isDark ? colors.neutral[50] : '#F7FAFC';

  return (
    <View style={[styles.container, { backgroundColor: sectionBg, borderColor: isDark ? colors.neutral[200] : '#E2E8F0' }]}>
      {/* HEADER */}
      <View style={styles.shelfHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerIconWrap, { backgroundColor: '#EBF4FF' }]}>
            <Icon source="pill" size={22} color={colors.primary[900]} />
          </View>
          <View>
            <Text style={[styles.shelfTitle, { color: colors.neutral[900] }]}>
              {isLg ? 'Ssanduuko Yange y\'Eddagala' : 'My Medicine Shelf'}
            </Text>
            <Text style={[styles.shelfSub, { color: colors.neutral[500] }]}>
              {isLg ? `Ebirabo ${shelfItems.length} byali ku ssanduuko` : `${shelfItems.length} item${shelfItems.length !== 1 ? 's' : ''} on your home shelf`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary[900] }]}
          onPress={() => { setAddModalVisible(true); setSearchQuery(''); setSelectedMedicine(null); setCustomQty(''); }}
        >
          <Icon source="plus" size={16} color="#FFF" />
          <Text style={styles.addBtnText}>{isLg ? 'Yongera' : 'Add'}</Text>
        </TouchableOpacity>
      </View>

      {/* EMPTY STATE */}
      {shelfItems.length === 0 && (
        <View style={styles.emptyState}>
          <Icon source="medical-bag" size={44} color={colors.neutral[300]} />
          <Text style={[styles.emptyTitle, { color: colors.neutral[500] }]}>
            {isLg ? 'Ssanduuko yo era nayimba' : 'Your shelf is empty'}
          </Text>
          <Text style={[styles.emptySub, { color: colors.neutral[400] }]}>
            {isLg
              ? 'Nyiga "Yongera" okwongera eddagala lye ggwanga ly\'olina mu nju.'
              : 'Tap "Add" to track medicines you keep at home.'}
          </Text>
        </View>
      )}

      {/* SHELF ITEMS */}
      {shelfItems.map((item) => {
        const isLow = item.quantity <= item.minimumThreshold;
        const stockColor = getStockColor(item);
        const stockPct = getStockPercent(item);
        return (
          <View key={item.id} style={[styles.shelfCard, { backgroundColor: cardBg }]}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardNameWrap}>
                {isLow && (
                  <View style={styles.lowBadge}>
                    <Icon source="alert" size={12} color="#C53030" />
                    <Text style={styles.lowBadgeText}>{isLg ? 'EDDAGALA LISINDISSE' : 'LOW STOCK'}</Text>
                  </View>
                )}
                <Text style={[styles.cardName, { color: colors.neutral[900] }]} numberOfLines={2}>{item.name}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon source="trash-can-outline" size={20} color={colors.neutral[400]} />
              </TouchableOpacity>
            </View>

            {/* STOCK BAR */}
            <View style={[styles.progressBg, { backgroundColor: isDark ? colors.neutral[200] : '#E2E8F0' }]}>
              <View style={[styles.progressFill, { width: `${stockPct}%` as any, backgroundColor: stockColor }]} />
            </View>

            <View style={styles.cardBottomRow}>
              <View>
                <Text style={[styles.qtyValue, { color: stockColor }]}>
                  {item.quantity} <Text style={[styles.qtyUnit, { color: colors.neutral[500] }]}>{item.unit}</Text>
                </Text>
                <Text style={[styles.thresholdLabel, { color: colors.neutral[400] }]}>
                  {isLg ? `Omuwendo omutono: ${item.minimumThreshold}` : `Min: ${item.minimumThreshold} ${item.unit}`}
                </Text>
              </View>
              <View style={styles.adjustRow}>
                <TouchableOpacity
                  style={[styles.adjustBtn, { backgroundColor: isDark ? colors.neutral[100] : '#EBF4FF' }]}
                  onPress={() => { setAdjustModal({ item, mode: 'deduct' }); setAdjustAmt(''); }}
                >
                  <Icon source="minus" size={16} color={colors.primary[900]} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.adjustBtn, { backgroundColor: colors.primary[900] }]}
                  onPress={() => { setAdjustModal({ item, mode: 'add' }); setAdjustAmt(''); }}
                >
                  <Icon source="plus" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}

      {/* ── ADD MEDICINE MODAL ── */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.surface : '#FFF' }]}>
            <View style={styles.modalHandleBar} />
            <View style={styles.modalTitleRow}>
              <Icon source="pill" size={22} color={colors.primary[900]} />
              <Text style={[styles.modalTitle, { color: colors.neutral[900] }]}>
                {isLg ? 'Yongera Eddagala' : 'Add Medicine to Shelf'}
              </Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Icon source="close" size={22} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            {/* SEARCH */}
            <View style={[styles.searchBox, { backgroundColor: isDark ? colors.neutral[50] : '#F7FAFC', borderColor: isDark ? colors.neutral[200] : '#E2E8F0' }]}>
              <Icon source="magnify" size={20} color={colors.neutral[400]} />
              <RNTextInput
                style={[styles.searchInput, { color: colors.neutral[900] }]}
                placeholder={isLg ? 'Noonya eddagala...' : 'Search essential medicines...'}
                placeholderTextColor={colors.neutral[400]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon source="close-circle" size={18} color={colors.neutral[400]} />
                </TouchableOpacity>
              )}
            </View>

            {/* SELECTED PREVIEW */}
            {selectedMedicine && (
              <View style={[styles.selectedPreview, { backgroundColor: colors.primary[50], borderColor: colors.primary[900] }]}>
                <Icon source="check-circle" size={20} color={colors.primary[900]} />
                <Text style={[styles.selectedName, { color: colors.primary[900] }]} numberOfLines={1}>{selectedMedicine.name}</Text>
                <Text style={[styles.selectedUnit, { color: colors.primary[600] }]}>({selectedMedicine.unit})</Text>
              </View>
            )}

            {/* MASTER DRUG LIST */}
            <FlatList
              data={filteredMaster}
              keyExtractor={(_, i) => String(i)}
              style={styles.drugList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.drugRow,
                    { borderBottomColor: isDark ? colors.neutral[100] : '#F0F4F8' },
                    selectedMedicine?.name === item.name && { backgroundColor: colors.primary[50] },
                  ]}
                  onPress={() => { setSelectedMedicine(item); setCustomQty(String(item.minimumThreshold)); }}
                >
                  <Icon source="pill" size={16} color={colors.primary[700]} />
                  <Text style={[styles.drugRowName, { color: colors.neutral[800] }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.drugRowUnit, { color: colors.neutral[400] }]}>{item.unit}</Text>
                  {selectedMedicine?.name === item.name && <Icon source="check" size={16} color={colors.primary[900]} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.noResults, { color: colors.neutral[400] }]}>
                  {isLg ? 'Tewali kiraga' : 'No matches found.'}
                </Text>
              }
            />

            {/* QUANTITY INPUT */}
            {selectedMedicine && (
              <View style={styles.qtySection}>
                <Text style={[styles.qtyLabel, { color: colors.neutral[700] }]}>
                  {isLg ? `Omuwendo Oguliwo (${selectedMedicine.unit})` : `Current quantity (${selectedMedicine.unit})`}
                </Text>
                <RNTextInput
                  style={[styles.qtyInput, { borderColor: colors.primary[900], color: colors.neutral[900], backgroundColor: isDark ? colors.neutral[50] : '#F7FAFC' }]}
                  value={customQty}
                  onChangeText={setCustomQty}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.confirmAddBtn, { backgroundColor: selectedMedicine ? colors.primary[900] : colors.neutral[300] }]}
              onPress={handleAddToShelf}
              disabled={!selectedMedicine}
            >
              <Icon source="check" size={20} color="#FFF" />
              <Text style={styles.confirmAddText}>{isLg ? 'Yongera ku Ssanduuko' : 'Add to My Shelf'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── ADJUST QUANTITY MODAL ── */}
      <Modal
        visible={!!adjustModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAdjustModal(null)}
      >
        <View style={styles.adjustOverlay}>
          <View style={[styles.adjustSheet, { backgroundColor: isDark ? colors.surface : '#FFF' }]}>
            <Text style={[styles.adjustTitle, { color: colors.neutral[900] }]}>
              {adjustModal?.mode === 'add'
                ? (isLg ? 'Yongera Eddagala' : 'Add Stock')
                : (isLg ? 'Wewula Eddagala' : 'Deduct Stock')}
            </Text>
            <Text style={[styles.adjustItemName, { color: colors.neutral[600] }]} numberOfLines={2}>
              {adjustModal?.item.name}
            </Text>
            <RNTextInput
              style={[styles.adjustInput, { borderColor: colors.primary[900], color: colors.neutral[900], backgroundColor: isDark ? colors.neutral[50] : '#F7FAFC' }]}
              value={adjustAmt}
              onChangeText={setAdjustAmt}
              keyboardType="numeric"
              placeholder={`Amount (${adjustModal?.item.unit})`}
              placeholderTextColor={colors.neutral[400]}
              autoFocus
            />
            <View style={styles.adjustActions}>
              <TouchableOpacity
                style={[styles.adjustCancel, { borderColor: colors.neutral[300] }]}
                onPress={() => setAdjustModal(null)}
              >
                <Text style={[styles.adjustCancelText, { color: colors.neutral[600] }]}>{isLg ? 'Sazaamu' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.adjustConfirm, { backgroundColor: adjustModal?.mode === 'add' ? colors.primary[900] : '#C53030' }]}
                onPress={handleAdjust}
              >
                <Text style={styles.adjustConfirmText}>{isLg ? 'Kakasa' : 'Confirm'}</Text>
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
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  shelfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shelfTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  shelfSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.full,
    gap: 6,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
  },
  shelfCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardNameWrap: { flex: 1, marginRight: 8 },
  lowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FED7D7',
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  lowBadgeText: {
    color: '#C53030',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    marginVertical: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  qtyValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  qtyUnit: {
    fontSize: 14,
    fontWeight: '500',
  },
  thresholdLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: 8,
  },
  adjustBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Add Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xl,
    maxHeight: '88%',
    ...shadows.lg,
  },
  modalHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E0',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  selectedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: 8,
    marginBottom: spacing.sm,
  },
  selectedName: {
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
  },
  selectedUnit: {
    fontWeight: '600',
    fontSize: 13,
  },
  drugList: {
    maxHeight: 220,
    marginBottom: spacing.sm,
  },
  drugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  drugRowName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  drugRowUnit: {
    fontSize: 12,
    fontWeight: '500',
  },
  noResults: {
    textAlign: 'center',
    paddingVertical: spacing.xl,
    fontSize: 14,
  },
  qtySection: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  qtyLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  qtyInput: {
    borderWidth: 2,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '700',
  },
  confirmAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: radii.xl,
    marginTop: spacing.sm,
  },
  confirmAddText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  // Adjust Modal
  adjustOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  adjustSheet: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 380,
    ...shadows.lg,
  },
  adjustTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  adjustItemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.lg,
  },
  adjustInput: {
    borderWidth: 2,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  adjustActions: {
    flexDirection: 'row',
    gap: 12,
  },
  adjustCancel: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  adjustCancelText: {
    fontSize: 15,
    fontWeight: '700',
  },
  adjustConfirm: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radii.lg,
  },
  adjustConfirmText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
