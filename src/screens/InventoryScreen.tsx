import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, Icon, Dialog, Portal, Button, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { getInventory, deductInventory, addInventoryItem, addInventoryStock } from '../db/sqlite';
import { InventoryItem } from '../db/types';
import { colors, spacing, radii, shadows } from '../theme';
import { useAppTheme } from '../ThemeContext';

const InventoryScreen: React.FC = () => {
  const { t } = useTranslation();
  const { mode } = useAppTheme();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // Stock Update Dialog State
  const [dialogVisible, setDialogVisible] = useState(false);
  const [updateMode, setUpdateMode] = useState<'DEDUCT' | 'REFILL' | null>(null);
  const [amountValue, setAmountValue] = useState('');

  // Add Item Dialog State
  const [addItemVisible, setAddItemVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('tablets');
  const [newItemThreshold, setNewItemThreshold] = useState('');

  const loadData = useCallback(async () => {
    try {
      const data = await getInventory();
      setInventory(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  const handleUpdatePress = (item: InventoryItem, type: 'DEDUCT' | 'REFILL') => {
    setSelectedItem(item);
    setAmountValue('');
    setUpdateMode(type);
    setDialogVisible(true);
  };

  const handleConfirmUpdate = async () => {
    if (!selectedItem || !updateMode) return;
    const amount = parseInt(amountValue, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('inventory.invalid_amount'), t('inventory.invalid_amount_msg'));
      return;
    }

    if (updateMode === 'DEDUCT') {
      await deductInventory(selectedItem.id, amount);
    } else {
      await addInventoryStock(selectedItem.id, amount);
    }

    setDialogVisible(false);
    loadData();
  };

  const handleConfirmAddItem = async () => {
    if (!newItemName.trim() || !newItemQty || !newItemUnit.trim() || !newItemThreshold) {
      Alert.alert(t('inventory.missing_fields'), t('inventory.missing_fields_msg'));
      return;
    }
    const qty = parseInt(newItemQty, 10);
    const threshold = parseInt(newItemThreshold, 10);
    if (isNaN(qty) || qty < 0 || isNaN(threshold) || threshold < 0) {
      Alert.alert(t('inventory.invalid_values'), t('inventory.invalid_values_msg'));
      return;
    }

    try {
      await addInventoryItem({
        name: newItemName.trim(),
        quantity: qty,
        unit: newItemUnit.trim(),
        minimumThreshold: threshold,
      });
      setAddItemVisible(false);
      setNewItemName('');
      setNewItemQty('');
      setNewItemUnit('tablets');
      setNewItemThreshold('');
      loadData();
    } catch (e) {
      console.error(e);
      Alert.alert(t('inventory.error'), t('inventory.add_error_msg'));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: mode === 'light' ? '#FAFAFA' : colors.background }]}>
      <View style={[styles.header, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderBottomColor: mode === 'light' ? '#E5E7EB' : colors.neutral[100] }]}>
        <View style={styles.headerLeft}>
          <Icon source="medical-bag" size={24} color={colors.primary[900]} />
          <Text style={[styles.headerTitle, { color: colors.primary[900] }]}>{t('inventory.title')}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addItemBtn, { backgroundColor: colors.primary[900] }]}
          onPress={() => setAddItemVisible(true)}
        >
          <Icon source="plus" size={16} color="#FFF" />
          <Text style={styles.addItemBtnText}>{t('inventory.add_item')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={[styles.pageSubtitle, { color: colors.neutral[500] }]}>
          {t('inventory.page_subtitle')}
        </Text>

        <View style={styles.list}>
          {inventory.map(item => {
            const isLow = item.quantity <= item.minimumThreshold;
            const displayUnit = t('inventory.units.' + item.unit, { defaultValue: item.unit });
            return (
              <View key={item.id} style={[styles.card, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.itemName, { color: colors.neutral[900] }]}>{item.name}</Text>
                  {isLow && (
                    <View style={styles.lowStockBadge}>
                      <Icon source="alert" size={14} color="#C53030" />
                      <Text style={styles.lowStockText}>{t('inventory.low_stock')}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.cardBody}>
                  <View style={styles.stockInfo}>
                    <Text style={[styles.quantityLabel, { color: colors.neutral[500] }]}>{t('inventory.current_stock')}</Text>
                    <Text style={[styles.quantityValue, { color: isLow ? '#C53030' : colors.primary[900] }]}>
                      {item.quantity} <Text style={{ fontSize: 14, fontWeight: '500' }}>{displayUnit}</Text>
                    </Text>
                  </View>
                  
                  <View style={styles.actionGroup}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.refillBtn, { backgroundColor: mode === 'light' ? '#EBF5FF' : 'rgba(30, 144, 255, 0.15)' }]}
                      onPress={() => handleUpdatePress(item, 'REFILL')}
                    >
                      <Icon source="plus" size={16} color={mode === 'light' ? '#1E40AF' : '#60A5FA'} />
                      <Text style={[styles.actionBtnText, { color: mode === 'light' ? '#1E40AF' : '#60A5FA' }]}>{t('inventory.refill')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.deductBtn, { backgroundColor: colors.primary[900] }]}
                      onPress={() => handleUpdatePress(item, 'DEDUCT')}
                    >
                      <Icon source="minus" size={16} color="#FFF" />
                      <Text style={[styles.actionBtnText, { color: '#FFF' }]}>{t('inventory.deduct')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Update Stock Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={{ backgroundColor: mode === 'light' ? '#FFF' : colors.surface }}>
          <Dialog.Title>{updateMode === 'DEDUCT' ? t('inventory.deduct_stock') : t('inventory.refill_stock')}</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: 16 }}>
              {updateMode === 'DEDUCT' 
                ? t('inventory.deduct_dialog_msg', { name: selectedItem?.name })
                : t('inventory.refill_dialog_msg', { name: selectedItem?.name })}
            </Text>
            <TextInput
              mode="outlined"
              label={t('inventory.amount_label', { unit: selectedItem ? t('inventory.units.' + selectedItem.unit, { defaultValue: selectedItem.unit }) : '' })}
              value={amountValue}
              onChangeText={setAmountValue}
              keyboardType="numeric"
              activeOutlineColor={colors.primary[900]}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)} textColor={colors.neutral[500]}>{t('inventory.cancel')}</Button>
            <Button onPress={handleConfirmUpdate} mode="contained" buttonColor={colors.primary[900]}>{t('inventory.confirm')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Add New Item Dialog */}
      <Portal>
        <Dialog visible={addItemVisible} onDismiss={() => setAddItemVisible(false)} style={{ backgroundColor: mode === 'light' ? '#FFF' : colors.surface }}>
          <Dialog.Title>{t('inventory.add_new_title')}</Dialog.Title>
          <Dialog.Content style={{ gap: 12 }}>
            <TextInput
              mode="outlined"
              label={t('inventory.new_item_name_label')}
              value={newItemName}
              onChangeText={setNewItemName}
              activeOutlineColor={colors.primary[900]}
            />
            <TextInput
              mode="outlined"
              label={t('inventory.new_item_qty_label')}
              value={newItemQty}
              onChangeText={setNewItemQty}
              keyboardType="numeric"
              activeOutlineColor={colors.primary[900]}
            />
            <TextInput
              mode="outlined"
              label={t('inventory.new_item_unit_label')}
              value={newItemUnit}
              onChangeText={setNewItemUnit}
              activeOutlineColor={colors.primary[900]}
            />
            <TextInput
              mode="outlined"
              label={t('inventory.new_item_threshold_label')}
              value={newItemThreshold}
              onChangeText={setNewItemThreshold}
              keyboardType="numeric"
              activeOutlineColor={colors.primary[900]}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddItemVisible(false)} textColor={colors.neutral[500]}>{t('inventory.cancel')}</Button>
            <Button onPress={handleConfirmAddItem} mode="contained" buttonColor={colors.primary[900]}>{t('inventory.add_item')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    gap: 6,
  },
  addItemBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  pageSubtitle: {
    fontSize: 15,
    marginBottom: 20,
  },
  list: {
    gap: 16,
  },
  card: {
    borderRadius: radii.lg,
    padding: 20,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FED7D7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    gap: 4,
  },
  lowStockText: {
    color: '#C53030',
    fontSize: 12,
    fontWeight: '800',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  stockInfo: {
    flex: 1,
  },
  quantityLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  quantityValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    gap: 6,
  },
  refillBtn: {
    borderWidth: 0,
  },
  deductBtn: {
    borderWidth: 0,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default InventoryScreen;
