import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, RefreshControl, ScrollView, Switch } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Eyebrow, PrimaryButton } from '../components/UI';
import { Avatar, SensoryLine, Notice } from '../components/Bits';
import { colors, radius, type } from '../theme';
import { useApp } from '../store/AppContext';
import { listTables } from '../logic/api';
import { TableRow, timeLabel, LOOKING_LABEL, TABLE_IDEAS } from '../logic/types';
import { TabProps } from '../navigation';

export default function TablesScreen({ navigation }: TabProps<'Tables'>) {
  const { uid, profile, prefs, setPrefs } = useApp();
  const [rows, setRows] = useState<TableRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    try { setRows(await listTables(uid, profile?.city ?? '', prefs.anywhere)); setErr(null); }
    catch (e: any) { setErr(e?.message ?? 'Could not load tables.'); }
  }, [uid, profile?.city, prefs.anywhere]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }}>
          <View>
            <Eyebrow>Tables</Eyebrow>
            <Text style={type.h1}>{prefs.anywhere ? 'Everywhere' : profile?.city || 'Near you'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={type.caption}>Anywhere</Text>
            <Switch value={prefs.anywhere} onValueChange={(v) => setPrefs({ anywhere: v })} trackColor={{ true: colors.accent }} />
          </View>
        </View>
        <Text style={[type.bodySoft, { marginTop: 6 }]}>Small group invites, four to eight people. Every table says how loud it is, how bright, how much talking, and how to leave early.</Text>
        <PrimaryButton title="Host a table" onPress={() => navigation.navigate('NewTable')} style={{ marginTop: 16, height: 50 }} />

        {err ? <Notice title="Could not load" body={err} action="Try again" onAction={load} /> : null}
        {rows && rows.length === 0 && !err ? (
          <Notice title={`No tables in ${prefs.anywhere ? 'the app' : profile?.city || 'your city'} yet`} body="Be the first host. The host picks a quiet place they already know, sets a time and a way out, and Plainly tells everyone nearby. Six people is plenty." />
        ) : null}
        {rows?.map((t) => <TableCard key={t.id} t={t} onPress={() => navigation.navigate('Table', { id: t.id })} />)}

        {rows && rows.length < 3 ? (
          <View style={{ marginTop: 26 }}>
            <Eyebrow>Tables that work</Eyebrow>
            <Text style={[type.bodySoft, { marginTop: 6, marginBottom: 6 }]}>Tap one to host it. Edit anything.</Text>
            {TABLE_IDEAS.map((i) => (
              <Pressable key={i.title} onPress={() => navigation.navigate('NewTable')} style={styles.idea}>
                <Text style={[type.body, { fontWeight: '700' }]}>{i.title}</Text>
                <Text style={type.sub}>{i.plan}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

export function TableCard({ t, onPress }: { t: TableRow; onPress: () => void }) {
  const spots = Math.max(0, t.capacity - (t.going ?? 0));
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={type.caption}>{timeLabel(t.starts_at)}{t.venue ? `  ·  ${t.venue}` : ''}</Text>
          <Text style={[type.h2, { marginTop: 4 }]}>{t.title}</Text>
        </View>
        <Avatar name={t.host?.display_name ?? '?'} path={t.host?.photo_path} size={40} />
      </View>
      {t.plan ? <Text style={[type.bodySoft, { marginTop: 8 }]} numberOfLines={3}>{t.plan}</Text> : null}
      <View style={{ marginTop: 10 }}><SensoryLine noise={t.noise} light={t.light} talk={t.talk} /></View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}>
        <Text style={type.sub}>{t.going ?? 0} going · {t.status === 'full' || spots === 0 ? 'full' : `${spots} spot${spots === 1 ? '' : 's'} left`} · {LOOKING_LABEL[t.open_to]}</Text>
        {t.mine === 'going' ? <Text style={[type.caption, { color: colors.ok, fontWeight: '800' }]}>You are going</Text> : t.mine === 'maybe' ? <Text style={[type.caption, { color: colors.coral, fontWeight: '800' }]}>Maybe</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.line, marginTop: 12 },
  idea: { backgroundColor: colors.surface2, borderRadius: radius.md, padding: 14, marginTop: 8 },
});
