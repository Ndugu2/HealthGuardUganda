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
  ScrollView,
  Image,
} from 'react-native';
import { Text, Icon, ActivityIndicator, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { AuthService } from '../services/AuthService';
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
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onBack, roleHint }) => {
  const { t } = useTranslation();
  const { colors: themeColors, mode } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const isDesktop = width > 900;
  const isMobile = width < 768;
  const isSmall = width < 400 || height < 700;

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDistrict, setRegDistrict] = useState('');
  const [regVillage, setRegVillage] = useState('');
  const [regRole, setRegRole] = useState<'COMMUNITY' | 'HW' | 'ADMIN'>(roleHint ?? 'COMMUNITY');
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

  const getPortalTheme = () => {
    if (roleHint === 'COMMUNITY') {
      return {
        primary: '#2C5E3E', // Beautiful Emerald Green
        secondary: '#E2F0D9',
        badgeBg: '#E2F0D9',
        badgeText: '#2C5E3E',
        title: 'Community Portal Login',
        subtitle: 'Access community public health tools, fact-check local rumors, and track symptoms.',
        badgeLabel: 'HEALTHGUARD COMMUNITY',
        demoPhone: '0702000002',
        demoPass: 'community123',
        demoName: 'Babirye Florence',
        bgOverlay: 'rgba(6, 78, 59, 0.75)', // Deep emerald green transparent overlay
      };
    }
    if (roleHint === 'HW') {
      return {
        primary: '#0284C7', // Clean Blue-Teal
        secondary: '#E0F2FE',
        badgeBg: '#E0F2FE',
        badgeText: '#0369A1',
        title: 'Health Worker Login',
        subtitle: 'Secure clinical gateway to sync patient records, view queues, and access MoH manuals.',
        badgeLabel: 'CLINICAL CARE GATEWAY',
        demoPhone: '0701000001',
        demoPass: 'healthworker',
        demoName: 'Nurse Nalubega',
        bgOverlay: 'rgba(7, 89, 133, 0.75)', // Deep blue transparent overlay
      };
    }
    // Default or ADMIN
    return {
      primary: '#1E293B', // Sleek Royal Dark Slate
      secondary: '#F1F5F9',
      badgeBg: '#F1F5F9',
      badgeText: '#334155',
      title: 'Administrator Portal',
      subtitle: 'Authorize clinics, approve health worker credentials, and monitor systemic analytics.',
      badgeLabel: 'MOH SECURE ADMIN',
      demoPhone: '0700000000',
      demoPass: 'password123',
      demoName: 'Dr. Mukasa John',
      bgOverlay: 'rgba(15, 23, 42, 0.8)', // Very dark slate transparent overlay
    };
  };

  const portal = getPortalTheme();

  const handleLogin = async () => {
    const errors: { phone?: string; password?: string } = {};
    if (!phone.trim()) errors.phone = t('auth.phone_required') || 'Phone number is required';
    if (!password) errors.password = t('auth.password_required') || 'Password is required';
    setLoginErrors(errors);
    
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    const result = await AuthService.login(phone, password, roleHint);
    setLoading(false);

    if (result.success) {
      onLoginSuccess();
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
    } else if (!/\S+@\S+\.\S+/.test(regEmail)) {
      errors.email = 'Email address is invalid';
    }

    if (!regPhone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!ValidationService.isValidUgandanPhone(regPhone)) {
      errors.phone = 'Enter a valid Ugandan phone number (e.g. 07XXXXXXXX or +2567XXXXXXXX)';
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
        errors.password = pwdStrength.errors[0]; // show the first validation error
      }
    }

    if (regPassword !== regConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (regRole === 'ADMIN' && adminCode !== 'MoH-Admin-2026') {
      errors.adminCode = 'Invalid Admin Code';
    }

    setRegErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    const otp = AuthService.generateOTP();
    setGeneratedOTP(otp);
    await NotificationService.sendOTP(regPhone, otp);
    setLoading(false);
    
    setRegistrationStep('OTP');
  };

  const handleVerifyOTP = async () => {
    if (enteredOTP !== generatedOTP) {
      Alert.alert('Invalid Code', 'The verification code you entered is incorrect.');
      return;
    }

    setLoading(true);
    const result = await AuthService.register({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      district: regDistrict,
      village: regVillage,
      role: regRole,
    });
    setLoading(false);

    if (result.success) {
      if (regEmail) {
        await NotificationService.sendWelcomeEmail(regEmail, regName);
      }

      let msg = '✅ Account created successfully! You can now sign in.';
      if (regRole === 'HW') {
        msg = '✅ Account created! It is pending administrator approval before you can sign in.';
      } else if (regRole === 'ADMIN') {
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
    } else {
      Alert.alert('Registration Failed', result.error || 'Could not register user.');
    }
  };

  const handleBlur = (field: keyof typeof regErrors) => {
    let error: string | undefined;
    if (field === 'name') {
      if (!regName.trim()) error = 'Full name is required';
      else if (!ValidationService.isValidFullName(regName)) error = 'Enter both first and last name (letters only)';
    } else if (field === 'email') {
      if (!regEmail.trim()) error = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(regEmail)) error = 'Email address is invalid';
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

  const renderLoginForm = () => (
    <AnimatedCard delay={100} style={[styles.loginCard, { backgroundColor: themeColors.surface, maxWidth: 450 }]}>
      {successMessage && (
        <View style={{
          backgroundColor: '#D1FAE5',
          borderColor: '#34D399',
          borderWidth: 1,
          borderRadius: 10,
          padding: 14,
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
        }}>
          <Icon source="check-circle-outline" size={20} color="#065F46" />
          <Text style={{ color: '#065F46', fontWeight: '700', fontSize: 13, flex: 1, lineHeight: 20 }}>
            {successMessage}
          </Text>
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

      <View style={styles.header}>
        <Image 
          source={require('../../assets/landing_hero.png')} 
          style={{ width: 64, height: 64, borderRadius: 32, marginBottom: 16, resizeMode: 'cover' }} 
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: portal.badgeBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.full, marginBottom: 16 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: portal.badgeText, marginRight: 6 }} />
          <Text style={{ fontSize: 10, fontWeight: '800', color: portal.badgeText, letterSpacing: 0.5 }}>{portal.badgeLabel}</Text>
        </View>
        <Text style={[styles.title, { color: themeColors.neutral[900], fontSize: 26, fontWeight: '800', textAlign: 'center' }]}>{portal.title}</Text>
        <Text style={[styles.subtitle, { color: themeColors.neutral[500], fontSize: 14, textAlign: 'center', marginTop: 4 }]}>{portal.subtitle}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: themeColors.neutral[500] }]}>PHONE NUMBER</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={[styles.inputBox, { flex: 0.5, backgroundColor: themeColors.neutral[50], borderWidth: loginErrors.phone ? 1 : 0, borderColor: loginErrors.phone ? '#EF4444' : undefined, justifyContent: 'center' }]}>
              <Icon source="web" size={16} color={themeColors.neutral[400]} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: themeColors.neutral[800] }}>Uganda (+256)</Text>
            </View>
            <View style={[styles.inputBox, { flex: 0.5, backgroundColor: themeColors.neutral[50], borderWidth: loginErrors.phone ? 1 : 0, borderColor: loginErrors.phone ? '#EF4444' : undefined }]}>
              <Icon source="phone-outline" size={16} color={themeColors.neutral[400]} />
              <TextInput
                value={phone}
                onChangeText={(val) => { setPhone(val); setLoginErrors(prev => ({ ...prev, phone: undefined })); }}
                placeholder="700 000 000"
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
          <Text style={[styles.label, { color: themeColors.neutral[500] }]}>PASSWORD</Text>
          <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: loginErrors.password ? 1 : 0, borderColor: loginErrors.password ? '#EF4444' : undefined }]}>
            <Icon source="lock-outline" size={20} color={themeColors.neutral[400]} />
            <TextInput
              value={password}
              onChangeText={(val) => { setPassword(val); setLoginErrors(prev => ({ ...prev, password: undefined })); }}
              placeholder="••••••••"
              placeholderTextColor={themeColors.neutral[400]}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              style={[styles.input, { color: themeColors.neutral[900] }]}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon source={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={themeColors.neutral[400]} />
            </TouchableOpacity>
          </View>
          {loginErrors.password && <Text style={styles.errorText}>{loginErrors.password}</Text>}
        </View>

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={[styles.forgotText, { color: themeColors.neutral[600] }]}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginBtn, { backgroundColor: portal.primary, borderRadius: radii.md, height: 50, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginTop: 10 }]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <View style={{ flex: 1, alignItems: 'center' }}>
               <ActivityIndicator color="#FFF" />
            </View>
          ) : (
            <>
              <View style={{ width: 20 }} /> {/* Spacer to center text */}
              <Text style={[styles.loginBtnText, { fontSize: 15, fontWeight: '700' }]}>Sign In</Text>
              <Icon source="chevron-right" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: themeColors.neutral[600], fontSize: 13 }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => setIsRegisterMode(true)}>
            <Text style={[styles.registerText, { color: themeColors.neutral[900], fontSize: 13, textDecorationLine: 'underline' }]}>Create one here</Text>
          </TouchableOpacity>
        </View>

        {/* Demo Credentials Hint */}
        <View style={[styles.demoHint, { backgroundColor: portal.secondary, borderColor: portal.primary, borderWidth: 0, borderRadius: radii.md, padding: 12 }]}>
          <Icon source="information-outline" size={14} color={portal.badgeText} />
          <Text style={[styles.demoHintText, { color: portal.badgeText, fontSize: 12 }]}>
            Demo ({portal.demoName}): <Text style={{ fontWeight: '800' }}>{portal.demoPhone}</Text> / <Text style={{ fontWeight: '800' }}>{portal.demoPass}</Text>
          </Text>
        </View>
      </View>
    </AnimatedCard>
  );

  const renderRegisterForm = () => (
    <AnimatedCard delay={100} style={[styles.loginCard, { backgroundColor: themeColors.surface, maxWidth: 450 }]}>
      {onBack && !isRegisterMode && (
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Icon source="arrow-left" size={24} color={themeColors.neutral[600]} />
        </TouchableOpacity>
      )}
      {isRegisterMode && (
        <TouchableOpacity style={styles.backBtn} onPress={() => setIsRegisterMode(false)}>
          <Icon source="arrow-left" size={24} color={themeColors.neutral[600]} />
        </TouchableOpacity>
      )}

      <View style={styles.header}>
        <Image 
          source={require('../../assets/landing_hero.png')} 
          style={{ width: 64, height: 64, borderRadius: 32, marginBottom: 16, resizeMode: 'cover' }} 
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: portal.badgeBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.full, marginBottom: 16 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: portal.badgeText, marginRight: 6 }} />
          <Text style={{ fontSize: 10, fontWeight: '800', color: portal.badgeText, letterSpacing: 0.5 }}>{portal.badgeLabel}</Text>
        </View>
        <Text style={[styles.title, { color: themeColors.neutral[900], fontSize: 26, fontWeight: '800', textAlign: 'center' }]}>
          {registrationStep === 'OTP' ? 'Verify Phone' : 'Join HealthGuard'}
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.neutral[500], fontSize: 14, textAlign: 'center', marginTop: 4 }]}>
          {registrationStep === 'OTP' ? `Enter the 6-digit code sent to ${regPhone}` : 'Create your account for the portal'}
        </Text>
      </View>

      {registrationStep === 'OTP' ? (
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeColors.neutral[500] }]}>VERIFICATION CODE</Text>
            <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: 0 }]}>
              <Icon source="message-processing-outline" size={20} color={themeColors.neutral[400]} />
              <TextInput
                value={enteredOTP}
                onChangeText={setEnteredOTP}
                placeholder="000000"
                placeholderTextColor={themeColors.neutral[400]}
                keyboardType="number-pad"
                maxLength={6}
                style={[styles.input, { color: themeColors.neutral[900], fontSize: 24, letterSpacing: 8, textAlign: 'center' }]}
              />
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.loginBtn, { backgroundColor: portal.primary, borderRadius: radii.md, height: 50, flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 24, marginTop: 10 }]} 
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={[styles.loginBtnText, { fontSize: 15, fontWeight: '700' }]}>Verify & Complete</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setRegistrationStep('FORM')} style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: themeColors.neutral[600], fontSize: 14, textDecorationLine: 'underline' }}>Change Phone Number</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
      <ScrollView style={{ maxHeight: isDesktop ? 500 : 380 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.md }}>
        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeColors.neutral[500] }]}>FULL NAME</Text>
            <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: regErrors.name ? 1 : 0, borderColor: regErrors.name ? '#EF4444' : undefined }]}>
              <Icon source="account-outline" size={20} color={themeColors.neutral[400]} />
              <TextInput
                value={regName}
                onChangeText={(val) => { setRegName(val); setRegErrors(prev => ({ ...prev, name: undefined })); }}
                onBlur={() => handleBlur('name')}
                placeholder="e.g. Dr. Mukasa John"
                placeholderTextColor={themeColors.neutral[400]}
                autoComplete="name"
                style={[styles.input, { color: themeColors.neutral[900] }]}
              />
            </View>
            {regErrors.name && <Text style={styles.errorText}>{regErrors.name}</Text>}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeColors.neutral[500] }]}>EMAIL ADDRESS</Text>
            <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: regErrors.email ? 1 : 0, borderColor: regErrors.email ? '#EF4444' : undefined }]}>
              <Icon source="email-outline" size={20} color={themeColors.neutral[400]} />
              <TextInput
                value={regEmail}
                onChangeText={(val) => { setRegEmail(val); setRegErrors(prev => ({ ...prev, email: undefined })); }}
                onBlur={() => handleBlur('email')}
                placeholder="joe@example.com"
                placeholderTextColor={themeColors.neutral[400]}
                keyboardType="email-address"
                autoComplete="email"
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
              <View style={[styles.inputBox, { flex: 0.5, backgroundColor: themeColors.neutral[50], borderWidth: regErrors.phone ? 1 : 0, borderColor: regErrors.phone ? '#EF4444' : undefined, justifyContent: 'center' }]}>
                <Icon source="web" size={16} color={themeColors.neutral[400]} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: themeColors.neutral[800] }}>Uganda (+256)</Text>
              </View>
              <View style={[styles.inputBox, { flex: 0.5, backgroundColor: themeColors.neutral[50], borderWidth: regErrors.phone ? 1 : 0, borderColor: regErrors.phone ? '#EF4444' : undefined }]}>
                <Icon source="phone-outline" size={16} color={themeColors.neutral[400]} />
                <TextInput
                  value={regPhone}
                  onChangeText={(val) => { setRegPhone(val); setRegErrors(prev => ({ ...prev, phone: undefined })); }}
                  onBlur={() => handleBlur('phone')}
                  placeholder="700 000 000"
                  placeholderTextColor={themeColors.neutral[400]}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  style={[styles.input, { color: themeColors.neutral[900] }]}
                />
              </View>
            </View>
            {regErrors.phone && <Text style={styles.errorText}>{regErrors.phone}</Text>}
          </View>

          {/* Profile Picture */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeColors.neutral[500] }]}>PROFILE PICTURE (OPTIONAL)</Text>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: radii.md, backgroundColor: themeColors.neutral[50], alignItems: 'center', justifyContent: 'center' }}>
                <Icon source="account-outline" size={24} color={themeColors.neutral[300]} />
              </View>
              <TouchableOpacity style={{ flex: 1, height: 56, borderRadius: radii.md, borderWidth: 1, borderColor: themeColors.neutral[200], flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Icon source="camera-outline" size={18} color={themeColors.neutral[600]} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: themeColors.neutral[600] }}>Add Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* District */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeColors.neutral[500] }]}>DISTRICT</Text>
            <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: regErrors.district ? 1 : 0, borderColor: regErrors.district ? '#EF4444' : undefined }]}>
              <Icon source="map-marker-outline" size={20} color={themeColors.neutral[400]} />
              <TextInput
                value={regDistrict}
                onChangeText={(val) => {
                  setRegDistrict(val);
                  setRegErrors(prev => ({ ...prev, district: undefined }));
                  setDistrictSuggestions(ValidationService.getDistrictSuggestions(val));
                }}
                onBlur={() => {
                  setTimeout(() => {
                    handleBlur('district');
                  }, 200);
                }}
                placeholder="e.g. Kampala"
                placeholderTextColor={themeColors.neutral[400]}
                autoComplete="off"
                style={[styles.input, { color: themeColors.neutral[900] }]}
              />
            </View>
            {districtSuggestions.length > 0 && (
              <View style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.neutral[200],
                borderWidth: 1,
                borderRadius: 8,
                marginTop: 4,
                zIndex: 1000,
                elevation: 5,
              }}>
                {districtSuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={{
                      padding: 12,
                      borderBottomWidth: index === districtSuggestions.length - 1 ? 0 : 1,
                      borderBottomColor: themeColors.neutral[100],
                    }}
                    onPress={() => {
                      setRegDistrict(item);
                      setDistrictSuggestions([]);
                      setRegErrors(prev => ({ ...prev, district: undefined }));
                    }}
                  >
                    <Text style={{ color: themeColors.neutral[800], fontSize: 14, fontWeight: '600' }}>
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
            <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: regErrors.village ? 1 : 0, borderColor: regErrors.village ? '#EF4444' : undefined }]}>
              <Icon source="home-outline" size={20} color={themeColors.neutral[400]} />
              <TextInput
                value={regVillage}
                onChangeText={(val) => { setRegVillage(val); setRegErrors(prev => ({ ...prev, village: undefined })); }}
                onBlur={() => handleBlur('village')}
                placeholder="e.g. Kalerwe"
                placeholderTextColor={themeColors.neutral[400]}
                autoComplete="off"
                style={[styles.input, { color: themeColors.neutral[900] }]}
              />
            </View>
            {regErrors.village && <Text style={styles.errorText}>{regErrors.village}</Text>}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeColors.neutral[500] }]}>PASSWORD</Text>
            <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: regErrors.password ? 1 : 0, borderColor: regErrors.password ? '#EF4444' : undefined }]}>
              <Icon source="lock-outline" size={20} color={themeColors.neutral[400]} />
              <TextInput
                value={regPassword}
                onChangeText={(val) => { setRegPassword(val); setRegErrors(prev => ({ ...prev, password: undefined, confirmPassword: undefined })); }}
                onBlur={() => handleBlur('password')}
                placeholder="••••••••"
                placeholderTextColor={themeColors.neutral[400]}
                secureTextEntry={!showRegPassword}
                autoComplete="new-password"
                style={[styles.input, { color: themeColors.neutral[900] }]}
              />
              <TouchableOpacity onPress={() => setShowRegPassword(!showRegPassword)}>
                <Icon source={showRegPassword ? "eye-off-outline" : "eye-outline"} size={20} color={themeColors.neutral[400]} />
              </TouchableOpacity>
            </View>
            {regErrors.password && <Text style={styles.errorText}>{regErrors.password}</Text>}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeColors.neutral[500] }]}>CONFIRM PASSWORD</Text>
            <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: regErrors.confirmPassword ? 1 : 0, borderColor: regErrors.confirmPassword ? '#EF4444' : undefined }]}>
              <Icon source="lock-check-outline" size={20} color={themeColors.neutral[400]} />
              <TextInput
                value={regConfirmPassword}
                onChangeText={(val) => { setRegConfirmPassword(val); setRegErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="••••••••"
                placeholderTextColor={themeColors.neutral[400]}
                secureTextEntry={!showRegConfirmPassword}
                autoComplete="new-password"
                style={[styles.input, { color: themeColors.neutral[900] }]}
              />
              <TouchableOpacity onPress={() => setShowRegConfirmPassword(!showRegConfirmPassword)}>
                <Icon source={showRegConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={themeColors.neutral[400]} />
              </TouchableOpacity>
            </View>
            {regErrors.confirmPassword && <Text style={styles.errorText}>{regErrors.confirmPassword}</Text>}
          </View>

          {/* Role Toggle Selector */}
          {(!roleHint) && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.neutral[500] }]}>CATEGORY / ROLE</Text>
              <View style={styles.roleToggleRow}>
                <TouchableOpacity 
                  onPress={() => setRegRole('COMMUNITY')} 
                  style={[
                    styles.roleToggleBtn, 
                    { 
                      borderColor: regRole === 'COMMUNITY' ? themeColors.primary[900] : themeColors.neutral[200],
                      backgroundColor: regRole === 'COMMUNITY' ? (mode === 'light' ? '#E2F0D9' : 'rgba(16, 185, 129, 0.15)') : 'transparent'
                    }
                  ]}
                >
                  <Icon source="account-multiple-outline" size={18} color={regRole === 'COMMUNITY' ? themeColors.primary[900] : themeColors.neutral[500]} />
                  <Text style={[styles.roleToggleText, { color: regRole === 'COMMUNITY' ? themeColors.primary[900] : themeColors.neutral[700] }]}>Community</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setRegRole('HW')} 
                  style={[
                    styles.roleToggleBtn, 
                    { 
                      borderColor: regRole === 'HW' ? themeColors.primary[900] : themeColors.neutral[200],
                      backgroundColor: regRole === 'HW' ? (mode === 'light' ? '#E2F0D9' : 'rgba(16, 185, 129, 0.15)') : 'transparent'
                    }
                  ]}
                >
                  <Icon source="doctor" size={18} color={regRole === 'HW' ? themeColors.primary[900] : themeColors.neutral[500]} />
                  <Text style={[styles.roleToggleText, { color: regRole === 'HW' ? themeColors.primary[900] : themeColors.neutral[700] }]}>Health Worker</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setRegRole('ADMIN')} 
                  style={[
                    styles.roleToggleBtn, 
                    { 
                      borderColor: regRole === 'ADMIN' ? themeColors.primary[900] : themeColors.neutral[200],
                      backgroundColor: regRole === 'ADMIN' ? (mode === 'light' ? '#E2F0D9' : 'rgba(16, 185, 129, 0.15)') : 'transparent'
                    }
                  ]}
                >
                  <Icon source="shield-account-outline" size={18} color={regRole === 'ADMIN' ? themeColors.primary[900] : themeColors.neutral[500]} />
                  <Text style={[styles.roleToggleText, { color: regRole === 'ADMIN' ? themeColors.primary[900] : themeColors.neutral[700] }]}>Admin</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Admin Verification Passcode Input */}
          {regRole === 'ADMIN' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.neutral[500] }]}>ADMIN VERIFICATION CODE</Text>
              <View style={[styles.inputBox, { backgroundColor: themeColors.neutral[50], borderWidth: regErrors.adminCode ? 1 : 0, borderColor: regErrors.adminCode ? '#EF4444' : undefined }]}>
                <Icon source="key-outline" size={20} color={themeColors.neutral[400]} />
                <TextInput
                  value={adminCode}
                  onChangeText={(val) => { setAdminCode(val); setRegErrors(prev => ({ ...prev, adminCode: undefined })); }}
                  onBlur={() => handleBlur('adminCode')}
                  placeholder="Enter MoH Admin Code"
                  placeholderTextColor={themeColors.neutral[400]}
                  secureTextEntry
                  autoComplete="off"
                  style={[styles.input, { color: themeColors.neutral[900] }]}
                />
              </View>
              {regErrors.adminCode && <Text style={styles.errorText}>{regErrors.adminCode}</Text>}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Register Action Button */}
      <View style={{ marginTop: spacing.md }}>
        <TouchableOpacity 
          style={[styles.loginBtn, { backgroundColor: portal.primary, borderRadius: radii.md, height: 50, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24 }]} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <View style={{ flex: 1, alignItems: 'center' }}>
               <ActivityIndicator color="#FFF" />
            </View>
          ) : (
            <>
              <View style={{ width: 20 }} /> {/* Spacer to center text */}
              <Text style={[styles.loginBtnText, { fontSize: 15, fontWeight: '700' }]}>Create Account</Text>
              <Icon source="chevron-right" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>

        {/* Back to Login Toggle */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: themeColors.neutral[500], fontSize: 13 }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => setIsRegisterMode(false)}>
            <Text style={[styles.registerText, { color: themeColors.neutral[900], fontSize: 13, textDecorationLine: 'underline' }]}>Login here</Text>
          </TouchableOpacity>
        </View>
      </View>
      </>
      )}
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
              <View style={[styles.heroOverlay, { backgroundColor: portal.bgOverlay }]}>
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
            {isRegisterMode ? renderRegisterForm() : renderLoginForm()}
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
               <Icon source="shield-plus" size={isSmall ? 36 : 48} color={portal.primary} />
               <Text style={[styles.mobileTitle, { color: portal.primary }, isSmall && { fontSize: 22 }]}>HealthGuard</Text>
            </View>
          )}
          {isRegisterMode ? renderRegisterForm() : renderLoginForm()}
        </ScrollView>
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
    marginBottom: 24,
  },
  mobileHeaderSmall: {
    marginBottom: 12,
  },
  mobileTitle: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 8,
  },
  loginCard: {
    width: '100%',
    maxWidth: 450,
    padding: spacing.xl,
    borderRadius: radii.xl,
    ...shadows.lg,
    position: 'relative',
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
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
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
  demoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  demoHintText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  roleToggleRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 4,
  },
  roleToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderRadius: radii.md,
  },
  roleToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    marginLeft: 4,
  },
});

export default LoginScreen;
