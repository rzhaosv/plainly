import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Eyebrow, PrimaryButton, SecondaryButton, GhostButton, Card } from '../components/UI';
import { Avatar, Facts, Notice } from '../components/Bits';
import { colors, radius, type } from '../theme';
import { useApp } from '../store/AppContext';
import { myPairs, listPairs, acceptPair, endPair, pairLike } from '../logic/api';
import { Pair, age, LOOKING_LABEL } from '../logic/types';
import { TabProps } from '../navigation';

export default function PairsScreen({ navigation }: TabProps<'Pairs'>) {
  const { uid, prefs } = useApp();
  const [mine, setMine] = useState<Pair[] | null>(null);
  const [others, setOthers] = useState<Pair[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const active = mine?.find((p) => p.status === 'active') ?? null;
  const pending = mine?.filter((p) => p.status === 'pending') ?? [];

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const m = await myPairs(uid);
      setMine(m);
      const a = m.find((p) => p.status === 'active');
      setOthers(a ? await listPairs(a, prefs.anywhere) : []);
      setErr(null);
    } catch (e: any) { setErr(e?.message ?? 'Could not load pairs.'); }
  }, [uid, prefs.anywhere]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onYes = async (target: Pair) => {
    if (!active) return;
    setOthers((o) => o.filter((x) => x.id !== target.id));
    try {
      const r = await pairLike(active.id, target.id);
      if (r.matched && r.thread_id) Alert.alert('They said yes too', 'Four people, one chat. Somebody send a plan card.', [{ text: 'Later' }, { text: 'Open chat', onPress: () => navigation.navigate('Thread', { id: r.thread_id!, title: 'Double date' }) }]);
    } catch (e: any) { Alert.alert('Could not send', e?.message ?? 'Try again.'); }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />} contentContainerStyle={{ paddingBottom: 40 }}>
        <Eyebrow style={{ marginTop: 8 }}>Pairs</Eyebrow>
        <Text style={type.h1}>Double dates, with your safe person</Text>
        <Text style={[type.bodySoft, { marginTop: 6 }]}>Pair up with a friend who is also on Plainly. Two of you meet two of them. Nobody has to carry the conversation alone, and leaving together is easy.</Text>

        {err ? <Notice title="Could not load" body={err} action="Try again" onAction={load} /> : null}

        {pending.map((p) => {
          const invitedMe = p.b_id === uid;
          const other = invitedMe ? p.a : p.b;
          return (
            <Card key={p.id} style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar name={other?.display_name ?? '?'} path={other?.photo_path} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={[type.body, { fontWeight: '700' }]}>{invitedMe ? `${other?.display_name ?? 'A friend'} asked you to pair up` : `Waiting for ${other?.display_name ?? 'your friend'} to accept`}</Text>
                  {p.name ? <Text style={type.sub}>“{p.name}”</Text> : null}
                </View>
              </View>
              {invitedMe ? (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <SecondaryButton title="Not now" onPress={async () => { await endPair(p.id); load(); }} style={{ flex: 1 }} />
                  <PrimaryButton title="Pair up" onPress={async () => { await acceptPair(p.id); load(); }} style={{ flex: 1.4, height: 50 }} />
                </View>
              ) : <GhostButton title="Withdraw" onPress={async () => { await endPair(p.id); load(); }} />}
            </Card>
          );
        })}

        {mine && !active && pending.length === 0 ? (
          <View style={styles.explain}>
            <Step n="1" t="Ask your friend to make a Plainly card and tell you their handle." />
            <Step n="2" t="Invite them here by handle. They tap accept." />
            <Step n="3" t="Say yes to other pairs in your city. When both pairs say yes, a four-person chat opens." />
            <PrimaryButton title="Invite my safe person" onPress={() => navigation.navigate('NewPair')} style={{ marginTop: 16, height: 50 }} />
          </View>
        ) : null}

        {active ? (
          <>
            <Card style={{ marginTop: 14, backgroundColor: colors.accentSoft, borderColor: colors.accentSoft }}>
              <Text style={type.label}>Your pair</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <PairFaces p={active} />
                <View style={{ flex: 1 }}>
                  <Text style={[type.h3]}>{active.name || `${active.a?.display_name} & ${active.b?.display_name}`}</Text>
                  <Text style={type.sub}>{[active.city, LOOKING_LABEL[active.vibe]].filter(Boolean).join(' · ')}</Text>
                </View>
              </View>
              {active.note ? <Text style={[type.bodySoft, { marginTop: 10 }]}>{active.note}</Text> : null}
              <GhostButton title="End this pair" onPress={() => Alert.alert('End the pair?', 'You can pair again any time.', [{ text: 'Keep' }, { text: 'End', style: 'destructive', onPress: async () => { await endPair(active.id); load(); } }])} />
            </Card>
            <Text style={[type.label, { marginTop: 22 }]}>Pairs {prefs.anywhere ? 'everywhere' : `in ${active.city || 'your city'}`}</Text>
            {others.length === 0 ? <Notice title="No other pairs yet" body="Pairs are the newest part of Plainly. Tell one more duo you know; two pairs make a double date." /> : null}
            {others.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <PairFaces p={p} />
                  <View style={{ flex: 1 }}>
                    <Text style={type.h2}>{p.name || `${p.a?.display_name} & ${p.b?.display_name}`}</Text>
                    <Text style={type.sub}>{[p.a?.display_name, age(p.a?.birth_year)].filter(Boolean).join(', ')} · {[p.b?.display_name, age(p.b?.birth_year)].filter(Boolean).join(', ')}</Text>
                  </View>
                </View>
                {p.note ? <Text style={[type.bodySoft, { marginTop: 10 }]}>{p.note}</Text> : null}
                <View style={{ marginTop: 10 }}><Facts tone="coral" items={[LOOKING_LABEL[p.vibe], p.city]} /></View>
                <PrimaryButton title="Say yes as a pair" onPress={() => onYes(p)} style={{ marginTop: 14, height: 50 }} />
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
function PairFaces({ p }: { p: Pair }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <Avatar name={p.a?.display_name ?? '?'} path={p.a?.photo_path} size={44} ring />
      <View style={{ marginLeft: -12 }}><Avatar name={p.b?.display_name ?? '?'} path={p.b?.photo_path} size={44} ring /></View>
    </View>
  );
}
function Step({ n, t }: { n: string; t: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '800' }}>{n}</Text></View>
      <Text style={[type.body, { flex: 1 }]}>{t}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  explain: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 18, borderWidth: 1, borderColor: colors.line, marginTop: 16 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 18, borderWidth: 1, borderColor: colors.line, marginTop: 12 },
});
