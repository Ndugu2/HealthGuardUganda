import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Animated,
  Easing,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthService } from '../services/AuthService';
import { NotificationService } from '../services/NotificationService';
import { ValidationService } from '../services/ValidationService';
import { useAppTheme } from '../ThemeContext';

// ─── Ugandan Districts ────────────────────────────────────────────────────────
const UGANDA_DISTRICTS = [
  'Abim','Adjumani','Agago','Alebtong','Amolatar','Amudat','Amuria','Amuru',
  'Apac','Arua','Budaka','Bududa','Bugiri','Buhweju','Buikwe','Bukedea',
  'Bukomansimbi','Bukwa','Bulambuli','Buliisa','Bundibugyo','Bushenyi',
  'Busia','Butaleja','Butebo','Buvuma','Buyende','Dokolo','Gomba','Gulu',
  'Hoima','Ibanda','Iganga','Isingiro','Jinja','Kabale','Kabarole',
  'Kaberamaido','Kagadi','Kakumiro','Kalangala','Kaliro','Kalungu',
  'Kampala','Kamuli','Kamwenge','Kanungu','Kapchorwa','Kasanda','Kasese',
  'Katakwi','Kayunga','Kibaale','Kiboga','Kibuku','Kikuube','Kiruhura',
  'Kiryandongo','Kisoro','Kitgum','Koboko','Kole','Kotido','Kumi',
  'Kwania','Kween','Kyankwanzi','Kyegegwa','Kyenjojo','Kyotera','Lamwo',
  'Lira','Luuka','Luwero','Lwengo','Lyantonde','Manafwa','Maracha',
  'Masaka','Masindi','Mayuge','Mbale','Mbarara','Mitooma','Mityana',
  'Moroto','Moyo','Mpigi','Mubende','Mukono','Nabilatuk','Nakapiripirit',
  'Nakaseke','Nakasongola','Namayingo','Namisindwa','Namutumba','Napak',
  'Nebbi','Ngora','Ntoroko','Ntungamo','Nwoya','Obongi','Omoro','Otuke',
  'Oyam','Pader','Pakwach','Pallisa','Rakai','Rubanda','Rubirizi','Rukiga',
  'Rukungiri','Sembabule','Serere','Sheema','Sironko','Soroti','Terego',
  'Tororo','Wakiso','Yumbe','Zombo',
];

// ─── Role Configuration ───────────────────────────────────────────────────────
const ROLES = [
  {
    key: 'COMMUNITY' as const,
    label: 'Community Member',
    icon: '👤',
    description: 'Access health guidelines, report community health alerts, and get AI-powered health advice.',
    badge: 'Free Access',
    gradient: ['#10B981', '#059669'] as [string, string],
    glow: 'rgba(16,185,129,0.3)',
    approvalNote: null,
  },
  {
    key: 'HW' as const,
    label: 'Health Worker',
    icon: '🏥',
    description: 'Manage patient encounters, sync clinical data, access drug inventory and medical guidelines.',
    badge: 'Requires Approval',
    gradient: ['#0284C7', '#0369A1'] as [string, string],
    glow: 'rgba(2,132,199,0.3)',
    approvalNote: 'Your account will be reviewed by an administrator before you can sign in.',
  },
  {
    key: 'ADMIN' as const,
    label: 'Administrator',
    icon: '🛡️',
    description: 'Manage the system, approve health workers, monitor analytics, and configure facilities.',
    badge: 'Requires Super-Admin Approval',
    gradient: ['#7C3AED', '#6D28D9'] as [string, string],
    glow: 'rgba(124,58,237,0.3)',
    approvalNote: 'Your account will be reviewed by the super-administrator before you can sign in.',
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'ROLE' | 'FORM' | 'OTP' | 'SUCCESS';
type RoleKey = 'COMMUNITY' | 'HW' | 'ADMIN';

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  district?: string;
  village?: string;
  facility?: string;
  adminCode?: string;
  dob?: string;
  gender?: string;
}

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onBack: () => void;
  initialRole?: RoleKey;
}

