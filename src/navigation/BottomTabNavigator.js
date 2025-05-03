import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import FeedScreen from '../screens/FeedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreateTweetScreen from '../screens/CreateTweetScreen';
import { theme } from '../constants/theme';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.twitterBlue,
        tabBarInactiveTintColor: theme.colors.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
        headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
          title: 'Ana Sayfa'
        }}
      />
      <Tab.Screen
        name="Tweet"
        component={CreateTweetScreen}
        options={{
        headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="feather" size={size} color={color} />
          ),
          title: 'Tweetle'
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false, // Header'ı gizle
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
          title: 'Profil',
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;