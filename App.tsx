import React, { useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { colors, type } from './src/theme';
import { AppProvider, useApp } from './src/store/AppContext';
import { RootStackParamList, TabParamList } from './src/navigation';
import TabIcon from './src/components/TabIcon';
import { PrimaryButton } from './src/components/UI';
import OnboardingScreen from './src/screens/OnboardingScreen';
import TablesScreen from './src/screens/TablesScreen';
import PeopleScreen from './src/screens/PeopleScreen';
import PairsScreen from './src/screens/PairsScreen';
import ChatsScreen from './src/screens/ChatsScreen';
import YouScreen from './src/screens/YouScreen';
import PersonScreen from './src/screens/PersonScreen';
import TableScreen from './src/screens/TableScreen';
import NewTableScreen from './src/screens/NewTableScreen';
import NewPairScreen from './src/screens/NewPairScreen';
import ThreadScreen from './src/screens/ThreadScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import { demo } from './src/dev/demo';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme: Theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.surface, text: colors.ink, primary: colors.accent, border: colors.line } };

function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName={demo ? ({ tables: 'Tables', table: 'Tables', people: 'People', pairs: 'Pairs', chats: 'Chats', thread: 'Chats', paywall: 'Tables', onboard: 'Tables', you: 'You' } as const)[demo.name] : 'Tables'}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.bg },
        tabBarIcon: ({ color, size }) => <TabIcon name={route.name.toLowerCase() as 'tables' | 'people' | 'pairs' | 'chats' | 'you'} color={color} size={size} />,
      })}
    >
      <Tab.Screen name="Tables" component={TablesScreen} />
      <Tab.Screen name="People" component={PeopleScreen} />
      <Tab.Screen name="Pairs" component={PairsScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="You" component={YouScreen} />
    </Tab.Navigator>
  );
}

function Gate({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 28 }}>
      <Text style={type.h1}>{title}</Text>
      <Text style={[type.bodySoft, { marginTop: 10 }]}>{body}</Text>
      {action && onAction ? <PrimaryButton title={action} onPress={onAction} style={{ marginTop: 20 }} /> : null}
    </View>
  );
}

function Root() {
  const { ready, offline, error, profile, retry, prefs } = useApp();
  const [justOnboarded, setJustOnboarded] = useState(false);

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (offline) return <Gate title="Plainly is not configured" body="This build is missing its server settings. If you are seeing this in the App Store version, please email tryformaapp@gmail.com." />;
  if (error) return <Gate title="Could not reach Plainly" body={`${error}. Check your connection and try again.`} action="Try again" onAction={retry} />;
  if (!profile?.onboarded) return <OnboardingScreen onDone={() => setJustOnboarded(true)} />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator initialRouteName={demo ? (demo.name === 'table' ? 'Table' : demo.name === 'thread' ? 'Thread' : demo.name === 'paywall' ? 'Paywall' : 'Tabs') : justOnboarded && !prefs.seenPaywall ? 'Paywall' : 'Tabs'} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Person" component={PersonScreen} />
        <Stack.Screen name="Table" component={TableScreen} initialParams={demo ? { id: 't1' } : undefined} />
        <Stack.Screen name="NewTable" component={NewTableScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="NewPair" component={NewPairScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Thread" component={ThreadScreen} initialParams={demo ? { id: 'th1', title: 'Priya' } : undefined} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const webFrame = Platform.OS === 'web' ? ({ width: '100%', height: '100vh', overflow: 'hidden', backgroundColor: colors.bg } as const) : null;
const demoInsets = demo ? { paddingTop: 59, paddingBottom: 34 } : null;

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppProvider>
        <View style={[{ flex: 1 }, webFrame as any, demoInsets]}><Root /></View>
      </AppProvider>
    </SafeAreaProvider>
  );
}