// ─── Reusable Input Component (stable definition outside render to avoid focus loss) ───
interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  secure?: boolean;
  showToggle?: boolean;
  onToggle?: () => void;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  hint?: string;
  textSecondary: string;
  textPrimary: string;
  inputBg: string;
  inputBorder: string;
  inputBorderFocus: string;
  errorColor: string;
  roleGradientStart: string;
}

const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secure = false,
  showToggle = false,
  onToggle,
  error,
  required = false,
  multiline = false,
  hint,
  textSecondary,
  textPrimary,
  inputBg,
  inputBorder,
  inputBorderFocus,
  errorColor,
  roleGradientStart,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}{required && <Text style={{ color: errorColor }}> *</Text>}
      </Text>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: inputBg,
        borderWidth: 1.5,
        borderColor: error ? errorColor : focused ? inputBorderFocus : inputBorder,
        borderRadius: 12,
        paddingHorizontal: 14,
        minHeight: 50,
        shadowColor: focused ? roleGradientStart : 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      }}>
        <TextInput
          style={{ flex: 1, color: textPrimary, fontSize: 15, paddingVertical: 12, fontFamily: Platform.OS === 'ios' ? 'System' : undefined }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={textSecondary}
          keyboardType={keyboardType}
          secureTextEntry={secure}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          autoCorrect={false}
        />
        {showToggle && onToggle && (
          <TouchableOpacity onPress={onToggle} style={{ padding: 4 }}>
            <Text style={{ fontSize: 18, color: textSecondary }}>{secure ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {hint && !error && (
        <Text style={{ fontSize: 11, color: textSecondary, marginTop: 4 }}>{hint}</Text>
      )}
      {error && (
        <Text style={{ fontSize: 12, color: errorColor, marginTop: 4 }}>⚠ {error}</Text>
      )}
    </View>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onBack,
  initialRole,
}) => {
  const { colors: themeColors, mode } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;
  const isDark = mode === 'dark';

  // Step state
  const [step, setStep] = useState<Step>(initialRole ? 'FORM' : 'ROLE');
  const [selectedRole, setSelectedRole] = useState<RoleKey>(initialRole ?? 'COMMUNITY');

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [facility, setFacility] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [districtQuery, setDistrictQuery] = useState('');
  const [showDistrictSuggestions, setShowDistrictSuggestions] = useState(false);

  // OTP
  const [generatedOTP, setGeneratedOTP] = useState<string | null>(null);
  const [enteredOTP, setEnteredOTP] = useState('');
  const [otpCells, setOtpCells] = useState(['', '', '', '', '', '']);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true, easing: Easing.out(Easing.back(1.2)) }),
    ]).start();
  }, [step]);

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.back(1)) }),
    ]).start();
  };

  const roleConfig = ROLES.find(r => r.key === selectedRole)!;

  // ─── District suggestions ───────────────────────────────────────────────────
  const filteredDistricts = districtQuery.length > 0
    ? UGANDA_DISTRICTS.filter(d => d.toLowerCase().startsWith(districtQuery.toLowerCase())).slice(0, 6)
    : [];

  // ─── Step 1: Role Selection ─────────────────────────────────────────────────
  const handleSelectRole = (role: RoleKey) => {
    setSelectedRole(role);
    animateIn();
    setTimeout(() => setStep('FORM'), 100);
  };

  // ─── Step 2: Validate & Submit Form ────────────────────────────────────────
  const handleSubmitForm = async () => {
    const newErrors: FormErrors = {};

    if (!name.trim() || !ValidationService.isValidFullName(name)) {
      newErrors.name = 'Enter your full name (first and last name, letters only)';
    }
    if (!phone.trim() || !ValidationService.isValidUgandanPhone(phone)) {
      newErrors.phone = 'Enter a valid Ugandan phone number (e.g. 0702000002)';
    }
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!ValidationService.isValidEmail(email)) {
      newErrors.email = 'Enter a valid email address';
    }

    // DOB validation — must be DD/MM/YYYY and a real past date
    if (!dob.trim()) {
      newErrors.dob = 'Date of birth is required';
    } else {
      const dobMatch = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!dobMatch) {
        newErrors.dob = 'Enter date in DD/MM/YYYY format (e.g. 15/03/1990)';
      } else {
        const parsed = new Date(`${dobMatch[3]}-${dobMatch[2]}-${dobMatch[1]}`);
        if (isNaN(parsed.getTime()) || parsed >= new Date()) {
          newErrors.dob = 'Enter a valid past date of birth';
        }
      }
    }

    // Gender validation
    if (!gender) {
      newErrors.gender = 'Please select your gender';
    }

    if (selectedRole === 'HW' || selectedRole === 'ADMIN') {
      if (!district.trim()) {
        newErrors.district = 'District is required';
      } else if (!ValidationService.isValidDistrict(district)) {
        newErrors.district = 'Please select a valid Uganda district';
      }
    } else {
      // District & village validation for COMMUNITY too
      if (district.trim() && !ValidationService.isValidDistrict(district)) {
        newErrors.district = 'Please select a valid Uganda district';
      }
    }
    if (selectedRole === 'HW') {
      if (!village.trim()) newErrors.village = 'Sub-county / village is required';
    }
    if (selectedRole === 'ADMIN') {
      // No passcode required — account goes pending for super-admin review
    }

    const pwdResult = ValidationService.isStrongPassword(password);
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!pwdResult.isValid) {
      newErrors.password = pwdResult.errors[0];
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const result = await AuthService.register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
        role: selectedRole,
        district: district.trim() || undefined,
        village: (village.trim() || facility.trim()) || undefined,
        dob: dob.trim() || undefined,
        gender: gender || undefined,
      });

      if (result.success && result.otp) {
        setGeneratedOTP(result.otp);
        animateIn();
        setStep('OTP');
      } else {
        Alert.alert('Registration Failed', result.error || 'Could not create account. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Verify OTP ─────────────────────────────────────────────────────
  // ─── OTP handling with auto‑focus ┟───────────────────────────────────────────────
  const otpRefs = useRef<Array<any>>([]);

  const handleOTPCell = (val: string, idx: number) => {
    const sanitized = val.replace(/[^0-9]/g, '').slice(-1);
    const cells = [...otpCells];
    cells[idx] = sanitized;
    setOtpCells(cells);
    setEnteredOTP(cells.join(''));
    // Move focus forward if a digit was entered
    if (sanitized && idx < otpCells.length - 1) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOTPKeyPress = ({ nativeEvent }: any, idx: number) => {
    if (nativeEvent.key === 'Backspace' && !otpCells[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const code = otpCells.join('');
    if (code.length < 6) {
      Alert.alert('Incomplete', 'Please enter all 6 digits of your verification code.');
      return;
    }
    if (code !== generatedOTP) {
      Alert.alert('Wrong Code', 'The code you entered is incorrect. Please check and try again.');
      return;
    }

    setLoading(true);
    try {
      // Send welcome notification
      if (email.trim()) {
        await NotificationService.sendWelcomeEmail(email.trim(), name.trim());
      }
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }

    // Animate success
    Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 6 }).start();
    animateIn();
    setStep('SUCCESS');
  };

  const handleResendOTP = async () => {
    const newOtp = AuthService.generateOTP();
    setGeneratedOTP(newOtp);
    setOtpCells(['', '', '', '', '', '']);
    try {
      await NotificationService.sendOTP(phone, newOtp);
      if (email.trim()) await NotificationService.sendOTPViaEmail(email.trim(), newOtp);
      Alert.alert('Code Resent', `A new code has been sent to ${phone}`);
    } catch {
      Alert.alert('Resend Failed', 'Could not resend code. Please check your connection.');
    }
  };

  // ─── Colour helpers ─────────────────────────────────────────────────────────
  const bg = isDark ? '#0F172A' : '#F8FAFC';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const inputBg = isDark ? '#0F172A' : '#F8FAFC';
  const inputBorder = isDark ? '#334155' : '#E2E8F0';
  const inputBorderFocus = roleConfig.gradient[0];
  const errorColor = '#EF4444';

  const fieldStyles = {
    textSecondary,
    textPrimary,
    inputBg,
    inputBorder,
    inputBorderFocus,
    errorColor,
    roleGradientStart: roleConfig.gradient[0],
  };

  // ─── Step Indicator ─────────────────────────────────────────────────────────
  const StepIndicator = () => {
    const steps = ['Role', 'Details', 'Verify', 'Done'];
    const currentIdx = step === 'ROLE' ? 0 : step === 'FORM' ? 1 : step === 'OTP' ? 2 : 3;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <View style={{ alignItems: 'center' }}>
              <View style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: i <= currentIdx ? roleConfig.gradient[0] : (isDark ? '#334155' : '#E2E8F0'),
                justifyContent: 'center', alignItems: 'center',
              }}>
                {i < currentIdx
                  ? <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>✓</Text>
                  : <Text style={{ color: i === currentIdx ? '#fff' : textSecondary, fontSize: 13, fontWeight: '700' }}>{i + 1}</Text>
                }
              </View>
              <Text style={{ fontSize: 10, color: i <= currentIdx ? roleConfig.gradient[0] : textSecondary, marginTop: 4, fontWeight: i === currentIdx ? '700' : '400' }}>{s}</Text>
            </View>
            {i < steps.length - 1 && (
              <View style={{ flex: 1, height: 2, backgroundColor: i < currentIdx ? roleConfig.gradient[0] : (isDark ? '#334155' : '#E2E8F0'), marginHorizontal: 4, marginBottom: 16 }} />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  // ─── RENDER: ROLE SELECTION ─────────────────────────────────────────────────
  const renderRoleSelection = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <LinearGradient colors={['#10B981', '#0284C7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 16, padding: 2, marginBottom: 16 }}>
          <View style={{ backgroundColor: bg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: textSecondary, letterSpacing: 2 }}>HEALTHGUARD UGANDA</Text>
          </View>
        </LinearGradient>
        <Text style={{ fontSize: 28, fontWeight: '800', color: textPrimary, textAlign: 'center', marginBottom: 8 }}>Create Account</Text>
        <Text style={{ fontSize: 15, color: textSecondary, textAlign: 'center', lineHeight: 22 }}>
          Select your account type to get started
        </Text>
      </View>

      {ROLES.map((role) => (
        <TouchableOpacity
          key={role.key}
          onPress={() => handleSelectRole(role.key)}
          activeOpacity={0.85}
          style={{ marginBottom: 16 }}
        >
          <View style={{
            backgroundColor: cardBg,
            borderRadius: 20,
            padding: 20,
            borderWidth: 2,
            borderColor: isDark ? '#334155' : '#E2E8F0',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 12,
            elevation: 4,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <LinearGradient colors={role.gradient} style={{ width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                <Text style={{ fontSize: 24 }}>{role.icon}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: textPrimary, marginRight: 8 }}>{role.label}</Text>
                  <View style={{ backgroundColor: isDark ? '#1E293B' : '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, borderWidth: 1, borderColor: isDark ? '#475569' : '#CBD5E1' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: role.gradient[0] }}>{role.badge}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: textSecondary, lineHeight: 20 }}>{role.description}</Text>
              </View>
              <Text style={{ fontSize: 18, color: textSecondary, marginLeft: 8, alignSelf: 'center' }}>›</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={onBack} style={{ marginTop: 8, alignItems: 'center', paddingVertical: 14 }}>
        <Text style={{ color: textSecondary, fontSize: 14 }}>← Back to Sign In</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // ─── RENDER: REGISTRATION FORM ──────────────────────────────────────────────
  const renderForm = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {/* Role Badge */}
      <TouchableOpacity onPress={() => { animateIn(); setStep('ROLE'); }} style={{ alignSelf: 'flex-start', marginBottom: 20 }}>
        <LinearGradient colors={roleConfig.gradient} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 30 }}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>{roleConfig.icon}</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{roleConfig.label}</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginLeft: 6 }}>· Change</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary, marginBottom: 4 }}>Your Details</Text>
      <Text style={{ fontSize: 14, color: textSecondary, marginBottom: 24, lineHeight: 20 }}>
        Fill in your information to create your {roleConfig.label.toLowerCase()} account.
      </Text>

      <Field label="Full Name" value={name} onChangeText={setName} placeholder="e.g. Babirye Florence" error={errors.name} required {...fieldStyles} />
      <Field label="Phone Number" value={phone} onChangeText={setPhone} placeholder="0702000002" keyboardType="phone-pad" error={errors.phone} required hint="Must be a valid Ugandan phone (07X or +2567X)" {...fieldStyles} />
      <Field
        label="Email Address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        error={errors.email}
        required
        {...fieldStyles}
      />

      {/* Date of Birth */}
      <Field
        label="Date of Birth"
        value={dob}
        onChangeText={(v) => {
          // Auto-insert slashes for DD/MM/YYYY format
          let cleaned = v.replace(/[^0-9]/g, '');
          if (cleaned.length >= 3 && cleaned.length <= 4) cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
          else if (cleaned.length >= 5) cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
          setDob(cleaned);
        }}
        placeholder="DD/MM/YYYY"
        keyboardType="number-pad"
        error={errors.dob}
        required
        hint="Your date of birth in day/month/year format"
        {...fieldStyles}
      />

      {/* Gender Selector */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Gender <Text style={{ color: errorColor }}>*</Text>
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(['Male', 'Female'] as const).map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setGender(g)}
              style={{
                flex: 1,
                paddingVertical: 13,
                borderRadius: 12,
                borderWidth: 1.5,
                alignItems: 'center',
                borderColor: gender === g ? roleConfig.gradient[0] : inputBorder,
                backgroundColor: gender === g
                  ? (isDark ? 'rgba(255,255,255,0.08)' : `${roleConfig.gradient[0]}14`)
                  : inputBg,
                shadowColor: gender === g ? roleConfig.gradient[0] : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 2 }}>
                {g === 'Male' ? '♂' : '♀'}
              </Text>
              <Text style={{
                fontSize: 13,
                fontWeight: gender === g ? '800' : '500',
                color: gender === g ? roleConfig.gradient[0] : textSecondary,
              }}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.gender && <Text style={{ fontSize: 12, color: errorColor, marginTop: 6 }}>⚠ {errors.gender}</Text>}
      </View>

      {/* District field for all roles */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          District{(selectedRole === 'HW' || selectedRole === 'ADMIN') && <Text style={{ color: errorColor }}> *</Text>}
        </Text>
        <View style={{
          backgroundColor: inputBg, borderWidth: 1.5,
          borderColor: errors.district ? errorColor : inputBorder,
          borderRadius: 12, paddingHorizontal: 14,
        }}>
          <TextInput
            style={{ color: textPrimary, fontSize: 15, paddingVertical: 12 }}
            value={districtQuery || district}
            onChangeText={(v: string) => {
              setDistrictQuery(v);
              setDistrict(v);
              setShowDistrictSuggestions(true);
            }}
            placeholder="Type to search district..."
            placeholderTextColor={textSecondary}
            onFocus={() => setShowDistrictSuggestions(true)}
            onBlur={() => setTimeout(() => setShowDistrictSuggestions(false), 200)}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>
        {showDistrictSuggestions && filteredDistricts.length > 0 && (
          <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: inputBorder, marginTop: 4, overflow: 'hidden' }}>
            {filteredDistricts.map(d => (
              <TouchableOpacity key={d} onPress={() => { setDistrict(d); setDistrictQuery(d); setShowDistrictSuggestions(false); }}
                style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: inputBorder }}>
                <Text style={{ color: textPrimary, fontSize: 14 }}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {errors.district && <Text style={{ fontSize: 12, color: errorColor, marginTop: 4 }}>⚠ {errors.district}</Text>}
      </View>

      {/* Village/Parish for all roles */}
      <Field label={selectedRole === 'HW' ? 'Sub-county / Village' : 'Village / Parish (optional)'} value={village} onChangeText={setVillage} placeholder="e.g. Laroo" error={errors.village} required={selectedRole === 'HW'} {...fieldStyles} />
      {selectedRole === 'HW' && (
        <Field label="Health Facility Name (optional)" value={facility} onChangeText={setFacility} placeholder="e.g. Gulu Regional Referral Hospital" {...fieldStyles} />
      )}

      {/* Pending-approval notice for ADMIN */}
      {selectedRole === 'ADMIN' && (
        <View style={{ backgroundColor: isDark ? '#1C0D3A' : '#F5F0FF', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: isDark ? '#7C3AED' : '#C4B5FD' }}>
          <Text style={{ fontSize: 13, color: isDark ? '#C4B5FD' : '#5B21B6', lineHeight: 19 }}>
            🛡️ Administrator access requires approval from the super-administrator. Once you submit, a notification email will be sent to the system owner who will review and activate your account.
          </Text>
        </View>
      )}

      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secure={!showPassword}
        showToggle
        onToggle={() => setShowPassword(p => !p)}
        error={errors.password}
        required
        hint="Min 8 chars, include uppercase, number & symbol"
        {...fieldStyles}
      />
      <Field
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secure={!showConfirmPassword}
        showToggle
        onToggle={() => setShowConfirmPassword(p => !p)}
        error={errors.confirmPassword}
        required
        {...fieldStyles}
      />

      {/* HW approval notice */}
      {selectedRole === 'HW' && (
        <View style={{ backgroundColor: isDark ? '#0C1B33' : '#EFF6FF', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: isDark ? '#1D4ED8' : '#BFDBFE' }}>
          <Text style={{ fontSize: 13, color: isDark ? '#93C5FD' : '#1D4ED8', lineHeight: 19 }}>
            ℹ️ Health Worker accounts require administrator approval. After registering, you will not be able to sign in until an admin approves your account.
          </Text>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity onPress={handleSubmitForm} disabled={loading} activeOpacity={0.88}>
        <LinearGradient
          colors={loading ? ['#94A3B8', '#94A3B8'] : roleConfig.gradient}
          style={{ borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Continue to Verification →</Text>
          }
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => { animateIn(); setStep('ROLE'); }} style={{ marginTop: 14, alignItems: 'center', paddingVertical: 10 }}>
        <Text style={{ color: textSecondary, fontSize: 14 }}>← Back to Role Selection</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // ─── RENDER: OTP VERIFICATION ───────────────────────────────────────────────
  const renderOTP = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
      <LinearGradient colors={roleConfig.gradient} style={{ width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 38 }}>📱</Text>
      </LinearGradient>
      <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary, textAlign: 'center', marginBottom: 8 }}>Verify Your Account</Text>
      <Text style={{ fontSize: 14, color: textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 8 }}>
        A 6-digit verification code has been sent to
      </Text>
      <Text style={{ fontSize: 16, fontWeight: '700', color: roleConfig.gradient[0], marginBottom: 8 }}>{phone}</Text>
      {email ? (
        <Text style={{ fontSize: 13, color: textSecondary, marginBottom: 32 }}>and {email}</Text>
      ) : <View style={{ marginBottom: 32 }} />}

      {/* 6 OTP Cells */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 32 }}>
                    {otpCells.map((cell, i) => (
              <View key={i} style={{
                width: 48, height: 58, backgroundColor: inputBg,
                borderRadius: 12, borderWidth: 2,
                borderColor: cell ? roleConfig.gradient[0] : inputBorder,
                justifyContent: 'center', alignItems: 'center',
              }}>
                <TextInput
                  ref={el => { otpRefs.current[i] = el; }}
                  style={{ color: textPrimary, fontSize: 22, fontWeight: '700', textAlign: 'center', width: '100%', height: '100%' }}
                  value={cell}
                  onChangeText={(v: string) => handleOTPCell(v, i)}
                  onKeyPress={(e) => handleOTPKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                />
              </View>
            ))}
      </View>

      {/* Demo hint */}
      <View style={{ backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderRadius: 12, padding: 14, marginBottom: 24, width: '100%', borderWidth: 1, borderColor: inputBorder }}>
        <Text style={{ fontSize: 12, color: textSecondary, textAlign: 'center' }}>
          💡 Demo mode: Your code is <Text style={{ fontWeight: '800', color: roleConfig.gradient[0] }}>{generatedOTP}</Text>
        </Text>
      </View>

      <TouchableOpacity onPress={handleVerifyOTP} disabled={loading} activeOpacity={0.88} style={{ width: '100%' }}>
        <LinearGradient
          colors={loading ? ['#94A3B8', '#94A3B8'] : roleConfig.gradient}
          style={{ borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Verify & Create Account</Text>
          }
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResendOTP} style={{ marginTop: 16, paddingVertical: 10 }}>
        <Text style={{ color: textSecondary, fontSize: 14, textAlign: 'center' }}>
          Didn't receive a code? <Text style={{ color: roleConfig.gradient[0], fontWeight: '700' }}>Resend</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => { animateIn(); setStep('FORM'); }} style={{ marginTop: 4, paddingVertical: 10 }}>
        <Text style={{ color: textSecondary, fontSize: 13 }}>← Back to Details</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // ─── RENDER: SUCCESS ────────────────────────────────────────────────────────
  const renderSuccess = () => (
    <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', paddingVertical: 20 }}>
      <Animated.View style={{ transform: [{ scale: successScale }], marginBottom: 24 }}>
        <LinearGradient colors={roleConfig.gradient} style={{ width: 100, height: 100, borderRadius: 30, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 52 }}>✅</Text>
        </LinearGradient>
      </Animated.View>

      <Text style={{ fontSize: 26, fontWeight: '800', color: textPrimary, textAlign: 'center', marginBottom: 12 }}>Account Created!</Text>

      {(selectedRole === 'HW' || selectedRole === 'ADMIN') ? (
        <>
          <View style={{ backgroundColor: selectedRole === 'ADMIN' ? (isDark ? '#1C0D3A' : '#F5F0FF') : (isDark ? '#0C1B33' : '#EFF6FF'), borderRadius: 16, padding: 20, marginBottom: 24, width: '100%', borderWidth: 1, borderColor: selectedRole === 'ADMIN' ? (isDark ? '#7C3AED' : '#C4B5FD') : (isDark ? '#1D4ED8' : '#BFDBFE') }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: selectedRole === 'ADMIN' ? (isDark ? '#C4B5FD' : '#5B21B6') : (isDark ? '#93C5FD' : '#1D4ED8'), marginBottom: 8 }}>⏳ Pending Super-Admin Approval</Text>
            <Text style={{ fontSize: 14, color: isDark ? '#CBD5E1' : '#475569', lineHeight: 22 }}>
              {selectedRole === 'ADMIN'
                ? `Your Administrator account has been created and is now awaiting review. The super-administrator has been notified by email and will activate your account shortly.`
                : `Your Health Worker account has been created and is now awaiting review. An administrator will approve your account and you will be notified via ${email ? 'email' : 'phone'}.`
              }
            </Text>
          </View>
        </>
      ) : (
        <Text style={{ fontSize: 15, color: textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 24 }}>
          Your {roleConfig.label.toLowerCase()} account is ready. You can now sign in with your phone number and password.
        </Text>
      )}

      <View style={{ backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 28, width: '100%', borderWidth: 1, borderColor: inputBorder }}>
        <Text style={{ fontSize: 12, color: textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }}>Account Summary</Text>
        {[
          { label: 'Name', value: name },
          { label: 'Phone', value: phone },
          { label: 'D.O.B', value: dob },
          { label: 'Gender', value: gender },
          district ? { label: 'District', value: district } : null,
        ].filter(Boolean).map((row: any, i) => (
          <View key={i} style={{ flexDirection: 'row', marginBottom: 6 }}>
            <Text style={{ fontSize: 13, color: textSecondary, width: 80 }}>{row.label}</Text>
            <Text style={{ fontSize: 13, color: textPrimary, fontWeight: '600', flex: 1 }}>{row.value}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
          <Text style={{ fontSize: 13, color: textSecondary, width: 80 }}>Role</Text>
          <LinearGradient colors={roleConfig.gradient} style={{ borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{roleConfig.label.toUpperCase()}</Text>
          </LinearGradient>
        </View>
      </View>

      <TouchableOpacity onPress={onRegisterSuccess} activeOpacity={0.88} style={{ width: '100%' }}>
        <LinearGradient colors={roleConfig.gradient} style={{ borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
            {(selectedRole === 'HW' || selectedRole === 'ADMIN') ? 'Go to Sign In' : 'Sign In Now →'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  // ─── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          paddingTop: 48,
          maxWidth: isDesktop ? 560 : undefined,
          alignSelf: isDesktop ? 'center' : undefined,
          width: isDesktop ? 560 : undefined,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step Indicator */}
        {step !== 'SUCCESS' && <StepIndicator />}

        {step === 'ROLE' && renderRoleSelection()}
        {step === 'FORM' && renderForm()}
        {step === 'OTP' && renderOTP()}
        {step === 'SUCCESS' && renderSuccess()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
