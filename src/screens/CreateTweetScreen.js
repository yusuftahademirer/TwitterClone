import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { db, auth } from '../services/firebase';
import { uploadImage } from '../services/cloudinary';
import { theme } from '../constants/theme';

const CreateTweetScreen = ({ navigation }) => {
  const [tweetText, setTweetText] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Galeri izin durumu:', status);
      
      if (status !== 'granted') {
        alert('Fotoğraf seçebilmek için izin vermeniz gerekiyor!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        base64: true,
      });

      console.log('Seçilen resim bilgisi:', {
        canceled: result.canceled,
        hasBase64: result.assets && result.assets[0]?.base64 ? 'Evet' : 'Hayır'
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Resim seçme hatası:', error);
      alert('Resim seçilirken bir hata oluştu: ' + error.message);
    }
  };

  const handleTweet = async () => {
    if (tweetText.trim().length === 0 && !image) return;

    try {
      setLoading(true);
      console.log('Tweet gönderme başladı');
      console.log('Kullanıcı bilgisi:', {
        uid: auth.currentUser?.uid,
        email: auth.currentUser?.email
      });

      let imageUrl = null;

      if (image && image.base64) {
        console.log('Resim yükleme başlıyor');
        try {
          imageUrl = await uploadImage(image.base64);
          console.log('Resim başarıyla yüklendi:', imageUrl);
        } catch (uploadError) {
          console.error('Resim yükleme detaylı hata:', {
            message: uploadError.message,
            stack: uploadError.stack
          });
          alert('Resim yüklenirken bir hata oluştu: ' + uploadError.message);
          setLoading(false);
          return;
        }
      }

      const tweetData = {
        text: tweetText,
        userId: auth.currentUser?.uid,
        username: auth.currentUser?.email,
        createdAt: serverTimestamp(),
        imageUrl,
        likes: [],      // Boş beğeni dizisi
        retweets: [],   // Boş retweet dizisi
      };

      console.log('Tweet verisi hazırlandı:', tweetData);

      const docRef = await addDoc(collection(db, 'tweets'), tweetData);
      console.log('Tweet başarıyla eklendi, döküman ID:', docRef.id);
      
      setTweetText('');
      setImage(null);
      navigation.goBack();
    } catch (error) {
      console.error('Tweet oluşturma detaylı hata:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
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
      
      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image.uri }} style={styles.tweetImage} />
          <TouchableOpacity 
            style={styles.removeImage} 
            onPress={() => setImage(null)}
          >
            <Text style={styles.removeImageText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.actions}>
          <TouchableOpacity 
            onPress={pickImage}
            disabled={loading}
            style={styles.imageButton}
          >
            <Feather 
              name="camera" 
              size={22} 
              color={theme.colors.twitterBlue} 
            />
          </TouchableOpacity>
          <Text style={styles.counter}>{tweetText.length}/280</Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.button,
            { opacity: (tweetText.trim().length === 0 && !image) || loading ? 0.5 : 1 }
          ]}
          onPress={handleTweet}
          disabled={tweetText.trim().length === 0 && !image || loading}
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
  imageContainer: {
    marginVertical: 10,
    position: 'relative',
  },
  tweetImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  removeImage: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: theme.colors.text,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 15,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageButton: {
    marginRight: 15,
  },
  imageButtonText: {
    fontSize: 24,
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