import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { theme } from '../constants/theme';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Lütfen kullanıcı adı ve şifre giriniz');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const email = `${username.toLowerCase()}@twitterclone.com`;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Kullanıcı bilgilerini AsyncStorage'a kaydet
      await AsyncStorage.setItem('@user', JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        username: username
      }));

      // Başarılı girişten sonra MainApp ekranına yönlendir
      navigation.replace('MainApp');

    } catch (error) {
      console.error('Giriş hatası:', error.message);
      setError('Geçersiz kullanıcı adı veya şifre');
    } finally {
      setLoading(false);
    }
  };

  const HeaderLogo = () => (
    <Feather name="twitter" size={34} color={theme.colors.twitterBlue} />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}><HeaderLogo></HeaderLogo></Text>
      <TextInput
        style={styles.input}
        placeholder="Kullanıcı Adı"
        placeholderTextColor={theme.colors.secondary}
        value={username}
        onChangeText={(text) => {
          setUsername(text);
          setError('');
        }}
        autoCapitalize="none"
        editable={!loading}
        color={theme.colors.text}
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        placeholderTextColor={theme.colors.secondary}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setError('');
        }}
        secureTextEntry
        editable={!loading}
        color={theme.colors.text}
      />
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.text} />
        ) : (
          <Text style={styles.buttonText}>Giriş Yap</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
        <Text style={styles.link}>Hesabın yok mu? Kayıt ol</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 50,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 10,
    fontSize: 16,
    borderRadius: 6,
    marginBottom: 24,
    backgroundColor: theme.colors.tertiary,
  },
  button: {
    backgroundColor: theme.colors.twitterBlue,
    padding: 15,
    borderRadius: 6,
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: theme.colors.text,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: theme.colors.twitterBlue,
    textAlign: 'center',
    fontSize: 14,
    marginTop: 30,
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default LoginScreen;