import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Feather } from '@expo/vector-icons';
import { db, auth } from '../services/firebase';
import { theme } from '../constants/theme';

const FeedScreen = ({ navigation }) => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [commentCounts, setCommentCounts] = useState({});
  const commentUnsubscribers = useRef({});

  const loadCommentCounts = async (tweetIds) => {
    Object.values(commentUnsubscribers.current).forEach(unsubscribe => unsubscribe());
    commentUnsubscribers.current = {};
    setCommentCounts({});

    tweetIds.forEach(tweetId => {
      const commentsRef = collection(db, 'tweets', tweetId, 'comments');
      const commentsQuery = query(commentsRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
        setCommentCounts(prev => ({
          ...prev,
          [tweetId]: snapshot.docs.length
        }));
      }, (error) => {
        console.error('Yorum sayısı takip hatası:', error);
      });

      commentUnsubscribers.current[tweetId] = unsubscribe;
    });
  };

  const loadTweets = async () => {
    try {
      const tweetsRef = collection(db, 'tweets');
      const tweetsQuery = query(
        tweetsRef,
        orderBy('createdAt', 'desc')
      );

      return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(tweetsQuery, (snapshot) => {
          const tweetList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setTweets(tweetList);
          loadCommentCounts(tweetList.map(tweet => tweet.id));
          resolve();
        }, (error) => {
          console.error('Tweet yükleme hatası:', error);
          setError(error.message);
          reject(error);
        });

        return () => {
          unsubscribe();
          Object.values(commentUnsubscribers.current).forEach(unsubscribe => unsubscribe());
          commentUnsubscribers.current = {};
        };
      });
    } catch (error) {
      console.error('Tweet yükleme hatası:', error);
      setError(error.message);
    }
  };

  useEffect(() => {
    loadTweets().finally(() => {
      setLoading(false);
    });
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTweets();
    } catch (error) {
      console.error('Yenileme hatası:', error);
    } finally {
      setRefreshing(false);
    }
  };

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
    const commentCount = commentCounts[item.id] || 0;

    return (
      <View style={styles.tweetContainer}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.tweetText}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {item.createdAt?.toDate ? new Date(item.createdAt?.toDate()).toLocaleDateString() : 'Tarih yok'}
        </Text>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Comment', {
              tweetId: item.id,
              tweetText: item.text,
              tweetUsername: item.username
            })}
          >
            <View style={styles.actionWrapper}>
              <Feather 
                name="message-circle" 
                size={20} 
                color={commentCount > 0 ? theme.colors.twitterBlue : theme.colors.secondary} 
              />
              <Text style={[
                styles.actionText,
                commentCount > 0 && { color: theme.colors.twitterBlue }
              ]}>{commentCount > 0 ? commentCount : ''}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleRetweet(item)}
          >
            <View style={styles.actionWrapper}>
              <Feather 
                name="repeat" 
                size={20} 
                color={isRetweeted ? theme.colors.retweetGreen : theme.colors.secondary}
              />
              <Text style={[
                styles.actionText,
                isRetweeted && { color: theme.colors.retweetGreen }
              ]}>{retweetCount}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(item)}
          >
            <View style={styles.actionWrapper}>
              <Feather 
                name={isLiked ? "heart" : "heart"} 
                size={20} 
                color={isLiked ? theme.colors.likeRed : theme.colors.secondary}
              />
              <Text style={[
                styles.actionText,
                isLiked && { color: theme.colors.likeRed }
              ]}>{likeCount}</Text>
            </View>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.twitterBlue}
            colors={[theme.colors.twitterBlue]}
          />
        }
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
  timestamp: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginBottom: 10,
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
  },
  actionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 50,
  },
  actionButton: {
    padding: 5,
  },
  actionText: {
    marginLeft: 5,
    color: theme.colors.secondary,
    fontSize: 14,
  },
});

export default FeedScreen;