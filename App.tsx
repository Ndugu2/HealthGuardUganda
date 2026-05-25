import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import {
  Provider as PaperProvider,
  BottomNavigation,
  Text,
  Icon,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import './src/i18n/i18n';
import { initDatabase, getSetting, saveSetting } from './src/db/Database';
import { radii, spacing, shadows } from './src/theme';
import { ThemeProvider, useAppTheme, getPaperTheme } from './src/ThemeContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import DiseaseStatsScreen from './src/screens/DiseaseStatsScreen';
import DrugInfoScreen from './src/screens/DrugInfoScreen';
import GuidelinesScreen from './src/screens/GuidelinesScreen';
import VaccinationScreen from './src/screens/VaccinationScreen';
import FAQScreen from './src/screens/FAQScreen';
import AnalyzeScreen from './src/screens/AnalyzeScreen';
import KnowledgeScreen from './src/screens/KnowledgeScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import FacilitiesScreen from './src/screens/FacilitiesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AcademyScreen from './src/screens/AcademyScreen';
import LandingScreen from './src/screens/LandingScreen';
import PatientQueueScreen from './src/screens/PatientQueueScreen';
import AlertCenterScreen from './src/screens/AlertCenterScreen';
import MoreScreen from './src/screens/MoreScreen';
import { isOfflineToken } from './src/config';

// Services
import { AuthService } from './src/services/AuthService';
import { SyncService } from './src/services/SyncService';
import { ActivityIndicator } from 'react-native-paper';
import { FederatedService } from './src/services/FederatedService';
import { ConnectivityService } from './src/services/ConnectivityService';

function MainApp() {
  const { t, i18n } = useTranslation();
  const { mode, toggleTheme, colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;
  
  const [index, setIndex] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [selectedRole, setSelectedRole] = useState<'COMMUNITY' | 'HW' | 'ADMIN' | undefined>(undefined);

  // ... existing code lines remain unchanged

  const [showLanding, setShowLanding] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [signal, setSignal] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');
  const [isOnline, setIsOnline] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const routes = React.useMemo(() => {
    const rawRoutes = (() => {
      if (user?.role === 'COMMUNITY') {
        return [
          { key: 'home', title: t('nav.home'), fallback: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
          { key: 'analyze', title: t('nav.analyze'), fallback: 'Analyze', focusedIcon: 'magnify-scan', unfocusedIcon: 'magnify' },
          { key: 'knowledge', title: t('nav.knowledge'), fallback: 'Knowledge', focusedIcon: 'book-open-variant', unfocusedIcon: 'book-outline' },
          { key: 'facilities', title: t('nav.facilities'), fallback: 'Facilities', focusedIcon: 'hospital-marker', unfocusedIcon: 'hospital-building' },
          { key: 'more', title: t('nav.more'), fallback: 'More', focusedIcon: 'dots-grid', unfocusedIcon: 'dots-horizontal' },
        ];
      }
      if (user?.role === 'ADMIN') {
        return [
          { key: 'home', title: t('nav.home'), fallback: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
          { key: 'analyze', title: t('nav.analyze'), fallback: 'Analyze', focusedIcon: 'magnify-scan', unfocusedIcon: 'magnify' },
          { key: 'knowledge', title: t('nav.knowledge'), fallback: 'Knowledge', focusedIcon: 'book-open-variant', unfocusedIcon: 'book-outline' },
          { key: 'reports', title: t('nav.reports'), fallback: 'Reports', focusedIcon: 'chart-bar', unfocusedIcon: 'chart-bar-stacked' },
          { key: 'facilities', title: t('nav.facilities'), fallback: 'Facilities', focusedIcon: 'hospital-marker', unfocusedIcon: 'hospital-building' },
          { key: 'more', title: t('nav.more'), fallback: 'More', focusedIcon: 'dots-grid', unfocusedIcon: 'dots-horizontal' },
        ];
      }
      // HEALTH WORKER
      return [
        { key: 'home', title: t('nav.home'), fallback: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
        { key: 'analyze', title: t('nav.analyze'), fallback: 'Analyze', focusedIcon: 'magnify-scan', unfocusedIcon: 'magnify' },
        { key: 'knowledge', title: t('nav.knowledge'), fallback: 'Knowledge', focusedIcon: 'book-open-variant', unfocusedIcon: 'book-outline' },
        { key: 'reports', title: t('nav.reports'), fallback: 'Reports', focusedIcon: 'chart-bar', unfocusedIcon: 'chart-bar-stacked' },
        { key: 'facilities', title: t('nav.facilities'), fallback: 'Facilities', focusedIcon: 'hospital-marker', unfocusedIcon: 'hospital-building' },
        { key: 'more', title: t('nav.more'), fallback: 'More', focusedIcon: 'dots-grid', unfocusedIcon: 'dots-horizontal' },
      ];
    })();

    return rawRoutes.map(route => {
      const isRawTranslationKey = route.title && route.title.startsWith('nav.');
      return {
        key: route.key,
        title: (isRawTranslationKey || !route.title) ? route.fallback : route.title,
        focusedIcon: route.focusedIcon,
        unfocusedIcon: route.unfocusedIcon,
      };
    });
  }, [t, user?.role]);

  const connectionLabel = React.useMemo(() => {
    if (!isOnline) return t('status.offline');
    if (sessionToken && isOfflineToken(sessionToken)) return t('status.online_demo');
    return t('status.online_server');
  }, [isOnline, sessionToken, t]);

  const checkAuth = useCallback(async () => {
    const session = await AuthService.getSession();
    if (session) {
      setIsAuthenticated(true);
      setUser(session.user);
      setSessionToken(session.token);
      setIndex(0);
    } else {
      setIsAuthenticated(false);
      setSessionToken(null);
    }
  }, []);

  useEffect(() => {
    const startup = async () => {
      try {
        await initDatabase();
        
        // Auto-seed knowledge on first run
        const hasSeeded = await getSetting('knowledge_seeded_v75');
        if (!hasSeeded) {
          await SyncService.seedLocalKnowledge();
          await saveSetting('knowledge_seeded_v75', 'true');
        }
        
        checkAuth();

        // ─── AUTO-SYNC: Pull latest data when online ───────────────
        const online = await ConnectivityService.isOnline();
        setIsOnline(online);
        if (online) {
          console.log('[AutoSync] Network detected — syncing knowledge...');
          const pullResult = await SyncService.pullKnowledge();
          if (pullResult.success) {
            console.log(`[AutoSync] Downloaded ${pullResult.count} knowledge items from server`);
          }
          // Push any pending encounters silently
          const pushResult = await SyncService.pushEncounters();
          if (pushResult.success && (pushResult.count || 0) > 0) {
            console.log(`[AutoSync] Uploaded ${pushResult.count} pending encounters`);
          }
        } else {
          console.log('[AutoSync] Offline — using local knowledge base');
        }
      } catch (e: any) {
        console.error("Initialization error:", e);
        setIsAuthenticated(false);
      }
    };
    startup();
  }, [checkAuth]);

  // ─── REAL CONNECTIVITY MONITORING ─────────────────────────────────────────
  useEffect(() => {
    // Initial signal check
    const checkSignal = async () => {
      const s = await ConnectivityService.getSignalStrength();
      setSignal(s);
    };
    checkSignal();

    // Subscribe to real connectivity changes
    const unsubscribe = ConnectivityService.subscribeToConnectivityChanges(
      async (online) => {
        setIsOnline(online);
        const s = await ConnectivityService.getSignalStrength();
        setSignal(s);

        // Auto-sync when reconnecting
        if (online) {
          console.log('[Connectivity] Back online — triggering background sync...');
          SyncService.pullKnowledge().then(res => {
            if (res.success) console.log(`[BackgroundSync] Pulled ${res.count} items`);
          });
        }
      }
    );

    // Also poll every 15 seconds for signal strength updates
    const interval = setInterval(checkSignal, 15000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const pushRes = await SyncService.pushEncounters();
      const pullRes = await SyncService.pullKnowledge();
      
      if (pushRes.success && pullRes.success) {
        alert(`${t('common.sync_success') || 'Sync Successful!'}\nUploaded: ${pushRes.count || 0}\nDownloaded: ${pullRes.count || 0}`);
      } else {
        alert(`${t('common.sync_partial') || 'Sync Partial'}: ${pushRes.error || pullRes.error}`);
      }
    } catch (e) {
      alert(t('common.sync_failed') || 'Sync Failed: Check server connection');
    } finally {
      setSyncing(false);
    }
  };

  const handleFederatedSync = async () => {
    setSyncing(true);
    try {
      const res = await FederatedService.pushModelUpdates();
      if (res.success) {
        alert(t('common.federated_success') || 'Federated Sync Complete: Local model weights successfully merged into National AI Engine. Your claims data remained private on-device.');
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      alert('Federated Sync Failed: ' + e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setSessionToken(null);
  };

  const navigateToTab = useCallback((key: string) => {
    const idx = routes.findIndex((r) => r.key === key);
    if (idx >= 0) setIndex(idx);
  }, [routes]);

  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'home': return <HomeScreen navigateToTab={navigateToTab} userRole={user?.role} />;
      case 'analyze': return <AnalyzeScreen navigateToTab={navigateToTab} userRole={user?.role} onLogout={handleLogout} />;
      case 'knowledge': return <KnowledgeScreen userRole={user?.role} onLogout={handleLogout} />;
      case 'reports': return <ReportsScreen />;
      case 'facilities': return <FacilitiesScreen />;
      case 'academy': return <AcademyScreen />;
      case 'settings': return <SettingsScreen onLogout={handleLogout} />;
      case 'more': return <MoreScreen navigateToTab={navigateToTab} userRole={user?.role} />;
      case 'queue': return <PatientQueueScreen />;
      case 'alerts': return <AlertCenterScreen userRole={user?.role} />;
      // Knowledge‑enrichment screens
      case 'stats': return <DiseaseStatsScreen />;
      case 'drugs': return <DrugInfoScreen />;
      case 'guidelines': return <GuidelinesScreen />;
      case 'vaccination': return <VaccinationScreen />;
      case 'faq': return <FAQScreen />;
      default: return null;
    }
  };

  const [showRegister, setShowRegister] = useState(false);

  if (!isAuthenticated) {
    if (showLanding) {
      return <LandingScreen onLoginPress={(role) => {
        setSelectedRole(role);
        setShowLanding(false);
        // Direct to login for all roles
        setShowRegister(false);
      }} />;
    }
    if (showRegister) {
      return <RegisterScreen onRegisterSuccess={() => { setShowRegister(false); setShowLanding(false); }} onBack={() => { setShowRegister(false); setShowLanding(true); }} />;
    }
    return <LoginScreen onLoginSuccess={checkAuth} onBack={() => setShowLanding(true)} roleHint={selectedRole} />;
  }

  const Container = Platform.OS === 'web' ? View : SafeAreaView;
  const paperTheme = getPaperTheme(mode);

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar barStyle={mode === 'light' ? "dark-content" : "light-content"} backgroundColor={colors.surface} />
      <Container style={[styles.container, { backgroundColor: colors.background }]}>
        
        {isDesktop ? (
          <View style={styles.desktopWrapper}>
            {/* ── LEFT SIDEBAR ── */}
            <View style={[styles.sidebar, { backgroundColor: colors.surface, borderRightColor: colors.neutral[100] }]}>
              <View style={styles.sidebarLogo}>
                 <Icon source="shield-plus" size={32} color={colors.primary[900]} />
                 <Text style={[styles.sidebarLogoText, { color: colors.primary[900] }]}>HealthGuard</Text>
                 <Text style={[styles.sidebarLogoSub, { color: colors.neutral[400] }]}>Uganda</Text>
              </View>

              <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false}>
                {routes.map((route, i) => (
                  <TouchableOpacity 
                    key={route.key} 
                    onPress={() => setIndex(i)}
                    style={[
                      styles.sidebarItem, 
                      index === i && { backgroundColor: mode === 'light' ? '#F3F9EE' : colors.neutral[100] }
                    ]}
                  >
                    <Icon 
                      source={index === i ? route.focusedIcon : route.unfocusedIcon} 
                      size={22} 
                      color={index === i ? colors.primary[600] : colors.neutral[400]} 
                    />
                    <Text style={[
                      styles.sidebarText, 
                      { color: index === i ? colors.neutral[900] : colors.neutral[500] },
                      index === i && { fontWeight: '800' }
                    ]}>
                      {route.title}
                    </Text>
                    {index === i && (
                      <View style={[styles.activeIndicatorBox, { backgroundColor: colors.primary[50] }]} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={[styles.sidebarFooter, { borderTopColor: colors.neutral[100] }]}>
                  {user?.role !== 'COMMUNITY' && (
                    <>
                      <TouchableOpacity 
                        style={styles.syncBtnSidebar} 
                        onPress={handleSync}
                        disabled={syncing}
                      >
                        <Icon source="database-sync" size={20} color={colors.primary[900]} />
                        <Text style={[styles.syncTextSidebar, { color: colors.primary[900] }]}>
                          {syncing ? t('sidebar.syncing') : t('sidebar.sync_db')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.syncBtnSidebar} 
                        onPress={handleFederatedSync}
                        disabled={syncing}
                      >
                        <Icon source="shield-key-outline" size={20} color={colors.primary[900]} />
                        <Text style={[styles.syncTextSidebar, { color: colors.primary[900] }]}>
                          {syncing ? t('sidebar.improving') : t('sidebar.private_sync')}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity 
                    style={styles.themeToggleSidebar} 
                    onPress={toggleTheme}
                  >
                    <Icon source={mode === 'light' ? 'weather-night' : 'weather-sunny'} size={20} color={colors.neutral[600]} />
                    <Text style={[styles.themeToggleText, { color: colors.neutral[600] }]}>
                      {mode === 'light' ? t('sidebar.dark_mode') : t('sidebar.light_mode')}
                    </Text>
                  </TouchableOpacity>

                 <View style={styles.userProfile}>
                   <View style={[styles.userAvatar, { backgroundColor: colors.primary[900] }]}>
                     <Text style={styles.avatarLabel}>{user?.name?.substring(0, 2).toUpperCase() || 'HW'}</Text>
                   </View>
                   <View style={{ flex: 1 }}>
                     <Text style={[styles.userName, { color: colors.neutral[900] }]}>{user?.name || 'Health Worker'}</Text>
                     <Text style={[styles.userRole, { color: colors.neutral[500] }]}>{user?.district || 'Uganda'}</Text>
                   </View>
                   <TouchableOpacity onPress={handleLogout}>
                     <Icon source="logout" size={20} color={colors.neutral[400]} />
                   </TouchableOpacity>
                 </View>
                  <View style={[styles.offlinePillSidebar, { backgroundColor: mode === 'light' ? '#E2F0D9' : colors.neutral[100] }]}>
                     <Icon 
                        source={isOnline ? (signal === 'HIGH' ? "cloud-check" : "cloud-sync") : "cloud-off-outline"} 
                        size={14} 
                        color={isOnline ? colors.primary[800] : colors.warning[900]} 
                      />
                    <Text style={[styles.offlineTextSidebar, { color: colors.primary[900] }]}>
                      {connectionLabel}
                    </Text>
                  </View>
              </View>
            </View>

            {/* ── MAIN CONTENT AREA ── */}
            <View style={[styles.mainArea, { backgroundColor: colors.background }]}>
               <View style={[styles.topUtilityBar, { backgroundColor: colors.surface, borderBottomColor: colors.neutral[100] }]}>
                  <Text style={[styles.pathText, { color: colors.neutral[400] }]}>{t('sidebar.dashboard')} / {routes[index].title.toUpperCase()}</Text>
                  <View style={styles.topActions}>
                     {user?.role !== 'COMMUNITY' && (
                        <TouchableOpacity onPress={handleSync} disabled={syncing}>
                           <Icon source={syncing ? "loading" : "sync"} size={20} color={colors.neutral[500]} />
                        </TouchableOpacity>
                     )}
                     <TouchableOpacity onPress={toggleTheme}>
                        <Icon source={mode === 'light' ? 'moon-waning-crescent' : 'white-balance-sunny'} size={20} color={colors.neutral[500]} />
                     </TouchableOpacity>
                     <TouchableOpacity onPress={() => i18n.changeLanguage(i18n.language === 'en' ? 'lg' : 'en')}>
                        <Icon source="translate" size={20} color={colors.neutral[500]} />
                     </TouchableOpacity>
                     <Icon source="bell-outline" size={20} color={colors.neutral[500]} />
                     <TouchableOpacity onPress={handleLogout}>
                        <Icon source="logout" size={20} color={colors.neutral[500]} />
                     </TouchableOpacity>
                  </View>
               </View>
               <View style={styles.sceneWrapper}>
                  {renderScene({ route: routes[index] })}
               </View>
            </View>
          </View>
        ) : (
          <BottomNavigation
            navigationState={{ index, routes }}
            onIndexChange={setIndex}
            renderScene={renderScene}
            barStyle={[styles.navBar, { backgroundColor: colors.surface, borderTopColor: colors.neutral[100] }]}
            activeColor={colors.primary[900]}
            inactiveColor={colors.neutral[500]}
            activeIndicatorStyle={{ backgroundColor: colors.primary[50] }}
            shifting={false}
          />
        )}
      </Container>
    </PaperProvider>
  );
}


export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  // Desktop Wrapper
  desktopWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  // Sidebar
  sidebar: {
    width: 280,
    borderRightWidth: 1,
    paddingVertical: spacing.xl,
    justifyContent: 'space-between',
    ...shadows.md,
    zIndex: 20,
  },
  sidebarLogo: {
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  sidebarLogoText: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 10,
  },
  sidebarLogoSub: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: -4,
  },
  sidebarNav: {
    flex: 1,
    paddingHorizontal: 15,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: radii.md,
    marginBottom: 8,
    position: 'relative',
  },
  sidebarText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
    letterSpacing: -0.2,
  },
  activeIndicatorBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 4,
    bottom: 4,
    borderRadius: radii.md,
    zIndex: -1,
    opacity: 0.8,
  },
  sidebarFooter: {
    paddingHorizontal: 20,
    paddingTop: 24,
    borderTopWidth: 1,
    gap: 4,
  },
  themeToggleSidebar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  themeToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: radii.lg,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  avatarLabel: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  userRole: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  syncBtnSidebar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  syncTextSidebar: {
    fontSize: 14,
    fontWeight: '700',
  },
  offlinePillSidebar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  offlineTextSidebar: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  // Main Area
  mainArea: {
    flex: 1,
  },
  topUtilityBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    borderBottomWidth: 1,
  },
  pathText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  sceneWrapper: {
    flex: 1,
  },
  // Mobile
  navBar: {
    elevation: 0,
    borderTopWidth: 1,
  },
});
