import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import BottomTabNavigator from './BottomTabNavigator';
import CommentScreen from '../screens/CommentScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { theme } from '../constants/theme';

const Stack = createStackNavigator();

const HeaderLogo = () => (
  <View style={{ 
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  }}>
    <Feather name="twitter" size={30} color={theme.colors.twitterBlue} />
  </View>
);

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.background,
            shadowColor: theme.colors.border,
          },
          headerTintColor: theme.colors.text,
          headerTitle: () => <HeaderLogo />,
          headerTitleAlign: 'center',
          headerLeft: () => null,
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MainApp"
          component={BottomTabNavigator}
          options={{
            headerShown: true, // MainApp için header açık
          }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            headerShown: false, // Sadece Profile ekranında header gizli
          }}
        />
        <Stack.Screen
          name="Comment"
          component={CommentScreen} // Comment ekranı bileşeni
          options={{
            headerTitle: 'Yorum Yap',
            headerBackTitleVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;