import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Text, Icon, Button, Switch, SegmentedButtons } from 'react-native-paper';
import { getChildRecords, saveChildRecord, deleteChildRecord, ChildRecord } from '../db/Database';
import { spacing, radii, shadows } from '../theme';
import { useAppTheme } from '../ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedCard from '../components/AnimatedCard';

interface VaccineDose {
  name: string;
  dueWeeks: number;
  date: string;
  status: 'pending' | 'given';
  givenDate?: string;
  notes?: string;
}

const UNEPI_VACCINES = [
  { name: 'BCG', dueWeeks: 0, desc: 'Prevents Tuberculosis (TB) in lungs and brain' },
  { name: 'OPV 0', dueWeeks: 0, desc: 'Polio vaccine given at birth' },
  { name: 'OPV 1', dueWeeks: 6, desc: 'Protects against polio paralysis' },
  { name: 'Pentavalent 1', dueWeeks: 6, desc: 'Protects against Diphtheria, Pertussis, Tetanus, HepB, Hib' },
  { name: 'PCV 1', dueWeeks: 6, desc: 'Protects against severe pneumonia and meningitis' },
  { name: 'Rotavirus 1', dueWeeks: 6, desc: 'Protects infants from severe diarrheal disease' },
  { name: 'OPV 2', dueWeeks: 10, desc: 'Polio booster' },
  { name: 'Pentavalent 2', dueWeeks: 10, desc: 'Second dose' },
  { name: 'PCV 2', dueWeeks: 10, desc: 'Second dose' },
  { name: 'Rotavirus 2', dueWeeks: 10, desc: 'Second dose' },
  { name: 'OPV 3', dueWeeks: 14, desc: 'Third polio dose' },
  { name: 'IPV 1', dueWeeks: 14, desc: 'Inactivated Polio Vaccine injection for stronger immunity' },
  { name: 'Pentavalent 3', dueWeeks: 14, desc: 'Final dose' },
  { name: 'PCV 3', dueWeeks: 14, desc: 'Final dose' },
  { name: 'Measles-Rubella (MR) 1', dueWeeks: 39, desc: 'Protects against Measles and Rubella (approx. 9 months)' },
  { name: 'Yellow Fever', dueWeeks: 39, desc: 'Protects against Yellow Fever virus (approx. 9 months)' },
  { name: 'Measles-Rubella (MR) 2', dueWeeks: 78, desc: 'Measles booster (approx. 18 months)' },
];

