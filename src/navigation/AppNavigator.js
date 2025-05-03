import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import BottomTabNavigator from './BottomTabNavigator';
import CommentScreen from '../screens/CommentScreen';
import { Feather } from '@expo/vector-icons'; // Feather ikon setini içe aktarın
import { MaterialCommunityIcons } from '@expo/vector-icons'; // MaterialCommunityIcons'u içe aktarın
import { theme } from '../constants/theme';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  if (initializing) {
    // Uygulama başlatılırken bir yükleme ekranı gösterebilirsiniz
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background, // Twitter mavi rengi
          },
          headerTitleAlign: 'center',
          headerTitle: () => (
            <MaterialCommunityIcons
              name="twitter" // MaterialCommunityIcons'taki dolguya sahip Twitter ikonu
              size={35}
              color="#1DA1F2" // Mavi renk
            />
          ),
          headerTintColor: '#fff',
          headerLeft: () => null, // Geri dön butonunu tamamen kaldır
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="MainApp" component={BottomTabNavigator} />
            <Stack.Screen
              name="Comment"
              component={CommentScreen}
              options={{
                headerBackVisible: false, // Geri dön butonunu gizle
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;