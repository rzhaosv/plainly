import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, PrimaryButton, SecondaryButton, GhostButton, Card } from '../components/UI';
import { Avatar, SensoryLine, Facts } from '../components/Bits';
import { colors, type } from '../theme';
import { useApp } from '../store/AppContext';
import { getTable, tableGuests, rsvp, cancelTable } from '../logic/api';
import { TableRow, timeLabel, LOOKING_LABEL, age } from '../logic/types';
import { ScreenProps } from '../navigation';

export default function TableScreen({ navigation, route }: ScreenProps<'Table'>) {
  const { uid } = useApp();
  const [t, setT] = useState<TableRow | null>(null);
  const [guests, setGuests] = useState<Awaited<ReturnType<typeof tableGuests>>>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    const row = await getTable(route.params.id, uid);
    setT(row);
    if (row) setGuests(await tableGuests(row.id));
  }, [uid, route.params.id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const set = async (s: 'going' | 'maybe' | 'out') => {
    setBusy(true);
    try { await rsvp(route.params.id, s); await load(); }
    catch (e: any) { Alert.alert('Could not update', e?.message ?? 'Try again.'); } finally { setBusy(false); }
  };
  const cancel = () => Alert.alert('Cancel this table?', 'Everyone going gets a plain note that plans changed.', [
    { text: 'Keep it', style: 'cancel' },
    { text: 'Cancel table', style: 'destructive', onPress: async () => { await cancelTable(route.params.id); navigation.goBack(); } },
  ]);

  if (!t) return <Screen edges={['top', 'bottom']}><Header title="Table" onBack={() => navigation.goBack()} /></Screen>;
  const isHost = t.host_id === uid;
  const member = t.mine === 'going' || t.mine === 'maybe' || isHost;
  const full = (t.going ?? 0) >= t.capacity && t.mine !== 'going';

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Table" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <Text style={type.caption}>{timeLabel(t.starts_at)}</Text>
        <Text style={[type.display, { marginTop: 6 }]}>{t.title}</Text>
        <Pressable onPress={() => t.host && navigation.navigate('Person', { id: t.host.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <Avatar name={t.host?.display_name ?? '?'} path={t.host?.photo_path} size={36} />
          <Text style={type.sub}>Hosted by {t.host?.display_name ?? 'someone'}{isHost ? ' (you)' : ''}</Text>
        </Pressable>
        <View style={{ marginTop: 14 }}><SensoryLine noise={t.noise} light={t.light} talk={t.talk} /></View>
        <Card style={{ marginTop: 16 }}>
          <Row k="Where" v={t.venue || 'Host will say in the chat'} />
          <Row k="City" v={t.city} />
          <Row k="Plan" v={t.plan || 'Sit together. That is the plan.'} />
          <Row k="Leaving early" v={t.exit_plan || 'Leave whenever.'} />
          <Row k="Cost" v={t.cost || 'Nothing planned'} />
          {t.access ? <Row k="Access" v={t.access} /> : null}
          <Row k="Open to" v={LOOKING_LABEL[t.open_to]} />
          <Row k="Seats" v={`${t.going ?? 0} of ${t.capacity} taken`} />
        </Card>

        <Text style={[type.label, { marginTop: 22 }]}>Who is coming</Text>
        <View style={{ marginTop: 10, gap: 10 }}>
          {guests.map((g) => (
            <Pressable key={g.id} onPress={() => navigation.navigate('Person', { id: g.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar name={g.display_name} path={g.photo_path} size={40} />
              <Text style={[type.body, { flex: 1, fontWeight: '600' }]}>{g.display_name}{age(g.birth_year) ? `, ${age(g.birth_year)}` : ''}</Text>
              <Facts tone={g.status === 'going' ? 'accent' : 'muted'} items={[g.status === 'going' ? 'Going' : 'Maybe']} />
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: 26, gap: 10 }}>
          {member && t.thread_id ? <PrimaryButton title="Open the table chat" onPress={() => navigation.navigate('Thread', { id: t.thread_id!, title: t.title })} /> : null}
          {!isHost && t.status !== 'cancelled' ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <PrimaryButton title={t.mine === 'going' ? 'Going ✓' : full ? 'Full' : 'I am going'} onPress={() => set('going')} disabled={busy || full || t.mine === 'going'} style={{ flex: 1, height: 50 }} color={colors.ok} />
              <SecondaryButton title={t.mine === 'maybe' ? 'Maybe ✓' : 'Maybe'} onPress={() => set('maybe')} disabled={busy || t.mine === 'maybe'} style={{ flex: 1 }} />
            </View>
          ) : null}
          {!isHost && (t.mine === 'going' || t.mine === 'maybe') ? <GhostButton title="I am out (no reason needed)" onPress={() => set('out')} /> : null}
          {isHost ? <GhostButton title="Cancel this table" onPress={cancel} color={colors.danger} /> : null}
        </View>
        <Text style={[type.caption, { marginTop: 18, lineHeight: 18 }]}>Tables are public places only, never someone's home. Tell a friend where you are going. If anything feels off, leave; you owe nobody an explanation.</Text>
      </ScrollView>
    </Screen>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
      <Text style={[type.caption, { width: 92 }]}>{k}</Text>
      <Text style={[type.body, { flex: 1 }]}>{v}</Text>
    </View>
  );
}
const styles = StyleSheet.create({});
