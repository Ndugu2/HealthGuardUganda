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
  List,
  Avatar
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../ThemeContext';
import { colors as themeColors, spacing, radii, shadows } from '../theme';
import { saveSetting, getSetting } from '../db/Database';
import { AuthService } from '../services/AuthService';
import { DEFAULT_API_BASE, API_BASE_SETTING_KEY } from '../config';

interface SettingsScreenProps {
  onLogout?: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onLogout }) => {
  const { t } = useTranslation();
  const { colors, mode, toggleTheme } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 800;
  
  const [orsKey, setOrsKey] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState('');
  const [pendingHWs, setPendingHWs] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
    loadUser();
    loadPendingHWs();
  }, []);

  const loadUser = async () => {
    const session = await AuthService.getSession();
    if (session && session.user) {
      setUserRole(session.user.role);
      setUserName(session.user.name || '');
    }
  };

  const loadPendingHWs = async () => {
    const allUsers = await AuthService.getAllRegisteredUsers();
    const pending = allUsers.filter(u => u.role === 'HW' && !u.approved);
    setPendingHWs(pending);
  };

  const loadSettings = async () => {
    const ors = await getSetting('ors_api_key');
    const router = await getSetting('openrouter_api_key');
    const offline = await getSetting('offline_priority');
    const apiCustom = await getSetting(API_BASE_SETTING_KEY);
    
    if (ors) setOrsKey(ors);
    if (router) setOpenRouterKey(router);
    if (apiCustom) setApiBaseUrl(apiCustom);
    if (offline !== null) setIsOfflineMode(offline === 'true');
  };

  const handleApprove = async (phone: string) => {
    const success = await AuthService.approveUser(phone);
    if (success) {
      Alert.alert('Approved', 'Health Worker account approved successfully.');
      loadPendingHWs();
    } else {
      Alert.alert('Error', 'Could not approve account.');
    }
  };

  const handleSave = async () => {
    await saveSetting('ors_api_key', orsKey);
    await saveSetting('openrouter_api_key', openRouterKey);
    await saveSetting('offline_priority', isOfflineMode.toString());
    await saveSetting(API_BASE_SETTING_KEY, apiBaseUrl.trim());
    
    Alert.alert(t('settings.save_success'), t('settings.save_success_msg'));
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={isDesktop ? styles.desktopContent : undefined}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.neutral[900] }]}>{t('settings.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.neutral[500] }]}>{t('settings.subtitle')}</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.neutral[200] }]}>
          <Avatar.Text 
            size={48} 
            label={userName ? userName.substring(0, 2).toUpperCase() : 'U'} 
            style={{ backgroundColor: colors.primary[100] }} 
            labelStyle={{ color: colors.primary[900] }} 
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.neutral[900] }]}>{userName || 'User'}</Text>
            <Text style={[styles.profileRole, { color: colors.neutral[600] }]}>{userRole}</Text>
          </View>
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

        {userRole === 'ADMIN' && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.primary[900] }]}>Pending Health Worker Approvals</Text>
              {pendingHWs.length === 0 ? (
                <View style={[styles.emptyApprovalsCard, { backgroundColor: colors.surface, borderColor: colors.neutral[200] }]}>
                  <Icon source="checkbox-marked-circle-outline" size={24} color={colors.primary[600]} />
                  <Text style={[styles.emptyApprovalsText, { color: colors.neutral[500] }]}>No pending health worker approvals at this time.</Text>
                </View>
              ) : (
                pendingHWs.map((hw) => (
                  <View key={hw.phone} style={[styles.approvalCard, { backgroundColor: colors.surface, borderColor: colors.neutral[200] }]}>
                    <View style={styles.approvalHeader}>
                      <Avatar.Text size={32} label={hw.name.substring(0, 2).toUpperCase()} style={{ backgroundColor: colors.primary[50] }} labelStyle={{ color: colors.primary[900] }} />
                      <View style={styles.approvalInfo}>
                        <Text style={[styles.approvalName, { color: colors.neutral[900] }]}>{hw.name}</Text>
                        <Text style={[styles.approvalDetail, { color: colors.neutral[500] }]}>{hw.phone} • {hw.email}</Text>
                        <Text style={[styles.approvalLocation, { color: colors.neutral[500] }]}>District: {hw.district} | Village: {hw.village}</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={[styles.approveBtnMini, { backgroundColor: colors.primary[900] }]}
                      onPress={() => handleApprove(hw.phone)}
                    >
                      <Icon source="check" size={16} color="#FFF" />
                      <Text style={styles.approveBtnMiniText}>Approve Account</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            <Divider style={styles.divider} />
          </>
        )}

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
            <Text style={[styles.label, { color: colors.neutral[700] }]}>{t('settings.server_url')}</Text>
            <TextInput
              mode="outlined"
              placeholder={DEFAULT_API_BASE}
              value={apiBaseUrl}
              onChangeText={setApiBaseUrl}
              autoCapitalize="none"
              style={styles.input}
              outlineColor={colors.neutral[300]}
              activeOutlineColor={colors.primary[900]}
            />
            <Text style={styles.helpText}>{t('settings.server_url_help')}</Text>
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
          {/* Logout Row */}
          <List.Item
            title={t('settings.logout')}
            left={props => <List.Icon {...props} icon="logout" color={colors.danger[800]} />}
            onPress={() => {
              Alert.alert(
                t('settings.logout_confirm_title'),
                t('settings.logout_confirm_msg'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  { 
                    text: t('settings.logout'), 
                    style: 'destructive',
                    onPress: async () => {
                      await AuthService.logout();
                      if (onLogout) {
                        onLogout();
                      }
                    }
                  }
                ]
              );
            }}
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: '#2C5E3E' }]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>{t('settings.save_btn')}</Text>
          <Icon source="chevron-right" size={20} color="#FFF" />
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
  header: { padding: spacing.xl, paddingTop: 60, paddingBottom: spacing.sm },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { fontSize: 16, marginTop: 4 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 0,
    ...shadows.sm,
  },
  profileInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
  },
  profileRole: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  sectionTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  divider: { marginVertical: spacing.lg, opacity: 0.5 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: themeColors.surface },
  helpText: { fontSize: 12, color: themeColors.neutral[500], marginTop: 4 },
  saveBtn: { 
    margin: spacing.lg, 
    height: 50,
    borderRadius: radii.full, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadows.md,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  footer: { alignItems: 'center', marginTop: 20 },
  versionText: { fontSize: 12, color: themeColors.neutral[500], fontWeight: '700' },
  footerText: { fontSize: 10, color: themeColors.neutral[400], marginTop: 4 },
  emptyApprovalsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 0,
    ...shadows.sm,
  },
  emptyApprovalsText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  approvalCard: {
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 0,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  approvalInfo: {
    flex: 1,
  },
  approvalName: {
    fontSize: 15,
    fontWeight: '800',
  },
  approvalDetail: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  approvalLocation: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  approveBtnMini: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.full,
    ...shadows.md,
  },
  approveBtnMiniText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default SettingsScreen;
