import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Eyebrow } from '../components/UI';
import { Avatar, Notice } from '../components/Bits';
import { colors, radius, type } from '../theme';
import { inbox } from '../logic/api';
import { InboxRow, ago } from '../logic/types';
import { TabProps } from '../navigation';

export default function ChatsScreen({ navigation }: TabProps<'Chats'>) {
  const [rows, setRows] = useState<InboxRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { try { setRows(await inbox()); setErr(null); } catch (e: any) { setErr(e?.message ?? 'Could not load chats.'); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />} contentContainerStyle={{ paddingBottom: 40 }}>
        <Eyebrow style={{ marginTop: 8 }}>Chats</Eyebrow>
        <Text style={type.h1}>Everyone who said yes</Text>
        <Text style={[type.bodySoft, { marginTop: 6 }]}>Matches, tables and double dates. A slow reply is not a signal here; people say so on their cards.</Text>
        {err ? <Notice title="Could not load" body={err} action="Try again" onAction={load} /> : null}
        {rows && rows.length === 0 ? <Notice title="Nothing here yet" body="Chats open when someone says yes back, when you join a table, or when two pairs match. No inbox to manage until then." /> : null}
        {rows?.map((r) => {
          const title = r.kind === 'match' ? (r.members[0]?.name ?? 'Match') : r.kind === 'pair' ? 'Double date' : r.title || 'Table';
          const sub = r.kind === 'table' ? `${r.members.length + 1} at the table` : r.kind === 'pair' ? r.members.map((m) => m.name).join(', ') : '';
          const preview = r.last_kind === 'plan' ? 'Sent a plan card' : r.last_body ?? '';
          return (
            <Pressable key={r.thread_id} onPress={() => navigation.navigate('Thread', { id: r.thread_id, title })} style={styles.row}>
              <View style={{ flexDirection: 'row' }}>
                {r.members.slice(0, 2).map((m, i) => <View key={m.id} style={{ marginLeft: i ? -14 : 0 }}><Avatar name={m.name} path={m.photo} size={48} ring={r.members.length > 1} /></View>)}
                {r.members.length === 0 ? <Avatar name="?" size={48} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[type.body, { fontWeight: '700', flex: 1 }]} numberOfLines={1}>{title}</Text>
                  <Text style={type.caption}>{ago(r.last_message_at)}</Text>
                </View>
                <Text style={[type.caption, { color: r.kind === 'match' ? colors.coral : colors.accent, marginTop: 1 }]}>{r.kind === 'match' ? 'One-on-one' : r.kind === 'pair' ? 'Double date' : 'Table'}{sub ? ` · ${sub}` : ''}</Text>
                <Text style={[type.sub, r.unread ? { color: colors.ink, fontWeight: '700' } : null]} numberOfLines={1}>{preview}</Text>
              </View>
              {r.unread ? <View style={styles.dot}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{r.unread}</Text></View> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.line, marginTop: 10 },
  dot: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
});
