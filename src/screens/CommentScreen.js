import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { theme } from '../constants/theme';
import { Feather } from '@expo/vector-icons';

const CommentScreen = ({ route, navigation }) => {
  const { tweetId, tweetText, tweetUsername } = route.params;
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Tweet başlığını navigation header'da göster
    navigation.setOptions({
      title: 'Tweet',
    });

    // Yorumları dinle
    const commentsRef = collection(db, 'tweets', tweetId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentList);
      setLoading(false);
    }, (error) => {
      console.error('Yorumları yükleme hatası:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tweetId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSending(true);
      const commentData = {
        text: newComment.trim(),
        userId: auth.currentUser.uid,
        username: auth.currentUser.displayName,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'tweets', tweetId, 'comments'), commentData);
      setNewComment('');
    } catch (error) {
      console.error('Yorum gönderme hatası:', error);
    } finally {
      setSending(false);
    }
  };

  const renderOriginalTweet = () => (
    <View style={styles.originalTweet}>
      <Text style={styles.username}>{tweetUsername}</Text>
      <Text style={styles.tweetText}>{tweetText}</Text>
    </View>
  );

  const renderComment = ({ item }) => (
    <View style={styles.commentContainer}>
      <Text style={styles.commentUsername}>{item.username}</Text>
      <Text style={styles.commentText}>{item.text}</Text>
      <Text style={styles.timestamp}>
        {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Tarih yok'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderOriginalTweet}
        ListEmptyComponent={
          !loading && (
            <Text style={styles.noComments}>Henüz yorum yapılmamış</Text>
          )
        }
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Yorumunuzu yazın..."
          placeholderTextColor={theme.colors.secondary}
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={280}
          editable={!sending}
          color={theme.colors.text}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newComment.trim() || sending) && styles.sendButtonDisabled
          ]}
          onPress={handleAddComment}
          disabled={!newComment.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color={theme.colors.text} size="small" />
          ) : (
            <Feather name="send" size={20} color={theme.colors.text} />
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
  },
  originalTweet: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  tweetText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 10,
  },
  commentContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 3,
  },
  commentText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 5,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  noComments: {
    textAlign: 'center',
    color: theme.colors.secondary,
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
    marginBottom: 50,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: theme.colors.tertiary,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: theme.colors.twitterBlue,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default CommentScreen;