import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile } from '../logic/types';
import { ensureSession, getMyProfile, saveProfile } from '../logic/api';
import { supabase } from '../services/supabase';
import { configureBilling, getCustomerInfo, isPlus, addPlusListener } from '../services/billing';
import { demo } from '../dev/demo';

const DEV_UNLOCK = process.env.EXPO_PUBLIC_DEV_UNLOCK === '1' || process.env.EXPO_PUBLIC_DEV_UNLOCK === 'true';
const PREFS_KEY = 'plainly.prefs.v1';

export type Prefs = { anywhere: boolean; seenPaywall: boolean; welcomedAt: string | null };
const DEFAULT_PREFS: Prefs = { anywhere: false, seenPaywall: false, welcomedAt: null };

type Ctx = {
  ready: boolean;
  offline: boolean;
  error: string | null;
  uid: string | null;
  profile: Profile | null;
  isPlus: boolean;
  setPlus: (v: boolean) => void;
  prefs: Prefs;
  setPrefs: (p: Partial<Prefs>) => void;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  retry: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plus, setPlus] = useState(DEV_UNLOCK || (!!demo && demo.name !== 'paywall'));
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [attempt, setAttempt] = useState(0);
  const offline = !supabase && !demo;

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PREFS_KEY);
        if (raw) setPrefsState({ ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) });
      } catch { /* fresh */ }
      if (offline) { setReady(true); return; }
      if (demo) { setUid('me'); setProfile(await getMyProfile('me')); setReady(true); return; }
      try {
        const id = await ensureSession();
        setUid(id);
        setProfile(await getMyProfile(id));
        configureBilling(id);
        const info = await getCustomerInfo();
        if (isPlus(info)) setPlus(true);
        unsub = addPlusListener((v) => setPlus(v || DEV_UNLOCK));
        setError(null);
      } catch (e: any) {
        setError(e?.message ?? 'Could not reach Plainly.');
      }
      setReady(true);
    })();
    return () => unsub();
  }, [attempt, offline]);

  const setPrefs = useCallback((p: Partial<Prefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...p };
      AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
    if (!uid) return;
    const saved = await saveProfile(uid, patch);
    setProfile(saved);
  }, [uid]);

  const refreshProfile = useCallback(async () => {
    if (!uid) return;
    setProfile(await getMyProfile(uid));
  }, [uid]);

  return (
    <AppCtx.Provider value={{ ready, offline, error, uid, profile, isPlus: plus, setPlus, prefs, setPrefs, updateProfile, refreshProfile, retry: () => { setReady(false); setAttempt((a) => a + 1); } }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp outside provider');
  return c;
}
