import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { AddExpenseScreen } from './src/screens/AddExpenseScreen';
import { AIAssistantScreen } from './src/screens/AIAssistantScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { palette } from './src/theme/palette';
import { ExpenseProvider } from './src/context/ExpenseContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';

type RootTabParamList = {
  Dashboard: undefined;
  Calendar: undefined;
  'Add Expense': undefined;
  'AI Assistant': undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.background,
    card: palette.surface,
    text: palette.textPrimary,
    border: palette.border,
    primary: palette.accent,
  },
};

function MainAppTabs() {
  return (
    <NavigationContainer theme={appTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: palette.background },
          headerShadowVisible: false,
          headerTitleStyle: { color: palette.textPrimary, fontSize: 20, fontWeight: '700' },
          tabBarStyle: {
            backgroundColor: 'rgba(11, 20, 38, 0.78)',
            position: 'absolute',
            left: 18,
            right: 18,
            bottom: 18,
            borderTopWidth: 0,
            borderWidth: 1,
            borderColor: 'rgba(64, 72, 93, 0.3)',
            borderRadius: 24,
            height: 74,
            paddingTop: 8,
            paddingBottom: 10,
            shadowColor: palette.shadow,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 1,
            shadowRadius: 20,
            elevation: 10,
          },
          tabBarActiveTintColor: palette.accent,
          tabBarInactiveTintColor: '#6D758C',
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          tabBarHideOnKeyboard: true,
          tabBarIcon: ({ color, size, focused }) => {
            const iconMap: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
              Dashboard: focused ? 'grid' : 'grid-outline',
              Calendar: focused ? 'calendar' : 'calendar-outline',
              'Add Expense': focused ? 'add-circle' : 'add-circle-outline',
              'AI Assistant': focused ? 'sparkles' : 'sparkles-outline',
            };
            return (
              <Ionicons
                name={iconMap[route.name as keyof RootTabParamList]}
                size={focused ? size + 1 : size}
                color={color}
              />
            );
          },
          sceneStyle: { backgroundColor: palette.background, paddingBottom: 86 },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Calendar" component={CalendarScreen} />
        <Tab.Screen name="Add Expense" component={AddExpenseScreen} />
        <Tab.Screen name="AI Assistant" component={AIAssistantScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function AppShell() {
  const { isLoggedIn, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      {isLoggedIn ? (
        <MainAppTabs />
      ) : authMode === 'login' ? (
        <LoginScreen onSwitchToRegister={() => setAuthMode('register')} />
      ) : (
        <RegisterScreen onSwitchToLogin={() => setAuthMode('login')} />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ExpenseProvider>
        <LanguageProvider>
          <AppShell />
        </LanguageProvider>
      </ExpenseProvider>
    </AuthProvider>
  );
}