export const ImmunizationTrackerScreen: React.FC = () => {
  const { colors } = useAppTheme();
  
  // Database states
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [activeChildIdx, setActiveChildIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Registration states
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('female');
  const [showRegForm, setShowRegForm] = useState(false);

  // Filter state for schedule list
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'given'>('all');

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const records = await getChildRecords();
      setChildren(records);
      if (records.length > 0) {
        setActiveChildIdx(0);
      } else {
        setActiveChildIdx(null);
      }
    } catch (e) {
      console.error('Failed to load children records', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChild = async () => {
    if (!name.trim() || !birthDate.trim()) {
      Alert.alert('Missing Fields', 'Please enter child name and birth date.');
      return;
    }

    const bDate = new Date(birthDate);
    if (isNaN(bDate.getTime())) {
      Alert.alert('Invalid Date', 'Please enter a valid birth date in YYYY-MM-DD format.');
      return;
    }

    // Generate schedule
    const schedule: VaccineDose[] = UNEPI_VACCINES.map(v => {
      const dueDate = new Date(bDate.getTime() + v.dueWeeks * 7 * 24 * 60 * 60 * 1000);
      return {
        name: v.name,
        dueWeeks: v.dueWeeks,
        date: dueDate.toISOString().split('T')[0],
        status: 'pending',
      };
    });

    const newChild: Omit<ChildRecord, 'id'> = {
      name,
      birthDate,
      gender,
      immunizationsJson: JSON.stringify(schedule),
    };

    await saveChildRecord(newChild);
    Alert.alert('Registered Successfully', `${name} has been added.`);
    setName('');
    setBirthDate('');
    setShowRegForm(false);
    loadChildren();
  };

  const handleToggleVaccine = async (vaccineIdx: number) => {
    if (activeChildIdx === null || !children[activeChildIdx]) return;
    const child = children[activeChildIdx];
    const schedule = JSON.parse(child.immunizationsJson) as VaccineDose[];
    const dose = schedule[vaccineIdx];

    if (dose.status === 'given') {
      dose.status = 'pending';
      delete dose.givenDate;
    } else {
      dose.status = 'given';
      dose.givenDate = new Date().toISOString().split('T')[0];
    }

    const updatedChild = {
      ...child,
      immunizationsJson: JSON.stringify(schedule),
    };

    await saveChildRecord(updatedChild);
    // Reload state
    const records = await getChildRecords();
    setChildren(records);
  };

  const handleDeleteChild = () => {
    if (activeChildIdx === null || !children[activeChildIdx]) return;
    const child = children[activeChildIdx];
    Alert.alert(
      'Remove Child Record?',
      `Are you sure you want to delete the record for ${child.name}? This will remove all immunization records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteChildRecord(child.id);
            loadChildren();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: colors.background }]}>
        <Text>Loading Immunization Records...</Text>
      </View>
    );
  }

  const activeChild = activeChildIdx !== null ? children[activeChildIdx] : null;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Selector or Form Toggle */}
      <View style={styles.topHeader}>
        <Text style={[styles.title, { color: colors.neutral[900] }]}>Child Immunization Tracker</Text>
        <Button
          mode="outlined"
          textColor={colors.primary[900]}
          style={{ borderColor: colors.primary[900] }}
          onPress={() => setShowRegForm(prev => !prev)}
        >
          {showRegForm ? 'View Tracker' : '+ Register Child'}
        </Button>
      </View>

      {showRegForm ? (
        /* Onboarding Child Form */
        <AnimatedCard delay={100} style={[styles.cardForm, { backgroundColor: colors.surface }]}>
          <Text style={styles.formSectionTitle}>Register Newborn / Infant</Text>

          <Text style={styles.fieldLabel}>Child's Full Name</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.neutral[300], color: colors.neutral[900] }]}
            placeholder="e.g. Kato Jonathan"
            placeholderTextColor={colors.neutral[400]}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.fieldLabel}>Birth Date</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.neutral[300], color: colors.neutral[900] }]}
            placeholder="YYYY-MM-DD (e.g. 2026-03-01)"
            placeholderTextColor={colors.neutral[400]}
            value={birthDate}
            onChangeText={setBirthDate}
          />

          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={styles.genderSelect}>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'female' && styles.genderBtnActiveFemale]}
              onPress={() => setGender('female')}
            >
              <Icon source="gender-female" size={20} color={gender === 'female' ? '#FFF' : '#E53E3E'} />
              <Text style={[styles.genderBtnText, gender === 'female' && { color: '#FFF' }]}>Female</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'male' && styles.genderBtnActiveMale]}
              onPress={() => setGender('male')}
            >
              <Icon source="gender-male" size={20} color={gender === 'male' ? '#FFF' : '#3182CE'} />
              <Text style={[styles.genderBtnText, gender === 'male' && { color: '#FFF' }]}>Male</Text>
            </TouchableOpacity>
          </View>

          <Button
            mode="contained"
            buttonColor={colors.primary[900]}
            textColor="#FFF"
            style={styles.submitBtn}
            onPress={handleRegisterChild}
          >
            Generate UNEPI Schedule
          </Button>
        </AnimatedCard>
      ) : activeChild ? (
        /* Tracker dashboard */
        <>
          {/* Children Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childTabs}>
            {children.map((ch, idx) => (
              <TouchableOpacity
                key={ch.id}
                style={[
                  styles.childTab,
                  { backgroundColor: colors.surface },
                  activeChildIdx === idx && { backgroundColor: colors.primary[900] },
                ]}
                onPress={() => setActiveChildIdx(idx)}
              >
                <Icon source={ch.gender === 'female' ? 'baby-female' : 'baby-male'} size={18} color={activeChildIdx === idx ? '#FFF' : colors.primary[900]} />
                <Text style={[styles.childTabText, { color: colors.neutral[700] }, activeChildIdx === idx && { color: '#FFF', fontWeight: '800' }]}>
                  {ch.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Child Details Card */}
          <AnimatedCard delay={50} style={styles.childDetailsCard}>
            <LinearGradient colors={['#4299E1', '#3182CE']} style={styles.childDetailsGradient}>
              <View style={styles.detailsHeader}>
                <View>
                  <Text style={styles.childName}>{activeChild.name}</Text>
                  <Text style={styles.childDob}>DOB: {activeChild.birthDate}</Text>
                </View>
                <View style={styles.vaccineDosesCounter}>
                  <Text style={styles.doseCounterText}>
                    {JSON.parse(activeChild.immunizationsJson).filter((v: any) => v.status === 'given').length} / {UNEPI_VACCINES.length} Given
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </AnimatedCard>

          {/* Segmented Buttons for Filters */}
          <View style={styles.filterSection}>
            <SegmentedButtons
              value={filterMode}
              onValueChange={value => setFilterMode(value as any)}
              buttons={[
                { value: 'all', label: 'All Vaccines' },
                { value: 'pending', label: 'Due' },
                { value: 'given', label: 'Given' },
              ]}
              style={styles.segmentedFilter}
            />
          </View>

          {/* Schedule List */}
          <View style={styles.scheduleList}>
            {(() => {
              const schedule = JSON.parse(activeChild.immunizationsJson) as VaccineDose[];
              return schedule
                .map((dose, idx) => ({ dose, idx }))
                .filter(({ dose }) => {
                  if (filterMode === 'pending') return dose.status === 'pending';
                  if (filterMode === 'given') return dose.status === 'given';
                  return true;
                })
                .map(({ dose, idx }) => {
                  const isGiven = dose.status === 'given';
                  const matchingVaccineMeta = UNEPI_VACCINES.find(v => v.name === dose.name);
                  return (
                    <View key={dose.name} style={[styles.doseCard, { backgroundColor: colors.surface }]}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.doseHeader}>
                          <Text style={styles.doseName}>{dose.name}</Text>
                          <Text style={[styles.doseDueLabel, { color: isGiven ? '#38A169' : '#E53E3E' }]}>
                            {isGiven ? `Given: ${dose.givenDate}` : `Due: ${dose.date}`}
                          </Text>
                        </View>
                        <Text style={[styles.doseDesc, { color: colors.neutral[500] }]}>
                          {matchingVaccineMeta?.desc || ''}
                        </Text>
                      </View>
                      <Switch
                        value={isGiven}
                        onValueChange={() => handleToggleVaccine(idx)}
                        color="#3182CE"
                      />
                    </View>
                  );
                });
            })()}
          </View>

          {/* Delete child record button */}
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteChild}>
            <Text style={styles.deleteText}>Remove {activeChild.name}'s Record</Text>
          </TouchableOpacity>
        </>
      ) : (
        /* Empty State */
        <View style={styles.emptyState}>
          <Icon source="baby-carriage" size={60} color={colors.neutral[300]} />
          <Text style={[styles.emptyText, { color: colors.neutral[500] }]}>No children registered yet.</Text>
          <Button
            mode="contained"
            buttonColor={colors.primary[900]}
            textColor="#FFF"
            style={styles.emptyBtn}
            onPress={() => setShowRegForm(true)}
          >
            Register a Child
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  cardForm: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    ...shadows.sm,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  genderSelect: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radii.md,
    gap: 8,
  },
  genderBtnActiveFemale: {
    backgroundColor: '#E53E3E',
    borderColor: '#E53E3E',
  },
  genderBtnActiveMale: {
    backgroundColor: '#3182CE',
    borderColor: '#3182CE',
  },
  genderBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A5568',
  },
  submitBtn: {
    marginTop: spacing.md,
    borderRadius: radii.full,
  },
  childTabs: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  childTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.full,
    marginRight: spacing.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  childTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  childDetailsCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  childDetailsGradient: {
    padding: spacing.lg,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  childName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  childDob: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '700',
  },
  vaccineDosesCounter: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  doseCounterText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  filterSection: {
    marginBottom: spacing.md,
  },
  segmentedFilter: {
    borderRadius: radii.md,
  },
  scheduleList: {
    gap: spacing.sm,
  },
  doseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    gap: spacing.md,
  },
  doseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  doseName: {
    fontSize: 14,
    fontWeight: '800',
  },
  doseDueLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  doseDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  deleteBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  deleteText: {
    color: '#E53E3E',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 15,
    marginTop: spacing.md,
    fontWeight: '600',
  },
  emptyBtn: {
    marginTop: spacing.lg,
    borderRadius: radii.full,
  },
});
