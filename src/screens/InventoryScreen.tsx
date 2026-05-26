import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, Icon, Dialog, Portal, Button, TextInput } from 'react-native-paper';
import { getInventory, deductInventory, addInventoryItem, addInventoryStock } from '../db/sqlite';
import { InventoryItem } from '../db/types';
import { colors, spacing, radii, shadows } from '../theme';
import { useAppTheme } from '../ThemeContext';

const InventoryScreen: React.FC = () => {
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
      Alert.alert('Invalid amount', 'Please enter a valid positive number.');
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
      Alert.alert('Missing fields', 'Please fill out all fields.');
      return;
    }
    const qty = parseInt(newItemQty, 10);
    const threshold = parseInt(newItemThreshold, 10);
    if (isNaN(qty) || qty < 0 || isNaN(threshold) || threshold < 0) {
      Alert.alert('Invalid values', 'Quantity and threshold must be positive numbers.');
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
      Alert.alert('Error', 'Failed to add item to inventory.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: mode === 'light' ? '#FAFAFA' : colors.background }]}>
      <View style={[styles.header, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderBottomColor: mode === 'light' ? '#E5E7EB' : colors.neutral[100] }]}>
        <View style={styles.headerLeft}>
          <Icon source="medical-bag" size={24} color={colors.primary[900]} />
          <Text style={[styles.headerTitle, { color: colors.primary[900] }]}>Drug Inventory</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addItemBtn, { backgroundColor: colors.primary[900] }]}
          onPress={() => setAddItemVisible(true)}
        >
          <Icon source="plus" size={16} color="#FFF" />
          <Text style={styles.addItemBtnText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={[styles.pageSubtitle, { color: colors.neutral[500] }]}>
          Manage essential clinic supplies, add new arrivals, and track stock levels.
        </Text>

        <View style={styles.list}>
          {inventory.map(item => {
            const isLow = item.quantity <= item.minimumThreshold;
            return (
              <View key={item.id} style={[styles.card, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.itemName, { color: colors.neutral[900] }]}>{item.name}</Text>
                  {isLow && (
                    <View style={styles.lowStockBadge}>
                      <Icon source="alert" size={14} color="#C53030" />
                      <Text style={styles.lowStockText}>Low Stock</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.cardBody}>
                  <View style={styles.stockInfo}>
                    <Text style={[styles.quantityLabel, { color: colors.neutral[500] }]}>Current Stock:</Text>
                    <Text style={[styles.quantityValue, { color: isLow ? '#C53030' : colors.primary[900] }]}>
                      {item.quantity} <Text style={{ fontSize: 14, fontWeight: '500' }}>{item.unit}</Text>
                    </Text>
                  </View>
                  
                  <View style={styles.actionGroup}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.refillBtn, { backgroundColor: mode === 'light' ? '#EBF5FF' : 'rgba(30, 144, 255, 0.15)' }]}
                      onPress={() => handleUpdatePress(item, 'REFILL')}
                    >
                      <Icon source="plus" size={16} color={mode === 'light' ? '#1E40AF' : '#60A5FA'} />
                      <Text style={[styles.actionBtnText, { color: mode === 'light' ? '#1E40AF' : '#60A5FA' }]}>Refill</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.deductBtn, { backgroundColor: colors.primary[900] }]}
                      onPress={() => handleUpdatePress(item, 'DEDUCT')}
                    >
                      <Icon source="minus" size={16} color="#FFF" />
                      <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Deduct</Text>
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
          <Dialog.Title>{updateMode === 'DEDUCT' ? 'Deduct Stock' : 'Refill Stock'}</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: 16 }}>
              {updateMode === 'DEDUCT' 
                ? `How much ${selectedItem?.name} would you like to deduct from inventory?`
                : `How much ${selectedItem?.name} has arrived at the clinic?`}
            </Text>
            <TextInput
              mode="outlined"
              label={`Amount (${selectedItem?.unit})`}
              value={amountValue}
              onChangeText={setAmountValue}
              keyboardType="numeric"
              activeOutlineColor={colors.primary[900]}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)} textColor={colors.neutral[500]}>Cancel</Button>
            <Button onPress={handleConfirmUpdate} mode="contained" buttonColor={colors.primary[900]}>Confirm</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Add New Item Dialog */}
      <Portal>
        <Dialog visible={addItemVisible} onDismiss={() => setAddItemVisible(false)} style={{ backgroundColor: mode === 'light' ? '#FFF' : colors.surface }}>
          <Dialog.Title>Add New Inventory Item</Dialog.Title>
          <Dialog.Content style={{ gap: 12 }}>
            <TextInput
              mode="outlined"
              label="Item Name (e.g. Amoxicillin 250mg)"
              value={newItemName}
              onChangeText={setNewItemName}
              activeOutlineColor={colors.primary[900]}
            />
            <TextInput
              mode="outlined"
              label="Initial Quantity"
              value={newItemQty}
              onChangeText={setNewItemQty}
              keyboardType="numeric"
              activeOutlineColor={colors.primary[900]}
            />
            <TextInput
              mode="outlined"
              label="Unit (e.g. tablets, doses, capsules)"
              value={newItemUnit}
              onChangeText={setNewItemUnit}
              activeOutlineColor={colors.primary[900]}
            />
            <TextInput
              mode="outlined"
              label="Minimum Threshold (Low Stock Alert)"
              value={newItemThreshold}
              onChangeText={setNewItemThreshold}
              keyboardType="numeric"
              activeOutlineColor={colors.primary[900]}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddItemVisible(false)} textColor={colors.neutral[500]}>Cancel</Button>
            <Button onPress={handleConfirmAddItem} mode="contained" buttonColor={colors.primary[900]}>Add Item</Button>
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
