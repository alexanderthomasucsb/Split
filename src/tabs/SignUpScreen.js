import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import firebase from '../../firebaseConfig';
import VenmoUsernameModal from '../components/VenmoUsernameModal';

const AuthScreenWrapper = ({ children }) => (
  <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {children}
    </KeyboardAvoidingView>
  </SafeAreaView>
);

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [venmoUsername, setVenmoUsername] = useState('');
  const [showVenmoModal, setShowVenmoModal] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !venmoUsername) {
      setError('Please fill in all required fields (including Venmo username)');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const userCredential = await firebase.auth()
        .createUserWithEmailAndPassword(email, password);
      
      await firebase.firestore()
        .collection('users')
        .doc(userCredential.user.uid)
        .set({
          email: email.toLowerCase(),
          displayName: displayName || email.split('@')[0],
          venmoUsername,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

      navigation.navigate('Home');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenWrapper>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>Split</Text>
        <Text style={styles.tagline}>Split bills, not friendships</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Feather name="user" size={20} color="#6C47FF" style={styles.inputIcon} />
          <TextInput
            placeholder="Display Name (optional)"
            value={displayName}
            onChangeText={setDisplayName}
            style={styles.input}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputContainer}>
          <Feather name="mail" size={20} color="#6C47FF" style={styles.inputIcon} />
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputContainer}>
          <Feather name="lock" size={20} color="#6C47FF" style={styles.inputIcon} />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={[styles.input, styles.flexGrow]}
            secureTextEntry={!showPassword}
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#6C47FF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setShowVenmoModal(true)}
        >
          <Feather name="dollar-sign" size={20} color="#6C47FF" style={styles.inputIcon} />
          <Text style={[styles.input, !venmoUsername && styles.placeholder]}>
            {venmoUsername || 'Venmo Username (required)'}
          </Text>
          <Feather name="chevron-right" size={20} color="#6C47FF" />
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.mainButton}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.mainButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Sign In')}
        >
          <Text style={styles.secondaryButtonText}>
            Already have an account? <Text style={styles.textLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By creating an account, you agree to Split's{' '}
          <Text style={styles.textLink}>Terms of Service</Text> and{' '}
          <Text style={styles.textLink}>Privacy Policy</Text>
        </Text>
      </View>

      <VenmoUsernameModal
        visible={showVenmoModal}
        onClose={() => setShowVenmoModal(false)}
        onSuccess={(username) => {
          setVenmoUsername(username);
          setShowVenmoModal(false);
        }}
        initialValue={venmoUsername}
      />
    </AuthScreenWrapper>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6C47FF',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E5FF',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  flexGrow: {
    flexGrow: 1,
  },
  mainButton: {
    backgroundColor: '#6C47FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6C47FF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 14,
  },
  textLink: {
    color: '#6C47FF',
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});

export default SignUpScreen;