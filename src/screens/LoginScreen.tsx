import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ScrollView,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { Text, Icon, ActivityIndicator, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthService, User } from '../services/AuthService';
import { NotificationService } from '../services/NotificationService';
import { colors, spacing, radii, shadows } from '../theme';
import { useAppTheme } from '../ThemeContext';
import { ValidationService } from '../services/ValidationService';
import AnimatedCard from '../components/AnimatedCard';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onBack?: () => void;
  /** Optional role hint passed from landing screen to pre-select registration role */
  roleHint?: 'COMMUNITY' | 'HW' | 'ADMIN';
  /** Navigate to the standalone RegisterScreen */
  onRegisterPress?: (role?: 'COMMUNITY' | 'HW' | 'ADMIN') => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onBack, roleHint, onRegisterPress }) => {
  const { t } = useTranslation();
  const { colors: themeColors, mode } = useAppTheme();
  const { width, height } = useWindowDimensions();
  
  const isDesktop = width > 900;
  const isMobile = width < 768;
  const isSmall = width < 400 || height < 700;

  // Active role state, pre-seeded from roleHint or defaulting to COMMUNITY
  const [activeRole, setActiveRole] = useState<'COMMUNITY' | 'HW' | 'ADMIN'>(roleHint ?? 'COMMUNITY');

  // Input states
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Focus and Diagnostics State
  const [focusedField, setFocusedField] = useState<
    'phone' | 'password' | 'name' | 'email' | 'district' | 'village' | 'adminCode' | null
  >(null);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  // Success Handshake States
  const [loginSuccessUser, setLoginSuccessUser] = useState<User | null>(null);
  const [handshakeStep, setHandshakeStep] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardGlowAnim = useRef(new Animated.Value(0)).current;

  // Live session clock — enterprise-grade timestamp
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Subtle card glow pulse on mount
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardGlowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(cardGlowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, [cardGlowAnim]);

  // Registration states
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDistrict, setRegDistrict] = useState('');
  const [regVillage, setRegVillage] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  const [registrationStep, setRegistrationStep] = useState<'FORM' | 'OTP'>('FORM');
  const [generatedOTP, setGeneratedOTP] = useState<string | null>(null);
  const [enteredOTP, setEnteredOTP] = useState('');
  const [districtSuggestions, setDistrictSuggestions] = useState<string[]>([]);

  const [loginErrors, setLoginErrors] = useState<{ phone?: string; password?: string }>({});
  const [regErrors, setRegErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    district?: string;
    village?: string;
    password?: string;
    confirmPassword?: string;
    adminCode?: string;
  }>({});

  // Forgot Password states
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<'SELECT' | 'REQUEST' | 'VERIFY'>('SELECT');
  const [forgotMethod, setForgotMethod] = useState<'phone' | 'email'>('phone');
  const [forgotValue, setForgotValue] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotGeneratedCode, setForgotGeneratedCode] = useState<string | null>(null);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Pulsing animation for verification shield
  useEffect(() => {
    if (successMessage === 'SECURE_HANDSHAKE') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.in(Easing.ease),
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [successMessage, pulseAnim]);

  // Sync active role when roleHint changes
  useEffect(() => {
    if (roleHint) {
      setActiveRole(roleHint);
    }
  }, [roleHint]);

  const getPortalTheme = () => {
    if (activeRole === 'COMMUNITY') {
      return {
        primary: '#10B981', // Vivid Emerald Green
        primaryDark: '#047857',
        secondary: '#ECFDF5',
        badgeBg: '#D1FAE5',
        badgeText: '#065F46',
        glow: 'rgba(16, 185, 129, 0.15)',
        title: 'Community Public Portal',
        subtitle: 'Access community health guidelines, submit local alerts, and report misinformation.',
        badgeLabel: 'HEALTHGUARD COMMUNITY',
        demoPhone: '0702000002',
        demoPass: 'community123',
        demoName: 'Babirye Florence',
        bgOverlay: 'rgba(4, 47, 31, 0.85)',
      };
    }
    if (activeRole === 'HW') {
      return {
        primary: '#0284C7', // Medical Sky Blue
        primaryDark: '#0369A1',
        secondary: '#F0F9FF',
        badgeBg: '#E0F2FE',
        badgeText: '#0369A1',
        glow: 'rgba(2, 132, 199, 0.15)',
        title: 'Clinical Care Gateway',
        subtitle: 'Secure medical portal to sync patient histories, manage drug inventory, and report claims.',
        badgeLabel: 'CLINICAL CARE GATEWAY',
        demoPhone: '0701000001',
        demoPass: 'healthworker',
        demoName: 'Nurse Nalubega',
        bgOverlay: 'rgba(7, 89, 133, 0.85)',
      };
    }
    return {
      primary: '#475569', // Slate Gray
      primaryDark: '#1E293B',
      secondary: '#F8FAFC',
      badgeBg: '#F1F5F9',
      badgeText: '#334155',
      glow: 'rgba(71, 85, 105, 0.15)',
      title: 'MoH Digital Admin',
      subtitle: 'System administrative portal to authorize facilities, verify users, and monitor analytics.',
      badgeLabel: 'MOH SECURE ADMIN',
      demoPhone: '0700000000',
      demoPass: 'password123',
      demoName: 'Dr. Mukasa John',
      bgOverlay: 'rgba(15, 23, 42, 0.9)',
    };
  };

  const portal = getPortalTheme();

  const handleLogin = async () => {
    const errors: { phone?: string; password?: string } = {};
    if (!phone.trim()) {
      errors.phone = t('auth.phone_required') || 'Phone number is required';
    } else if (!ValidationService.isValidUgandanPhone(phone)) {
      errors.phone = 'Enter a valid Ugandan phone number (e.g. 07XXXXXXXX)';
    }

    if (!password) {
      errors.password = t('auth.password_required') || 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    setLoginErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    const result = await AuthService.login(phone, password, activeRole);
    setLoading(false);

    if (result.success) {
      const session = await AuthService.getSession();
      if (session) {
        setLoginSuccessUser(session.user);
      }
      
      // Open the premium success handshake overlay
      setSuccessMessage('SECURE_HANDSHAKE');
      setHandshakeStep(0);
      progressAnim.setValue(0);

      // Smooth progress bar animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false,
        easing: Easing.inOut(Easing.quad),
      }).start();

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep += 1;
        if (currentStep <= 3) {
          setHandshakeStep(currentStep);
        } else {
          setSuccessMessage('✅ Login successful! Redirecting...');
          setTimeout(() => onLoginSuccess(), 400);
        }
      }, 700);
    } else {
      Alert.alert(t('auth.login_failed'), result.error || t('auth.invalid_creds'));
    }
  };

  const handleRegister = async () => {
    const errors: typeof regErrors = {};
    if (!regName.trim()) {
      errors.name = 'Full name is required';
    } else if (!ValidationService.isValidFullName(regName)) {
      errors.name = 'Enter both first and last name (letters only)';
    }
    
    if (!regEmail.trim()) {
      errors.email = 'Email is required';
    } else if (!ValidationService.isValidEmail(regEmail)) {
      errors.email = 'Email address is invalid';
    }

    if (!regPhone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!ValidationService.isValidUgandanPhone(regPhone)) {
      errors.phone = 'Enter a valid Ugandan phone number (e.g. 07XXXXXXXX)';
    }

    if (!regDistrict.trim()) {
      errors.district = 'District is required';
    } else if (!ValidationService.isValidDistrict(regDistrict)) {
      errors.district = 'Please enter a valid district in Uganda';
    }

    if (!regVillage.trim()) {
      errors.village = 'Village/Parish is required';
    }

    if (!regPassword) {
      errors.password = 'Password is required';
    } else {
      const pwdStrength = ValidationService.isStrongPassword(regPassword);
      if (!pwdStrength.isValid) {
        errors.password = pwdStrength.errors[0];
      }
    }

    if (regPassword !== regConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (activeRole === 'ADMIN' && adminCode !== 'MoH-Admin-2026') {
      errors.adminCode = 'Invalid Admin Code';
    }

    setRegErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    const result = await AuthService.register({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      district: regDistrict,
      village: regVillage,
      role: activeRole,
    });
    setLoading(false);
    
    if (result.success && result.otp) {
      setGeneratedOTP(result.otp);
      setRegistrationStep('OTP');
    } else {
      Alert.alert('Registration Failed', result.error || 'Could not register user.');
    }
  };

  const handleVerifyOTP = async () => {
    if (enteredOTP !== generatedOTP) {
      Alert.alert('Invalid Code', 'The verification code you entered is incorrect.');
      return;
    }
    
    if (regEmail) {
      await NotificationService.sendWelcomeEmail(regEmail, regName);
    }
    
    let msg = '✅ Account created successfully! You can now sign in.';
    if (activeRole === 'HW') {
      msg = '✅ Account created! It is pending administrator approval before you can sign in.';
    } else if (activeRole === 'ADMIN') {
      msg = '✅ Administrator account created successfully! You can now sign in.';
    }
    
    setPhone(regPhone);
    setPassword(regPassword);
    setSuccessMessage(msg);
    setRegistrationStep('FORM');
    setIsRegisterMode(false);
    setEnteredOTP('');
    setGeneratedOTP(null);
    setTimeout(() => setSuccessMessage(null), 6000);
  };

  const handleQuickFill = (role: 'COMMUNITY' | 'HW' | 'ADMIN') => {
    setActiveRole(role);
    const mockTheme = getPortalThemeForRole(role);
    setPhone(mockTheme.demoPhone);
    setPassword(mockTheme.demoPass);
  };

  const getPortalThemeForRole = (role: 'COMMUNITY' | 'HW' | 'ADMIN') => {
    if (role === 'COMMUNITY') {
      return { demoPhone: '0702000002', demoPass: 'community123' };
    }
    if (role === 'HW') {
      return { demoPhone: '0701000001', demoPass: 'healthworker' };
    }
    return { demoPhone: '0700000000', demoPass: 'password123' };
  };

  const handleForgotRequest = async () => {
    setForgotError(null);
    if (forgotMethod === 'phone' && !ValidationService.isValidUgandanPhone(forgotValue)) {
      setForgotError('Enter a valid Ugandan phone number');
      return;
    }
    if (forgotMethod === 'email' && !ValidationService.isValidEmail(forgotValue)) {
      setForgotError('Enter a valid email address');
      return;
    }
    
    setLoading(true);
    const result = await AuthService.forgotPassword(forgotMethod, forgotValue);
    if (result.success && result.code) {
      setForgotGeneratedCode(result.code);
      if (forgotMethod === 'phone') {
        await NotificationService.sendPasswordResetSMS(forgotValue, result.code);
      } else {
        await NotificationService.sendPasswordResetEmail(forgotValue, result.code);
      }
      setForgotStep('VERIFY');
    } else {
      setForgotError(result.error || 'Could not find an account with that information.');
    }
    setLoading(false);
  };

  const handleForgotVerifyAndReset = async () => {
    setForgotError(null);
    if (forgotCode !== forgotGeneratedCode) {
      setForgotError('The verification code you entered is incorrect.');
      return;
    }
    const pwdStrength = ValidationService.isStrongPassword(forgotNewPassword);
    if (!pwdStrength.isValid) {
      setForgotError(pwdStrength.errors[0]);
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    const result = await AuthService.resetPassword(forgotMethod, forgotValue, forgotCode, forgotNewPassword);
    if (result.success) {
      setSuccessMessage('✅ Password reset successfully! You can now sign in with your new password.');
      setIsForgotMode(false);
      setForgotStep('SELECT');
      setTimeout(() => setSuccessMessage(null), 6000);
    } else {
      setForgotError(result.error || 'Could not reset password.');
    }
    setLoading(false);
  };

  const handleBlur = (field: keyof typeof regErrors) => {
    let error: string | undefined;
    if (field === 'name') {
      if (!regName.trim()) error = 'Full name is required';
      else if (!ValidationService.isValidFullName(regName)) error = 'Enter both first and last name (letters only)';
    } else if (field === 'email') {
      if (!regEmail.trim()) error = 'Email is required';
      else if (!ValidationService.isValidEmail(regEmail)) error = 'Email address is invalid';
    } else if (field === 'phone') {
      if (!regPhone.trim()) error = 'Phone number is required';
      else if (!ValidationService.isValidUgandanPhone(regPhone)) error = 'Phone number is invalid';
    } else if (field === 'district') {
      if (!regDistrict.trim()) error = 'District is required';
      else if (!ValidationService.isValidDistrict(regDistrict)) error = 'Please enter a valid district in Uganda';
    } else if (field === 'password') {
      if (!regPassword) {
        error = 'Password is required';
      } else {
        const pwdStrength = ValidationService.isStrongPassword(regPassword);
        if (!pwdStrength.isValid) {
          error = pwdStrength.errors[0];
        }
      }
    } else if (field === 'confirmPassword') {
      if (regPassword !== regConfirmPassword) error = 'Passwords do not match';
    }
    
    if (error) {
      setRegErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // 🔐 Premium Success Handshake Overlay
  const renderSuccessHandshake = () => {
    const pulseScale = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.1],
    });

    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    const steps = [
      { id: 0, label: 'Securing encrypted storage keys...' },
      { id: 1, label: 'Validating device clinical token signatures...' },
      { id: 2, label: 'Establishing tunnel connection to national servers...' },
      { id: 3, label: 'Access Authorized! Building dashboard console...' },
    ];

    return (
      <View style={[styles.successOverlay, { backgroundColor: themeColors.surface }]}>
        <View style={styles.successContent}>
          {/* Animated pulsing shield and checkmark */}
          <Animated.View style={[styles.successShieldContainer, { transform: [{ scale: pulseScale }] }]}>
            <LinearGradient colors={[portal.primary, portal.primaryDark]} style={styles.successShieldGradient}>
              <Icon source="shield-check" size={54} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>

          <Text style={[styles.successSubtitle, { color: portal.primary }]}>
            SECURE DECRYPTION COMPLETED
          </Text>
          <Text style={[styles.successTitle, { color: themeColors.neutral[900] }]}>
            Access Granted
          </Text>
          <Text style={[styles.successGreeting, { color: themeColors.neutral[500] }]}>
            Welcome back, <Text style={{ color: themeColors.neutral[900], fontWeight: '900' }}>
              {loginSuccessUser?.name || 'Authorized User'}
            </Text>
          </Text>

          <View style={[styles.successRoleBadge, { backgroundColor: portal.secondary }]}>
            <View style={[styles.liveIndicatorDot, { backgroundColor: portal.primary }]} />
            <Text style={[styles.successRoleText, { color: portal.primaryDark }]}>
              {loginSuccessUser?.role === 'HW'
                ? 'Clinical Health Worker'
                : loginSuccessUser?.role === 'ADMIN'
                ? 'Ministry Administrator'
                : 'Verified Community Member'}
            </Text>
          </View>

          {/* Secure Handshake Checklist */}
          <View style={[styles.handshakeBox, { backgroundColor: themeColors.neutral[50] }]}>
            {steps.map((step) => {
              const active = handshakeStep >= step.id;
              const isCurrent = handshakeStep === step.id;
              return (
                <View key={step.id} style={styles.handshakeStepRow}>
                  {active ? (
                    <Icon source="checkbox-marked-circle" size={18} color={portal.primary} />
                  ) : (
                    <View style={styles.handshakeStepPendingDot} />
                  )}
                  <Text
                    style={[
                      styles.handshakeStepText,
                      {
                        color: active
                          ? themeColors.neutral[800]
                          : themeColors.neutral[400],
                        fontWeight: isCurrent ? '700' : '500',
                      },
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Secure Handshake Progress Bar */}
          <View style={styles.handshakeProgressBarContainer}>
            <Animated.View
              style={[
                styles.handshakeProgressBar,
                { width: progressWidth, backgroundColor: portal.primary },
              ]}
            />
          </View>
          <Text style={[styles.handshakeProgressLabel, { color: themeColors.neutral[400] }]}>
            Initializing secure local database environment...
          </Text>
        </View>
      </View>
    );
  };

  const formatSessionTime = useCallback(() => {
    const h = currentTime.getHours().toString().padStart(2, '0');
    const m = currentTime.getMinutes().toString().padStart(2, '0');
    const s = currentTime.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, [currentTime]);

  const formatSessionDate = useCallback(() => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
    return currentTime.toLocaleDateString('en-UG', options).toUpperCase();
  }, [currentTime]);

  const renderLoginForm = () => (
    <AnimatedCard delay={100} style={[styles.loginCard, { backgroundColor: themeColors.surface }]}>
      {/* ── Secure Session Header Bar ── */}
      <View style={[styles.secureSessionBar, { backgroundColor: themeColors.neutral[900] }]}>
        <View style={styles.sessionBarLeft}>
          <View style={[styles.sessionLiveDot, { backgroundColor: '#22C55E' }]} />
          <Text style={styles.sessionBarLabel}>SECURE SESSION</Text>
        </View>
        <View style={styles.sessionBarRight}>
          <Icon source="clock-outline" size={11} color="rgba(255,255,255,0.5)" />
          <Text style={styles.sessionBarTime}>{formatSessionTime()}</Text>
        </View>
      </View>

      {successMessage && successMessage !== 'SECURE_HANDSHAKE' && (
        <View style={styles.successMessageBanner}>
          <Icon source="check-circle-outline" size={20} color="#065F46" />
          <Text style={styles.successMessageText}>{successMessage}</Text>
          <TouchableOpacity onPress={() => setSuccessMessage(null)}>
            <Icon source="close" size={18} color="#065F46" />
          </TouchableOpacity>
        </View>
      )}

      {onBack && (
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Icon source="arrow-left" size={24} color={themeColors.neutral[600]} />
        </TouchableOpacity>
      )}

      <View style={[styles.cardInnerPad]}>
        <View style={styles.header}>
          {/* Ministry Crest / Medical Insignia Logo */}
          <View style={[styles.logoShieldOuter, { borderColor: portal.primary + '20' }]}>
            <LinearGradient
              colors={[portal.primary, portal.primaryDark]}
              style={styles.logoShieldGradient}
            >
              <Icon source="shield-plus" size={28} color="#FFFFFF" />
            </LinearGradient>
          </View>

          {/* Portal Switching Segmented Tabs */}
          <View style={[styles.segmentedRoleTabs, { backgroundColor: themeColors.neutral[100] }]}>
            {(['COMMUNITY', 'HW', 'ADMIN'] as const).map((role) => {
              const isActive = activeRole === role;
              const label = role === 'COMMUNITY' ? 'Community' : role === 'HW' ? 'Clinical' : 'Admin';
              const roleIcon = role === 'COMMUNITY' ? 'account-group-outline' : role === 'HW' ? 'stethoscope' : 'shield-lock-outline';
              return (
                <TouchableOpacity
                  key={role}
                  onPress={() => {
                    setActiveRole(role);
                    setLoginErrors({});
                  }}
                  style={[
                    styles.segmentedTab,
                    isActive && {
                      backgroundColor: themeColors.surface,
                      ...shadows.sm,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Icon source={roleIcon} size={14} color={isActive ? portal.primaryDark : themeColors.neutral[400]} />
                    <Text
                      style={[
                        styles.segmentedTabText,
                        {
                          color: isActive ? portal.primaryDark : themeColors.neutral[500],
                          fontWeight: isActive ? '900' : '600',
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.title, { color: themeColors.neutral[900] }]}>{portal.title}</Text>
          <Text style={[styles.subtitle, { color: themeColors.neutral[500] }]}>{portal.subtitle}</Text>

          {/* Session date display */}
          <View style={[styles.sessionDateRow, { backgroundColor: themeColors.neutral[50], borderColor: themeColors.neutral[200] }]}>
            <Icon source="calendar-outline" size={12} color={themeColors.neutral[400]} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: themeColors.neutral[400], letterSpacing: 1 }}>
              {formatSessionDate()}
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          {Platform.OS === 'web' && (
            <TextInput
              style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
              autoComplete="username"
              value=""
              onChangeText={() => {}}
            />
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeColors.neutral[500] }]}>REGISTERED PHONE NUMBER</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View
                style={[
                  styles.inputBox,
                  {
                    flex: 0.4,
                    backgroundColor: themeColors.neutral[50],
                    borderWidth: loginErrors.phone ? 1.5 : 1,
                    borderColor: loginErrors.phone ? '#EF4444' : themeColors.neutral[200],
                    justifyContent: 'center',
                  },
                ]}
              >
                <Text style={{ fontSize: 16, color: themeColors.neutral[500] }}>🇺🇬</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: themeColors.neutral[700], letterSpacing: 0.3 }}>
                  +256
                </Text>
              </View>
              <View
                style={[
                  styles.inputBox,
                  {
                    flex: 0.6,
                    backgroundColor: focusedField === 'phone' ? portal.glow : themeColors.neutral[50],
                    borderWidth: focusedField === 'phone' ? 2 : loginErrors.phone ? 1.5 : 1,
                    borderColor: focusedField === 'phone'
                      ? portal.primary
                      : loginErrors.phone
                      ? '#EF4444'
                      : themeColors.neutral[200],
                  },
                ]}
              >
                <Icon source="phone-outline" size={18} color={focusedField === 'phone' ? portal.primary : themeColors.neutral[400]} />
                <TextInput
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    setLoginErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="07XX XXX XXX"
                  placeholderTextColor={themeColors.neutral[400]}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  style={[styles.input, { color: themeColors.neutral[900] }]}
                />
              </View>
            </View>
            {loginErrors.phone && <Text style={styles.errorText}>{loginErrors.phone}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.label, { color: themeColors.neutral[500] }]}>PASSWORD</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsForgotMode(true);
                  setForgotStep('SELECT');
                  setForgotError(null);
                  setForgotValue('');
                  setForgotCode('');
                  setForgotGeneratedCode(null);
                  setForgotNewPassword('');
                  setForgotConfirmPassword('');
                }}
              >
                <Text style={[styles.forgotText, { color: portal.primary }]}>
                  Forgot?
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.inputBox,
                {
                  backgroundColor: focusedField === 'password' ? portal.glow : themeColors.neutral[50],
                  borderWidth: focusedField === 'password' ? 2 : loginErrors.password ? 1.5 : 1,
                  borderColor: focusedField === 'password'
                    ? portal.primary
                    : loginErrors.password
                    ? '#EF4444'
                    : themeColors.neutral[200],
                },
              ]}
            >
              <Icon source="lock-outline" size={18} color={focusedField === 'password' ? portal.primary : themeColors.neutral[400]} />
              <TextInput
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  setLoginErrors((prev) => ({ ...prev, password: undefined }));
                }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your secure password"
                placeholderTextColor={themeColors.neutral[400]}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                style={[styles.input, { color: themeColors.neutral[900] }]}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon
                  source={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={themeColors.neutral[400]}
                />
              </TouchableOpacity>
            </View>
            {loginErrors.password && <Text style={styles.errorText}>{loginErrors.password}</Text>}
          </View>

          {/* Primary Sign-In Button with Gradient */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            style={{ marginTop: 4 }}
          >
            <LinearGradient
              colors={[portal.primary, portal.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginBtn}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Icon source="shield-check-outline" size={18} color="#FFF" />
                  <Text style={styles.loginBtnText}>Authenticate & Sign In</Text>
                  <Icon source="arrow-right" size={18} color="rgba(255,255,255,0.7)" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: themeColors.neutral[500], fontSize: 13 }]}>
              No account?{' '}
            </Text>
            <TouchableOpacity onPress={() => {
              if (onRegisterPress) {
                onRegisterPress(activeRole);
              } else {
                setIsRegisterMode(true);
              }
            }}>
              <Text
                style={[
                  styles.registerText,
                  { color: portal.primaryDark, fontSize: 13 },
                ]}
              >
                Create Credentials →
              </Text>
            </TouchableOpacity>
          </View>

          {/* 🔐 Branded Collapsible Diagnostics Drawer */}
          <View style={[styles.diagnosticsContainer, { borderColor: themeColors.neutral[200] }]}>
            <TouchableOpacity
              onPress={() => setIsDiagnosticsOpen(!isDiagnosticsOpen)}
              style={[styles.diagnosticsHeader, { backgroundColor: themeColors.neutral[50] }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon source="test-tube" size={14} color={themeColors.neutral[500]} />
                <Text style={{ fontSize: 10, fontWeight: '800', color: themeColors.neutral[600], letterSpacing: 0.8 }}>
                  DEMO ENVIRONMENT
                </Text>
              </View>
              <Icon
                source={isDiagnosticsOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={themeColors.neutral[500]}
              />
            </TouchableOpacity>

            {isDiagnosticsOpen && (
              <View style={styles.diagnosticsContent}>
                <Text style={{ fontSize: 11, color: themeColors.neutral[500], lineHeight: 16, marginBottom: 8 }}>
                  Use these test accounts to verify role authorization, offline SQLite caching, and MoH validations.
                </Text>
                <View style={{ gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => handleQuickFill('COMMUNITY')}
                    style={[styles.diagnosticsFillBtn, { borderColor: '#10B981' }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Icon source="account-outline" size={14} color="#047857" />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#047857' }}>
                        Community — 0702 000 002
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleQuickFill('HW')}
                    style={[styles.diagnosticsFillBtn, { borderColor: '#0284C7' }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Icon source="stethoscope" size={14} color="#0369A1" />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#0369A1' }}>
                        Health Worker — 0701 000 001
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleQuickFill('ADMIN')}
                    style={[styles.diagnosticsFillBtn, { borderColor: '#475569' }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Icon source="shield-lock-outline" size={14} color="#1E293B" />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#1E293B' }}>
                        System Admin — 0700 000 000
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Encrypted Connection Footer ── */}
        <View style={[styles.encryptedFooter, { borderTopColor: themeColors.neutral[100] }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon source="lock-outline" size={11} color={themeColors.neutral[400]} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: themeColors.neutral[400], letterSpacing: 0.3 }}>
              AES-256 Encrypted
            </Text>
          </View>
          <View style={styles.encryptedDividerDot} />
          <Text style={{ fontSize: 10, fontWeight: '600', color: themeColors.neutral[400] }}>
            Ministry of Health Uganda
          </Text>
        </View>
      </View>
    </AnimatedCard>
  );

  const renderRegisterForm = () => (
    <AnimatedCard delay={100} style={[styles.loginCard, { backgroundColor: themeColors.surface }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => setIsRegisterMode(false)}>
        <Icon source="arrow-left" size={24} color={themeColors.neutral[600]} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.logoShieldCircle, { backgroundColor: portal.secondary }]}>
          <Icon source="account-plus-outline" size={32} color={portal.primary} />
        </View>
        <Text style={[styles.title, { color: themeColors.neutral[900] }]}>
          {registrationStep === 'OTP' ? 'Identity Verification' : 'Clinical Registration'}
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.neutral[500] }]}>
          {registrationStep === 'OTP'
            ? `Enter the 6-digit confirmation code dispatched to ${regPhone}`
            : `Create an authorized digital account inside the ${portal.title}`}
        </Text>
      </View>

      {registrationStep === 'OTP' ? (
        <View style={styles.form}>
          {generatedOTP && (
            <View style={styles.otpBanner}>
              <View style={styles.otpBannerBadge}>
                <Icon source="message-text-outline" size={18} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.otpBannerTitle}>📱 SIMULATED SMS DISPATCHED</Text>
                <Text style={styles.otpBannerMessage}>
                  Verification Code:{' '}
                  <Text style={{ fontWeight: '900', fontSize: 16, letterSpacing: 2, color: '#15803D' }}>
                    {generatedOTP}
                  </Text>
                </Text>
                <Text style={{ fontSize: 10, color: '#22C55E', marginTop: 4 }}>
                  Real SMS networks configured in background.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeColors.neutral[500] }]}>VERIFICATION CODE</Text>
            <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: 1, borderColor: themeColors.neutral[200] }]}>
              <Icon source="message-processing-outline" size={20} color={themeColors.neutral[400]} />
              <TextInput
                value={enteredOTP}
                onChangeText={setEnteredOTP}
                placeholder="000000"
                placeholderTextColor={themeColors.neutral[400]}
                keyboardType="number-pad"
                maxLength={6}
                style={[styles.input, { color: themeColors.neutral[900], fontSize: 22, letterSpacing: 8, textAlign: 'center' }]}
              />
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.loginBtn, { backgroundColor: portal.primary }]} 
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.loginBtnText}>Confirm Identity</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setRegistrationStep('FORM')} style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: themeColors.neutral[600], fontSize: 13, textDecorationLine: 'underline' }}>
              Change Registered Phone
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={{ maxHeight: isDesktop ? 480 : 380 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.md }}>
            <View style={styles.form}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.neutral[500] }]}>FULL NAME</Text>
                <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: focusedField === 'name' ? 2 : regErrors.name ? 1.5 : 1, borderColor: focusedField === 'name' ? portal.primary : regErrors.name ? '#EF4444' : themeColors.neutral[200] }]}>
                  <Icon source="account-outline" size={18} color={themeColors.neutral[400]} />
                  <TextInput
                    value={regName}
                    onChangeText={(val) => { setRegName(val); setRegErrors(prev => ({ ...prev, name: undefined })); }}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => { setFocusedField(null); handleBlur('name'); }}
                    placeholder="e.g. Nurse Nalubega"
                    placeholderTextColor={themeColors.neutral[400]}
                    style={[styles.input, { color: themeColors.neutral[900] }]}
                  />
                </View>
                {regErrors.name && <Text style={styles.errorText}>{regErrors.name}</Text>}
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.neutral[500] }]}>EMAIL ADDRESS</Text>
                <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: focusedField === 'email' ? 2 : regErrors.email ? 1.5 : 1, borderColor: focusedField === 'email' ? portal.primary : regErrors.email ? '#EF4444' : themeColors.neutral[200] }]}>
                  <Icon source="email-outline" size={18} color={themeColors.neutral[400]} />
                  <TextInput
                    value={regEmail}
                    onChangeText={(val) => { setRegEmail(val); setRegErrors(prev => ({ ...prev, email: undefined })); }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => { setFocusedField(null); handleBlur('email'); }}
                    placeholder="example@healthguard.ug"
                    placeholderTextColor={themeColors.neutral[400]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.input, { color: themeColors.neutral[900] }]}
                  />
                </View>
                {regErrors.email && <Text style={styles.errorText}>{regErrors.email}</Text>}
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.neutral[500] }]}>PHONE NUMBER</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={[styles.inputBox, { flex: 0.45, backgroundColor: themeColors.neutral[50], borderWidth: 1, borderColor: themeColors.neutral[200], justifyContent: 'center' }]}>
                    <Icon source="web" size={16} color={themeColors.neutral[400]} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: themeColors.neutral[700] }}>UG (+256)</Text>
                  </View>
                  <View style={[styles.inputBox, { flex: 0.55, backgroundColor: themeColors.neutral[50], borderWidth: focusedField === 'phone' ? 2 : regErrors.phone ? 1.5 : 1, borderColor: focusedField === 'phone' ? portal.primary : regErrors.phone ? '#EF4444' : themeColors.neutral[200] }]}>
                    <Icon source="phone-outline" size={18} color={themeColors.neutral[400]} />
                    <TextInput
                      value={regPhone}
                      onChangeText={(val) => { setRegPhone(val); setRegErrors(prev => ({ ...prev, phone: undefined })); }}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => { setFocusedField(null); handleBlur('phone'); }}
                      placeholder="0701000001"
                      placeholderTextColor={themeColors.neutral[400]}
                      keyboardType="phone-pad"
                      style={[styles.input, { color: themeColors.neutral[900] }]}
                    />
                  </View>
                </View>
                {regErrors.phone && <Text style={styles.errorText}>{regErrors.phone}</Text>}
              </View>

              {/* District */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.neutral[500] }]}>DISTRICT</Text>
                <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: focusedField === 'district' ? 2 : regErrors.district ? 1.5 : 1, borderColor: focusedField === 'district' ? portal.primary : regErrors.district ? '#EF4444' : themeColors.neutral[200] }]}>
                  <Icon source="map-marker-outline" size={18} color={themeColors.neutral[400]} />
                  <TextInput
                    value={regDistrict}
                    onChangeText={(val) => {
                      setRegDistrict(val);
                      setRegErrors(prev => ({ ...prev, district: undefined }));
                      setDistrictSuggestions(ValidationService.getDistrictSuggestions(val));
                    }}
                    onFocus={() => setFocusedField('district')}
                    onBlur={() => {
                      setFocusedField(null);
                      setTimeout(() => handleBlur('district'), 250);
                    }}
                    placeholder="e.g. Kampala"
                    placeholderTextColor={themeColors.neutral[400]}
                    style={[styles.input, { color: themeColors.neutral[900] }]}
                  />
                </View>
                {districtSuggestions.length > 0 && (
                  <View style={[styles.districtSuggestionsDropdown, { backgroundColor: themeColors.surface }]}>
                    {districtSuggestions.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.districtSuggestionsItem, { borderBottomColor: themeColors.neutral[100] }]}
                        onPress={() => {
                          setRegDistrict(item);
                          setDistrictSuggestions([]);
                          setRegErrors(prev => ({ ...prev, district: undefined }));
                        }}
                      >
                        <Text style={{ color: themeColors.neutral[800], fontSize: 13, fontWeight: '700' }}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {regErrors.district && <Text style={styles.errorText}>{regErrors.district}</Text>}
              </View>

              {/* Village */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.neutral[500] }]}>VILLAGE / PARISH</Text>
                <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: regErrors.village ? 1.5 : 1, borderColor: regErrors.village ? '#EF4444' : themeColors.neutral[200] }]}>
                  <Icon source="home-outline" size={18} color={themeColors.neutral[400]} />
                  <TextInput
                    value={regVillage}
                    onChangeText={(val) => { setRegVillage(val); setRegErrors(prev => ({ ...prev, village: undefined })); }}
                    placeholder="e.g. Kalerwe"
                    placeholderTextColor={themeColors.neutral[400]}
                    style={[styles.input, { color: themeColors.neutral[900] }]}
                  />
                </View>
                {regErrors.village && <Text style={styles.errorText}>{regErrors.village}</Text>}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.neutral[500] }]}>PASSWORD</Text>
                <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: focusedField === 'password' ? 2 : regErrors.password ? 1.5 : 1, borderColor: focusedField === 'password' ? portal.primary : regErrors.password ? '#EF4444' : themeColors.neutral[200] }]}>
                  <Icon source="lock-outline" size={18} color={themeColors.neutral[400]} />
                  <TextInput
                    value={regPassword}
                    onChangeText={(val) => { setRegPassword(val); setRegErrors(prev => ({ ...prev, password: undefined, confirmPassword: undefined })); }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => { setFocusedField(null); handleBlur('password'); }}
                    placeholder="••••••••"
                    placeholderTextColor={themeColors.neutral[400]}
                    secureTextEntry={!showRegPassword}
                    style={[styles.input, { color: themeColors.neutral[900] }]}
                  />
                  <TouchableOpacity onPress={() => setShowRegPassword(!showRegPassword)}>
                    <Icon source={showRegPassword ? "eye-off-outline" : "eye-outline"} size={18} color={themeColors.neutral[400]} />
                  </TouchableOpacity>
                </View>
                {regErrors.password && <Text style={styles.errorText}>{regErrors.password}</Text>}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.neutral[500] }]}>CONFIRM PASSWORD</Text>
                <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: regErrors.confirmPassword ? 1.5 : 1, borderColor: regErrors.confirmPassword ? '#EF4444' : themeColors.neutral[200] }]}>
                  <Icon source="lock-check-outline" size={18} color={themeColors.neutral[400]} />
                  <TextInput
                    value={regConfirmPassword}
                    onChangeText={(val) => { setRegConfirmPassword(val); setRegErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
                    placeholder="••••••••"
                    placeholderTextColor={themeColors.neutral[400]}
                    secureTextEntry={!showRegConfirmPassword}
                    style={[styles.input, { color: themeColors.neutral[900] }]}
                  />
                  <TouchableOpacity onPress={() => setShowRegConfirmPassword(!showRegConfirmPassword)}>
                    <Icon source={showRegConfirmPassword ? "eye-off-outline" : "eye-outline"} size={18} color={themeColors.neutral[400]} />
                  </TouchableOpacity>
                </View>
                {regErrors.confirmPassword && <Text style={styles.errorText}>{regErrors.confirmPassword}</Text>}
              </View>

              {/* Admin verification code */}
              {activeRole === 'ADMIN' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: themeColors.neutral[500] }]}>ADMIN PASSCODE</Text>
                  <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: focusedField === 'adminCode' ? 2 : regErrors.adminCode ? 1.5 : 1, borderColor: focusedField === 'adminCode' ? portal.primary : regErrors.adminCode ? '#EF4444' : themeColors.neutral[200] }]}>
                    <Icon source="key-outline" size={18} color={themeColors.neutral[400]} />
                    <TextInput
                      value={adminCode}
                      onChangeText={(val) => { setAdminCode(val); setRegErrors(prev => ({ ...prev, adminCode: undefined })); }}
                      onFocus={() => setFocusedField('adminCode')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter MoH administrative key"
                      placeholderTextColor={themeColors.neutral[400]}
                      secureTextEntry
                      style={[styles.input, { color: themeColors.neutral[900] }]}
                    />
                  </View>
                  {regErrors.adminCode && <Text style={styles.errorText}>{regErrors.adminCode}</Text>}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action button */}
          <View style={{ marginTop: spacing.md }}>
            <TouchableOpacity 
              style={[styles.loginBtn, { backgroundColor: portal.primary }]} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Create Credentials</Text>
                  <Icon source="chevron-right" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: themeColors.neutral[500], fontSize: 13 }]}>
                Already registered?{' '}
              </Text>
              <TouchableOpacity onPress={() => setIsRegisterMode(false)}>
                <Text style={[styles.registerText, { color: portal.primaryDark, fontSize: 13, textDecorationLine: 'underline' }]}>
                  Login here
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </AnimatedCard>
  );

  const renderForgotPasswordForm = () => (
    <AnimatedCard delay={100} style={[styles.loginCard, { backgroundColor: themeColors.surface }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => {
        if (forgotStep === 'REQUEST') setForgotStep('SELECT');
        else if (forgotStep === 'VERIFY') setForgotStep('REQUEST');
        else setIsForgotMode(false);
      }}>
        <Icon source="arrow-left" size={24} color={themeColors.neutral[600]} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.logoShieldCircle, { backgroundColor: portal.secondary }]}>
          <Icon source={forgotStep === 'VERIFY' ? 'shield-key-outline' : 'lock-reset'} size={32} color={portal.primary} />
        </View>
        <Text style={[styles.title, { color: themeColors.neutral[900] }]}>
          {forgotStep === 'SELECT' ? 'Reset Passcode' : forgotStep === 'REQUEST' ? (forgotMethod === 'phone' ? 'Enter Phone Number' : 'Enter Email Address') : 'Set New Password'}
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.neutral[500] }]}>
          {forgotStep === 'SELECT'
            ? 'Choose how you want to receive your security confirmation code'
            : forgotStep === 'REQUEST'
              ? (forgotMethod === 'phone' ? 'Enter the verified phone number linked to your account' : 'Enter the email address linked to your account')
              : `Enter the 6-digit confirmation code dispatched to ${forgotValue}`}
        </Text>
      </View>

      <View style={styles.form}>
        {forgotError && (
          <View style={styles.errorBanner}>
            <Icon source="alert-circle-outline" size={18} color="#DC2626" />
            <Text style={styles.errorBannerText}>{forgotError}</Text>
          </View>
        )}

        {forgotStep === 'SELECT' && (
          <>
            <TouchableOpacity
              onPress={() => { setForgotMethod('phone'); setForgotStep('REQUEST'); setForgotValue(''); setForgotError(null); }}
              style={[styles.forgotOptionBtn, { backgroundColor: themeColors.neutral[50], borderColor: themeColors.neutral[200] }]}
            >
              <Icon source="message-text-outline" size={24} color={portal.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: themeColors.neutral[900] }}>Reset via SMS Code</Text>
                <Text style={{ fontSize: 12, color: themeColors.neutral[500], marginTop: 2 }}>Confirm your mobile identity locally</Text>
              </View>
              <Icon source="chevron-right" size={20} color={themeColors.neutral[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setForgotMethod('email'); setForgotStep('REQUEST'); setForgotValue(''); setForgotError(null); }}
              style={[styles.forgotOptionBtn, { backgroundColor: themeColors.neutral[50], borderColor: themeColors.neutral[200] }]}
            >
              <Icon source="email-outline" size={24} color={portal.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: themeColors.neutral[900] }}>Reset via Email Link</Text>
                <Text style={{ fontSize: 12, color: themeColors.neutral[500], marginTop: 2 }}>Secure confirmation dispatched to inbox</Text>
              </View>
              <Icon source="chevron-right" size={20} color={themeColors.neutral[400]} />
            </TouchableOpacity>
          </>
        )}

        {forgotStep === 'REQUEST' && (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.neutral[500] }]}>{forgotMethod === 'phone' ? 'PHONE NUMBER' : 'EMAIL ADDRESS'}</Text>
              <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: 1, borderColor: themeColors.neutral[200] }]}>
                <Icon source={forgotMethod === 'phone' ? 'phone-outline' : 'email-outline'} size={20} color={themeColors.neutral[400]} />
                <TextInput
                  value={forgotValue}
                  onChangeText={setForgotValue}
                  placeholder={forgotMethod === 'phone' ? '0772 000 000' : 'name@example.com'}
                  placeholderTextColor={themeColors.neutral[400]}
                  keyboardType={forgotMethod === 'phone' ? 'phone-pad' : 'email-address'}
                  autoCapitalize="none"
                  style={[styles.input, { color: themeColors.neutral[900] }]}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: portal.primary }]}
              onPress={handleForgotRequest}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginBtnText}>Dispatch Code</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {forgotStep === 'VERIFY' && (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.neutral[500] }]}>VERIFICATION CODE</Text>
              <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: 1, borderColor: themeColors.neutral[200] }]}>
                <Icon source="message-processing-outline" size={20} color={themeColors.neutral[400]} />
                <TextInput
                  value={forgotCode}
                  onChangeText={setForgotCode}
                  placeholder="000000"
                  placeholderTextColor={themeColors.neutral[400]}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[styles.input, { color: themeColors.neutral[900], fontSize: 22, letterSpacing: 8, textAlign: 'center' }]}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.neutral[500] }]}>NEW PASSCODE</Text>
              <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: 1, borderColor: themeColors.neutral[200] }]}>
                <Icon source="lock-outline" size={20} color={themeColors.neutral[400]} />
                <TextInput
                  value={forgotNewPassword}
                  onChangeText={setForgotNewPassword}
                  placeholder="••••••••"
                  placeholderTextColor={themeColors.neutral[400]}
                  secureTextEntry={!showForgotNewPassword}
                  style={[styles.input, { color: themeColors.neutral[900] }]}
                />
                <TouchableOpacity onPress={() => setShowForgotNewPassword(!showForgotNewPassword)}>
                  <Icon source={showForgotNewPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={themeColors.neutral[400]} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.neutral[500] }]}>CONFIRM NEW PASSCODE</Text>
              <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: 1, borderColor: themeColors.neutral[200] }]}>
                <Icon source="lock-check-outline" size={20} color={themeColors.neutral[400]} />
                <TextInput
                  value={forgotConfirmPassword}
                  onChangeText={setForgotConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={themeColors.neutral[400]}
                  secureTextEntry
                  style={[styles.input, { color: themeColors.neutral[900] }]}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: portal.primary }]}
              onPress={handleForgotVerifyAndReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginBtnText}>Reset Credentials</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setForgotStep('REQUEST'); setForgotCode(''); setForgotGeneratedCode(null); setForgotError(null); }} style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={{ color: themeColors.neutral[600], fontSize: 13, textDecorationLine: 'underline' }}>Resend code</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={[styles.footer, { marginTop: 20 }]}>
          <Text style={[styles.footerText, { color: themeColors.neutral[600], fontSize: 13 }]}>Remembered passcode? </Text>
          <TouchableOpacity onPress={() => setIsForgotMode(false)}>
            <Text style={[styles.registerText, { color: portal.primaryDark, fontSize: 13, textDecorationLine: 'underline' }]}>Back to secure login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedCard>
  );

  const currentForm = isForgotMode
    ? renderForgotPasswordForm()
    : isRegisterMode
      ? renderRegisterForm()
      : renderLoginForm();

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {/* 🔐 Access Granted Secure Handshake UI */}
      {successMessage === 'SECURE_HANDSHAKE' && renderSuccessHandshake()}

      {successMessage !== 'SECURE_HANDSHAKE' && (
        isDesktop ? (
          <View style={styles.desktopLayout}>
            {/* Beautiful secure clinical branding left panel */}
            <View style={styles.leftCol}>
              <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?q=80&w=2000&auto=format&fit=crop' }}
                style={styles.heroImage}
              >
                <View style={[styles.heroOverlay, { backgroundColor: portal.bgOverlay }]}>
                  <View style={styles.brandingHeaderRow}>
                    <View style={styles.logoShieldOuter}>
                      <View style={styles.logoShieldGradient}>
                        <Icon source="shield-plus" size={28} color="#FFFFFF" />
                      </View>
                    </View>
                    <Text style={styles.brandingLogoText}>HEALTHGUARD UGANDA</Text>
                  </View>

                  <Text style={styles.heroTitle}>{t('auth.hero_title') || 'National Misinformation Sentinel'}</Text>
                  <Text style={styles.heroSub}>{t('auth.hero_sub') || 'Securing Ugandan clinics, community nodes, and regional admins with diagnostic offline verification.'}</Text>
                  
                  {/* Trust metrics panel */}
                  <View style={styles.trustMetricsPanel}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>1,420+</Text>
                      <Text style={styles.metricLabel}>Active Clinics</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>99.8%</Text>
                      <Text style={styles.metricLabel}>Diagnosis Accuracy</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>100%</Text>
                      <Text style={styles.metricLabel}>Offline Uptime</Text>
                    </View>
                  </View>

                  <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                      <Icon source="check-decagram" size={16} color="#FFF" />
                      <Text style={styles.badgeText}>{t('auth.moh_verified') || 'MoH Approved'}</Text>
                    </View>
                    <View style={styles.badge}>
                      <Icon source="cloud-check" size={16} color="#FFF" />
                      <Text style={styles.badgeText}>{t('auth.offline_capable') || 'SQLite Offline-First'}</Text>
                    </View>
                  </View>
                  <View style={styles.encryptedFooter}>
                    <Icon source="shield-lock" size={12} color="#64748B" />
                    <Text style={{ fontSize: 11, color: '#64748B' }}>AES‑256 Encrypted Connection</Text>
                    <View style={styles.encryptedDividerDot} />
                    <Text style={{ fontSize: 11, color: '#64748B' }}>{formatSessionDate()}</Text>
                  </View>
                </View>
              </ImageBackground>
            </View>
            <View style={styles.rightCol}>
              {currentForm}
            </View>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.mobileLayout, isSmall && styles.mobileLayoutSmall]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!isSmall && (
              <View style={[styles.mobileHeader, isSmall && styles.mobileHeaderSmall]}>
                <View style={[styles.mobileLogoCircle, { backgroundColor: portal.secondary }]}>
                  <Icon source="shield-plus" size={32} color={portal.primary} />
                </View>
                <Text style={[styles.mobileTitle, { color: portal.primary }]}>
                  HealthGuard Uganda
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: themeColors.neutral[500], marginTop: 2 }}>
                  SECURE CLINICAL NETWORK
                </Text>
              </View>
            )}
            {currentForm}
          </ScrollView>
        )
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
    padding: 60,
    justifyContent: 'center',
  },
  brandingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'absolute',
    top: 50,
    left: 60,
  },
  brandingLogoText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 52,
    marginBottom: 20,
    letterSpacing: -1,
  },
  heroSub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 26,
    maxWidth: 520,
    marginBottom: 40,
  },
  trustMetricsPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radii.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxWidth: 520,
    marginBottom: 40,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    fontSize: 12,
    fontWeight: '700',
  },
  mobileLayout: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  mobileLayoutSmall: {
    padding: spacing.md,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'flex-start',
  },
  mobileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  mobileHeaderSmall: {
    marginBottom: 12,
  },
  mobileLogoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...shadows.sm,
  },
  mobileTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  loginCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: radii.xl,
    ...shadows.lg,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  cardInnerPad: {
    padding: spacing.xl,
    paddingTop: 24,
  },
  secureSessionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sessionBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sessionBarLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
  },
  sessionBarTime: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    fontVariant: ['tabular-nums'] as any,
    letterSpacing: 0.5,
  },
  backBtn: {
    position: 'absolute',
    top: 24,
    left: 24,
    zIndex: 10,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoShieldOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoShieldGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  logoShieldCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...shadows.sm,
  },
  sessionDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    marginTop: 14,
  },
  segmentedRoleTabs: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    padding: 4,
    marginBottom: 24,
    width: '100%',
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  segmentedTabText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 54,
    borderRadius: radii.md,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  forgotBtn: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loginBtn: {
    height: 52,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadows.md,
  },
  loginBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
  },
  footerText: {
    fontSize: 13,
  },
  registerText: {
    fontSize: 13,
    fontWeight: '800',
  },
  diagnosticsContainer: {
    borderWidth: 1.5,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginTop: 12,
  },
  diagnosticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  diagnosticsContent: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  diagnosticsFillBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  encryptedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  encryptedDividerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    marginLeft: 4,
  },

  // Premium success handshake overlays
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successContent: {
    width: '100%',
    maxWidth: 450,
    alignItems: 'center',
    padding: spacing.xl,
  },
  successShieldContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(0,0,0,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successShieldGradient: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  successSubtitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 8,
  },
  successGreeting: {
    fontSize: 15,
    marginBottom: 16,
  },
  successRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
    marginBottom: 32,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  successRoleText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  handshakeBox: {
    width: '100%',
    padding: 20,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    marginBottom: 28,
  },
  handshakeStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  handshakeStepPendingDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  handshakeStepText: {
    fontSize: 13,
    flex: 1,
  },
  handshakeProgressBarContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 12,
  },
  handshakeProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  handshakeProgressLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Error banners
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },

  // OTP Banners
  otpBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  otpBannerBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBannerTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  otpBannerMessage: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
  },

  // District dropdowns
  districtSuggestionsDropdown: {
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: radii.md,
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
    overflow: 'hidden',
  },
  districtSuggestionsItem: {
    padding: 14,
    borderBottomWidth: 1,
  },

  // Success generic banner
  successMessageBanner: {
    backgroundColor: '#D1FAE5',
    borderColor: '#34D399',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  successMessageText: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },

  // Forgot options buttons
  forgotOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    gap: 14,
    height: 'auto' as any,
  },
});

export default LoginScreen;
