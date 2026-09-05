import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Tables: undefined;
  People: undefined;
  Pairs: undefined;
  Chats: undefined;
  You: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Person: { id: string; fromLikes?: boolean };
  Table: { id: string };
  NewTable: undefined;
  NewPair: undefined;
  Thread: { id: string; title?: string };
  EditProfile: undefined;
  Paywall: { reason?: string } | undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
export type TabProps<T extends keyof TabParamList> = CompositeScreenProps<BottomTabScreenProps<TabParamList, T>, NativeStackScreenProps<RootStackParamList>>;
