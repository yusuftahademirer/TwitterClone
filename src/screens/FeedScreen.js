import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Feather } from '@expo/vector-icons';
import { db, auth } from '../services/firebase';
import { theme } from '../constants/theme';

const FeedScreen = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('FeedScreen - Tweet verilerini yüklemeye başlıyor...');
    try {
      const tweetsQuery = query(
        collection(db, 'tweets'),
        orderBy('createdAt', 'desc')
      );

      console.log('FeedScreen - Query oluşturuldu, dinlemeye başlıyor...');
      
      const unsubscribe = onSnapshot(tweetsQuery, (snapshot) => {
        console.log('FeedScreen - Yeni veri alındı, tweet sayısı:', snapshot.docs.length);
        const tweetList = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Tweet verisi:', {
            id: doc.id,
            text: data.text,
            username: data.username,
            hasImage: !!data.imageUrl,
            timestamp: data.createdAt
          });
          return {
            id: doc.id,
            ...data
          };
        });
        setTweets(tweetList);
        setLoading(false);
      }, (error) => {
        console.error('FeedScreen - Firestore dinleme hatası:', error);
        setError(error.message);
        setLoading(false);
      });

      return () => {
        console.log('FeedScreen - Dinleme sonlandırılıyor...');
        unsubscribe();
      };
    } catch (error) {
      console.error('FeedScreen - Genel hata:', error);
      setError(error.message);
      setLoading(false);
    }
  }, []);

  const handleLike = async (tweet) => {
    try {
      const userId = auth.currentUser.uid;
      const tweetRef = doc(db, 'tweets', tweet.id);
      const likes = tweet.likes || [];
      
      if (likes.includes(userId)) {
        await updateDoc(tweetRef, {
          likes: arrayRemove(userId)
        });
      } else {
        await updateDoc(tweetRef, {
          likes: arrayUnion(userId)
        });
      }
    } catch (error) {
      console.error('Beğeni işlemi hatası:', error);
    }
  };

  const handleRetweet = async (tweet) => {
    try {
      const userId = auth.currentUser.uid;
      const tweetRef = doc(db, 'tweets', tweet.id);
      const retweets = tweet.retweets || [];
      
      if (retweets.includes(userId)) {
        await updateDoc(tweetRef, {
          retweets: arrayRemove(userId)
        });
      } else {
        await updateDoc(tweetRef, {
          retweets: arrayUnion(userId)
        });
      }
    } catch (error) {
      console.error('Retweet işlemi hatası:', error);
    }
  };

  const renderTweet = ({ item }) => {
    const userId = auth.currentUser?.uid;
    const isLiked = item.likes?.includes(userId) || false;
    const isRetweeted = item.retweets?.includes(userId) || false;
    const likeCount = item.likes?.length || 0;
    const retweetCount = item.retweets?.length || 0;

    return (
      <View style={styles.tweetContainer}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.tweetText}>{item.text}</Text>
        {item.imageUrl && (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.tweetImage}
            resizeMode="cover"
          />
        )}
        <Text style={styles.timestamp}>
          {item.createdAt?.toDate ? new Date(item.createdAt?.toDate()).toLocaleDateString() : 'Tarih yok'}
        </Text>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Feather name="message-circle" size={20} color={theme.colors.secondary} />
            <Text style={styles.actionText}>0</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleRetweet(item)}
          >
            <Feather 
              name="repeat" 
              size={20} 
              color={isRetweeted ? theme.colors.retweetGreen : theme.colors.secondary}
            />
            <Text style={[
              styles.actionText,
              isRetweeted && { color: theme.colors.retweetGreen }
            ]}>{retweetCount}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(item)}
          >
            <Feather 
              name={isLiked ? "heart" : "heart"} 
              size={20} 
              color={isLiked ? theme.colors.likeRed : theme.colors.secondary}
            />
            <Text style={[
              styles.actionText,
              isLiked && { color: theme.colors.likeRed }
            ]}>{likeCount}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.text} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Hata: {error}</Text>
      </View>
    );
  }

  if (tweets.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noTweetsText}>Henüz tweet yok</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tweets}
        renderItem={renderTweet}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  list: {
    flex: 1,
  },
  tweetContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    color: theme.colors.text,
  },
  tweetText: {
    fontSize: 14,
    marginBottom: 10,
    color: theme.colors.text,
  },
  tweetImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  noTweetsText: {
    color: theme.colors.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 5,
    color: theme.colors.secondary,
    fontSize: 14,
  },
});

export default FeedScreen;