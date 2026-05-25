import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Icon, useTheme } from 'react-native-paper';
import { AuthService } from '../services/AuthService';
import { useTranslation } from 'react-i18next';

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onBack: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegisterSuccess, onBack }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await AuthService.register({
        name,
        phone,
        email: email || undefined,
        password,
        role: 'COMMUNITY',
      });
      if (result.success) {
        onRegisterSuccess();
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (e: any) {
      setError(e.message ?? 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.form}>
          <Text style={styles.title}>{t('auth.register') || 'Create Account'}</Text>
          {error && <Text style={styles.error}>{error}</Text>}
          <TextInput
            label={t('auth.name') || 'Full Name'}
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label={t('auth.phone') || 'Phone Number'}
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
          />
          <TextInput
            label={t('auth.email') || 'Email (optional)'}
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            label={t('auth.password') || 'Password'}
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            label={t('auth.confirm_password') || 'Confirm Password'}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            {t('auth.register') || 'Create Account'}
          </Button>
          <Button mode="text" onPress={onBack} style={styles.link} labelStyle={{ color: colors.primary[600] }}>
            {t('common.back') || 'Back to Landing'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  form: {
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 6,
  },
  link: {
    marginTop: 8,
  },
  error: {
    color: '#B00020',
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default RegisterScreen;
