import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import OTPLoginScreen from '../screens/OTPLoginScreen';
import PlayerProfileScreen from '../screens/PlayerProfileScreen';
import VenuesScreen from '../screens/VenuesScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import VenueDetailsScreen from '../screens/VenueDetailsScreen';
import SlotSelectionScreen from '../screens/SlotSelectionScreen';
import BookingDetailsScreen from '../screens/BookingDetailsScreen';
import ReviewBookingScreen from '../screens/ReviewBookingScreen';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator Component
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Play') {
            iconName = focused ? 'location' : 'location-outline';
          } else if (route.name === 'Bookings') {
            iconName = 'calendar';
          } else if (route.name === 'Train') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Community') {
            iconName = focused ? 'people' : 'people-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#B0B0B0',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          height: 75,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: -5,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Play"
        component={VenuesScreen}
        options={{ tabBarLabel: 'Play' }}
      />
      <Tab.Screen
        name="Bookings"
        component={MyBookingsScreen}
        options={{
          tabBarLabel: 'Bookings',
          tabBarIconStyle: {
            marginTop: -25,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginTop: -10,
          },
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 65,
                height: 65,
                borderRadius: 32.5,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 25,
                elevation: 8,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <Ionicons name="calendar" size={28} color="#fff" />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Train"
        component={HomeScreen}
        options={{ tabBarLabel: 'Train' }}
      />
      <Tab.Screen
        name="Community"
        component={PlayerProfileScreen}
        options={{ tabBarLabel: 'Community' }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.primary },
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="PlayerProfile" component={PlayerProfileScreen} />
            <Stack.Screen name="Venues" component={VenuesScreen} />
            <Stack.Screen name="VenueDetails" component={VenueDetailsScreen} />
            <Stack.Screen name="SlotSelection" component={SlotSelectionScreen} />
            <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
            <Stack.Screen name="ReviewBooking" component={ReviewBookingScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={OTPLoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
});

export default AppNavigator;
