import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  useWindowDimensions
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Divider, 
  Icon, 
  Switch,
  List
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../ThemeContext';
import { spacing, radii } from '../theme';
import { saveSetting, getSetting } from '../db/Database';

const SettingsScreen = () => {
  const { t } = useTranslation();
  const { colors, mode, toggleTheme } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 800;
  
  const [orsKey, setOrsKey] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const ors = await getSetting('ors_api_key');
    const router = await getSetting('openrouter_api_key');
    const offline = await getSetting('offline_priority');
    
    if (ors) setOrsKey(ors);
    if (router) setOpenRouterKey(router);
    if (offline !== null) setIsOfflineMode(offline === 'true');
  };

  const handleSave = async () => {
    await saveSetting('ors_api_key', orsKey);
    await saveSetting('openrouter_api_key', openRouterKey);
    await saveSetting('offline_priority', isOfflineMode.toString());
    
    Alert.alert(t('settings.save_success'), t('settings.save_success_msg'));
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={isDesktop ? styles.desktopContent : undefined}>
        <View style={styles.header}>
        <Text style={[styles.title, { color: colors.neutral[900] }]}>{t('settings.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.neutral[500] }]}>{t('settings.subtitle')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary[900] }]}>{t('settings.appearance')}</Text>
        <List.Item
          title={t('settings.dark_mode')}
          description={t('settings.dark_mode_sub')}
          left={props => <List.Icon {...props} icon="brightness-4" />}
          right={() => <Switch value={mode === 'dark'} onValueChange={toggleTheme} />}
        />
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary[900] }]}>{t('settings.api_config')}</Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.neutral[700] }]}>{t('settings.openrouter_key')}</Text>
          <TextInput
            mode="outlined"
            placeholder="sk-or-v1-..."
            value={openRouterKey}
            onChangeText={setOpenRouterKey}
            secureTextEntry
            style={styles.input}
            outlineColor={colors.neutral[300]}
            activeOutlineColor={colors.primary[900]}
          />
          <Text style={styles.helpText}>{t('settings.expert_ai_help')}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.neutral[700] }]}>{t('settings.ors_key')}</Text>
          <TextInput
            mode="outlined"
            placeholder="5b3ce..."
            value={orsKey}
            onChangeText={setOrsKey}
            secureTextEntry
            style={styles.input}
            outlineColor={colors.neutral[300]}
            activeOutlineColor={colors.primary[900]}
          />
          <Text style={styles.helpText}>{t('settings.navigation_help')}</Text>
        </View>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary[900] }]}>{t('settings.data_privacy')}</Text>
        <List.Item
          title={t('settings.offline_mode')}
          description={t('settings.offline_help')}
          left={props => <List.Icon {...props} icon="cloud-off-outline" />}
          right={() => <Switch value={isOfflineMode} onValueChange={setIsOfflineMode} />}
        />
      </View>

      <TouchableOpacity 
        style={[styles.saveBtn, { backgroundColor: colors.primary[900] }]}
        onPress={handleSave}
      >
        <Text style={styles.saveBtnText}>{t('settings.save_btn')}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.versionText}>HealthGuard Uganda v1.2.0-hybrid</Text>
        <Text style={styles.footerText}>{t('settings.developed_by')}</Text>
      </View>
      <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  desktopContent: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  header: { padding: spacing.xl, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { fontSize: 16, marginTop: 4 },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  sectionTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  divider: { marginVertical: spacing.lg, opacity: 0.5 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: '#FFF' },
  helpText: { fontSize: 12, color: '#999', marginTop: 4 },
  saveBtn: { 
    margin: spacing.lg, 
    padding: 18, 
    borderRadius: radii.md, 
    alignItems: 'center',
    elevation: 4
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  footer: { alignItems: 'center', marginTop: 20 },
  versionText: { fontSize: 12, color: '#999', fontWeight: '700' },
  footerText: { fontSize: 10, color: '#CCC', marginTop: 4 }
});

export default SettingsScreen;
