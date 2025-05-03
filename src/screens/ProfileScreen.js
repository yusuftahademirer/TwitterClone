import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { theme } from '../constants/theme';
import { Feather } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }) => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  };

  const username = auth.currentUser?.email.split('@')[0] || 'Kullanıcı';

  const fetchTweets = useCallback(async () => {
    try {
      setRefreshing(true);
      const tweetsRef = collection(db, 'tweets');
      const q = query(
        tweetsRef,
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const userTweets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTweets(userTweets);
    } catch (error) {
      console.error('Tweetleri getirirken hata:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTweets();
  }, [fetchTweets]);

  const renderTweet = ({ item }) => (
    <View style={styles.tweetContainer}>
      <Text style={styles.tweetText}>{item.text}</Text>
      <Text style={styles.timestamp}>
        {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleString() : 'Tarih yok'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <Feather name="user" size={80} color={theme.colors.secondary} />
        <Text style={styles.username}>{username}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>

      <View style={styles.tweetsContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.twitterBlue} />
        ) : (
          <FlatList
            data={tweets}
            keyExtractor={(item) => item.id}
            renderItem={renderTweet}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={fetchTweets}
                colors={[theme.colors.twitterBlue]}
              />
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  profileContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: theme.colors.error,
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 50,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tweetsContainer: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  tweetContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tweetText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 5,
  },
});

export default ProfileScreen;