import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, RefreshControl, Switch, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Eyebrow, Chip } from '../components/UI';
import { Avatar, Facts, Notice } from '../components/Bits';
import { colors, radius, type } from '../theme';
import { useApp } from '../store/AppContext';
import { listPeople, like, pass, whoLikedMe } from '../logic/api';
import { Profile, age, LOOKING_LABEL, IDENTITIES } from '../logic/types';
import { TabProps } from '../navigation';

export default function PeopleScreen({ navigation }: TabProps<'People'>) {
  const { uid, profile, prefs, setPrefs, isPlus } = useApp();
  const [rows, setRows] = useState<Profile[] | null>(null);
  const [likedMe, setLikedMe] = useState<Profile[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [identity, setIdentity] = useState<string | null>(null);
  const [looking, setLooking] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const [p, l] = await Promise.all([listPeople(uid, profile?.city ?? '', { anywhere: prefs.anywhere, identity, looking }), whoLikedMe(uid)]);
      setRows(p); setLikedMe(l); setErr(null);
    } catch (e: any) { setErr(e?.message ?? 'Could not load people.'); }
  }, [uid, profile?.city, prefs.anywhere, identity, looking]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onYes = async (p: Profile) => {
    setRows((r) => (r ? r.filter((x) => x.id !== p.id) : r));
    try {
      const res = await like(p.id);
      if (res.matched && res.thread_id) {
        Alert.alert(`${p.display_name} already said yes`, 'You are matched. Say hi, or send a plan card.', [{ text: 'Later' }, { text: 'Open chat', onPress: () => navigation.navigate('Thread', { id: res.thread_id!, title: p.display_name }) }]);
      }
    } catch (e: any) { Alert.alert('Could not send', e?.message ?? 'Try again.'); }
  };
  const onPass = async (p: Profile) => { setRows((r) => (r ? r.filter((x) => x.id !== p.id) : r)); try { await pass(p.id); } catch { /* fine */ } };
  const gate = (fn: () => void) => (isPlus ? fn() : navigation.navigate('Paywall', { reason: 'Filters are part of Plus. Saying yes is free either way.' }));

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }}>
          <View>
            <Eyebrow>People</Eyebrow>
            <Text style={type.h1}>{prefs.anywhere ? 'Everywhere' : profile?.city || 'Near you'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={type.caption}>Anywhere</Text>
            <Switch value={prefs.anywhere} onValueChange={(v) => setPrefs({ anywhere: v })} trackColor={{ true: colors.accent }} />
          </View>
        </View>
        <Text style={[type.bodySoft, { marginTop: 6 }]}>One card at a time, no swiping. Say yes or pass; both are free and neither is a judgment.</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
          <Chip small text={looking === 'dates' ? 'Dates ✓' : 'Dates'} selected={looking === 'dates'} onPress={() => gate(() => setLooking(looking === 'dates' ? null : 'dates'))} />
          <Chip small text={looking === 'friends' ? 'Friends ✓' : 'Friends'} selected={looking === 'friends'} onPress={() => gate(() => setLooking(looking === 'friends' ? null : 'friends'))} />
          {IDENTITIES.slice(0, 4).map((i) => <Chip key={i} small text={i} selected={identity === i} onPress={() => gate(() => setIdentity(identity === i ? null : i))} />)}
        </ScrollView>

        {likedMe.length ? (
          <Pressable onPress={() => (isPlus ? navigation.navigate('Person', { id: likedMe[0].id, fromLikes: true }) : navigation.navigate('Paywall', { reason: `${likedMe.length} ${likedMe.length === 1 ? 'person has' : 'people have'} already said yes to you. Plus shows you who.` }))} style={styles.likedBar}>
            <View style={{ flexDirection: 'row' }}>
              {likedMe.slice(0, 3).map((p, i) => <View key={p.id} style={{ marginLeft: i ? -10 : 0 }}><Avatar name={p.display_name} path={isPlus ? p.photo_path : null} size={34} ring /></View>)}
            </View>
            <Text style={[type.body, { flex: 1, fontWeight: '700' }]}>{likedMe.length} {likedMe.length === 1 ? 'person' : 'people'} said yes to you</Text>
            <Text style={{ color: colors.accent, fontWeight: '800' }}>{isPlus ? 'See' : 'Plus'}</Text>
          </Pressable>
        ) : null}

        {err ? <Notice title="Could not load" body={err} action="Try again" onAction={load} /> : null}
        {rows && rows.length === 0 && !err ? (
          <Notice title={prefs.anywhere ? 'You have seen everyone for now' : `Quiet in ${profile?.city || 'your city'} right now`} body={prefs.anywhere ? 'New people show up here as they join. Tables are the fastest way to meet the ones already nearby.' : 'Plainly is new and cities fill one host at a time. Flip Anywhere to see everyone, or open a table and let people come to you.'} action={prefs.anywhere ? undefined : 'Show people anywhere'} onAction={() => setPrefs({ anywhere: true })} />
        ) : null}
        {rows?.map((p) => <PersonCard key={p.id} p={p} onOpen={() => navigation.navigate('Person', { id: p.id })} onYes={() => onYes(p)} onPass={() => onPass(p)} />)}
      </ScrollView>
    </Screen>
  );
}

function PersonCard({ p, onOpen, onYes, onPass }: { p: Profile; onOpen: () => void; onYes: () => void; onPass: () => void }) {
  const a = age(p.birth_year);
  return (
    <View style={styles.card}>
      <Pressable onPress={onOpen}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Avatar name={p.display_name} path={p.photo_path} size={64} />
          <View style={{ flex: 1 }}>
            <Text style={type.h2}>{p.display_name}{a ? `, ${a}` : ''}</Text>
            <Text style={type.sub}>{[p.pronouns, p.city, LOOKING_LABEL[p.looking_for]].filter(Boolean).join(' · ')}</Text>
          </View>
        </View>
        <View style={{ marginTop: 12 }}><Facts items={p.identities.slice(0, 3)} /></View>
        {p.best_first ? (
          <View style={{ marginTop: 12 }}>
            <Text style={type.caption}>A good first message to me is</Text>
            <Text style={[type.quote, { fontSize: 17, lineHeight: 25, marginTop: 2 }]}>“{p.best_first}”</Text>
          </View>
        ) : p.about ? <Text style={[type.bodySoft, { marginTop: 12 }]} numberOfLines={3}>{p.about}</Text> : null}
        {p.sensory.length ? <View style={{ marginTop: 12 }}><Facts tone="muted" items={p.sensory.slice(0, 3)} /></View> : null}
        {p.interests.length ? <Text style={[type.sub, { marginTop: 10 }]}>Could talk for an hour about: {p.interests.slice(0, 5).join(', ')}</Text> : null}
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <Pressable onPress={onPass} style={[styles.btn, { backgroundColor: colors.surface2 }]}><Text style={[styles.btnText, { color: colors.soft }]}>Pass</Text></Pressable>
        <Pressable onPress={onYes} style={[styles.btn, { backgroundColor: colors.accent, flex: 1.6 }]}><Text style={[styles.btnText, { color: colors.onAccent }]}>Say yes</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 18, borderWidth: 1, borderColor: colors.line, marginTop: 14 },
  btn: { flex: 1, height: 50, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 16, fontWeight: '800' },
  likedBar: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.accentSoft, borderRadius: radius.lg, padding: 12, marginTop: 14 },
});
