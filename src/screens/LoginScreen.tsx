import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, Icon, ActivityIndicator, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { AuthService } from '../services/AuthService';
import { colors, spacing, radii, shadows } from '../theme';
import { useAppTheme } from '../ThemeContext';
import AnimatedCard from '../components/AnimatedCard';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const { colors: themeColors, mode } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert(t('auth.missing_info'), t('auth.enter_credentials'));
      return;
    }

    setLoading(true);
    const result = await AuthService.login(phone, password);
    setLoading(false);

    if (result.success) {
      onLoginSuccess();
    } else {
      Alert.alert(t('auth.login_failed'), result.error || t('auth.invalid_creds'));
    }
  };

  const renderLoginForm = () => (
    <AnimatedCard delay={100} style={[styles.loginCard, { backgroundColor: themeColors.surface }]}>
      <View style={styles.header}>
        <View style={[styles.logoCircle, { backgroundColor: themeColors.primary[50] }]}>
          <Icon source="shield-plus" size={32} color={themeColors.primary[900]} />
        </View>
        <Text style={[styles.title, { color: themeColors.primary[900] }]}>{t('auth.title')}</Text>
        <Text style={[styles.subtitle, { color: themeColors.neutral[500] }]}>{t('auth.subtitle')}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: themeColors.neutral[600] }]}>{t('auth.phone')}</Text>
          <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderColor: themeColors.neutral[200] }]}>
            <Icon source="phone-outline" size={20} color={themeColors.neutral[400]} />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 0700000000"
              placeholderTextColor={themeColors.neutral[400]}
              keyboardType="phone-pad"
              style={[styles.input, { color: themeColors.neutral[900] }]}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: themeColors.neutral[600] }]}>{t('auth.password')}</Text>
          <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderColor: themeColors.neutral[200] }]}>
            <Icon source="lock-outline" size={20} color={themeColors.neutral[400]} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={themeColors.neutral[400]}
              secureTextEntry={!showPassword}
              style={[styles.input, { color: themeColors.neutral[900] }]}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon source={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={themeColors.neutral[400]} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={[styles.forgotText, { color: themeColors.primary[900] }]}>{t('auth.forgot')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginBtn, { backgroundColor: themeColors.primary[900] }]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.loginBtnText}>{t('auth.sign_in')}</Text>
              <Icon source="arrow-right" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: themeColors.neutral[500] }]}>{t('auth.no_account')}</Text>
          <TouchableOpacity>
            <Text style={[styles.registerText, { color: themeColors.primary[900] }]}>{t('auth.contact_admin')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedCard>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {isDesktop ? (
        <View style={styles.desktopLayout}>
          <View style={styles.leftCol}>
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?q=80&w=2000&auto=format&fit=crop' }}
              style={styles.heroImage}
            >
              <View style={styles.heroOverlay}>
                <Text style={styles.heroTitle}>{t('auth.hero_title')}</Text>
                <Text style={styles.heroSub}>{t('auth.hero_sub')}</Text>
                
                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Icon source="check-decagram" size={16} color="#FFF" />
                    <Text style={styles.badgeText}>{t('auth.moh_verified')}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Icon source="cloud-check" size={16} color="#FFF" />
                    <Text style={styles.badgeText}>{t('auth.offline_capable')}</Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </View>
          <View style={styles.rightCol}>
            {renderLoginForm()}
          </View>
        </View>
      ) : (
        <View style={styles.mobileLayout}>
          <View style={styles.mobileHeader}>
             <Icon source="shield-plus" size={48} color={themeColors.primary[900]} />
             <Text style={[styles.mobileTitle, { color: themeColors.primary[900] }]}>HealthGuard</Text>
          </View>
          {renderLoginForm()}
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  leftCol: {
    flex: 1.2,
  },
  rightCol: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  heroImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 47, 22, 0.7)',
    padding: 60,
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 56,
    marginBottom: 20,
  },
  heroSub: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 28,
    maxWidth: 500,
    marginBottom: 40,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 15,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  mobileLayout: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  mobileHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mobileTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 10,
  },
  loginCard: {
    width: '100%',
    maxWidth: 450,
    padding: 40,
    borderRadius: radii.xl,
    ...shadows.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
  },
  loginBtn: {
    height: 56,
    borderRadius: radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
    ...shadows.md,
  },
  loginBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
  },
  registerText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default LoginScreen;
