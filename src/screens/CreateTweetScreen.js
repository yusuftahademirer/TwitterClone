import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Feather } from '@expo/vector-icons';
import { db, auth } from '../services/firebase';
import { theme } from '../constants/theme';

const CreateTweetScreen = ({ navigation }) => {
  const [tweetText, setTweetText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTweet = async () => {
    if (tweetText.trim().length === 0) return;

    try {
      setLoading(true);
      console.log('Tweet gönderme başladı');

      const tweetData = {
        text: tweetText,
        userId: auth.currentUser?.uid,
        username: auth.currentUser?.displayName,
        createdAt: serverTimestamp(),
        likes: [],
        retweets: [],
      };

      console.log('Tweet verisi hazırlandı:', tweetData);

      const docRef = await addDoc(collection(db, 'tweets'), tweetData);
      console.log('Tweet başarıyla eklendi, döküman ID:', docRef.id);
      
      setTweetText('');
      navigation.goBack();
    } catch (error) {
      console.error('Tweet oluşturma hatası:', error);
      alert('Tweet oluşturulurken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Ne düşünüyorsun?"
        placeholderTextColor={theme.colors.secondary}
        value={tweetText}
        onChangeText={setTweetText}
        multiline
        maxLength={280}
        editable={!loading}
      />

      <View style={styles.footer}>
        <Text style={styles.counter}>{tweetText.length}/280</Text>
        
        <TouchableOpacity 
          style={[
            styles.button,
            { opacity: tweetText.trim().length === 0 || loading ? 0.5 : 1 }
          ]}
          onPress={handleTweet}
          disabled={tweetText.trim().length === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.text} />
          ) : (
            <Text style={styles.buttonText}>Tweet</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    textAlignVertical: 'top',
    color: theme.colors.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 15,
  },
  counter: {
    color: theme.colors.secondary,
  },
  button: {
    backgroundColor: theme.colors.twitterBlue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonText: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
});

export default CreateTweetScreen;