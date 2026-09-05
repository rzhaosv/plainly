import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Modal, ScrollView, Alert } from 'react-native';
import { Screen, Header, PrimaryButton, GhostButton, Segmented } from '../components/UI';
import { Field } from '../components/Form';
import { Avatar, PlanCardView } from '../components/Bits';
import { colors, radius, type } from '../theme';
import { useApp } from '../store/AppContext';
import { messages as fetchMessages, sendText, sendPlan, subscribeThread, markRead, threadMembers } from '../logic/api';
import { Message, Noise, PlanCard } from '../logic/types';
import { ScreenProps } from '../navigation';

const SCRIPTS = ['Hi. Your card said questions about your current obsession, so: what is it this week?', 'I do not do small talk well. Would a plan card be easier?', 'Slow replies from me are normal; you are not being ignored.', 'Table question: how loud does it usually get there?'];

export default function ThreadScreen({ navigation, route }: ScreenProps<'Thread'>) {
  const { uid, profile } = useApp();
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [members, setMembers] = useState<Record<string, { name: string; photo: string | null }>>({});
  const [planOpen, setPlanOpen] = useState(false);
  const list = useRef<FlatList<Message>>(null);
  const id = route.params.id;

  const load = useCallback(async () => {
    try {
      const [m, mem] = await Promise.all([fetchMessages(id), threadMembers(id)]);
      setMsgs(m);
      const map: Record<string, { name: string; photo: string | null }> = {};
      mem.forEach((p) => { if (p) map[p.id] = { name: p.display_name, photo: p.photo_path }; });
      setMembers(map);
      markRead(id).catch(() => {});
    } catch (e: any) { Alert.alert('Could not load', e?.message ?? 'Try again.'); }
  }, [id]);

  useEffect(() => {
    load();
    const off = subscribeThread(id, (m) => { setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m])); markRead(id).catch(() => {}); });
    return off;
  }, [id, load]);

  const send = async () => {
    const body = text.trim();
    if (!body || !uid) return;
    setText('');
    const optimistic: Message = { id: `tmp-${Date.now()}`, thread_id: id, sender_id: uid, kind: 'text', body, plan: null, created_at: new Date().toISOString() };
    setMsgs((p) => [...p, optimistic]);
    try { await sendText(id, uid, body); } catch (e: any) { Alert.alert('Not sent', e?.message ?? 'Try again.'); setMsgs((p) => p.filter((m) => m.id !== optimistic.id)); }
  };
  const onPlan = async (plan: PlanCard) => {
    if (!uid) return;
    setPlanOpen(false);
    try { await sendPlan(id, uid, plan); await load(); } catch (e: any) { Alert.alert('Not sent', e?.message ?? 'Try again.'); }
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: 20 }}><Header title={route.params.title ?? 'Chat'} onBack={() => navigation.goBack()} /></View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={8}>
        <FlatList
          ref={list}
          data={msgs}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          renderItem={({ item: m }) => {
            const mine = m.sender_id === uid;
            if (m.kind === 'system') return <Text style={styles.system}>{m.body}</Text>;
            const who = members[m.sender_id];
            return (
              <View style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                {!mine ? <Avatar name={who?.name ?? '?'} path={who?.photo} size={28} /> : null}
                {m.kind === 'plan' && m.plan ? <PlanCardView plan={m.plan} mine={mine} /> : (
                  <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                    {!mine && Object.keys(members).length > 1 ? <Text style={[type.caption, { marginBottom: 2 }]}>{who?.name ?? ''}</Text> : null}
                    <Text style={[type.body, mine && { color: colors.onPlum }]}>{m.body}</Text>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={<Text style={[type.bodySoft, { textAlign: 'center', marginTop: 30 }]}>Say hi. Or send a plan card and skip the small talk.</Text>}
        />
        {msgs.filter((m) => m.kind !== 'system').length === 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}>
            {SCRIPTS.map((s) => <Pressable key={s} onPress={() => setText(s)} style={styles.script}><Text style={type.sub} numberOfLines={2}>{s}</Text></Pressable>)}
          </ScrollView>
        ) : null}
        <View style={styles.composer}>
          <Pressable onPress={() => setPlanOpen(true)} style={styles.planBtn}><Text style={{ color: colors.accent, fontWeight: '800', fontSize: 13 }}>Plan card</Text></Pressable>
          <TextInput value={text} onChangeText={setText} placeholder="Say it plainly" placeholderTextColor={colors.muted} style={styles.input} multiline />
          <Pressable onPress={send} disabled={!text.trim()} style={[styles.send, !text.trim() && { opacity: 0.4 }]}><Text style={{ color: '#fff', fontWeight: '800' }}>Send</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
      <PlanModal open={planOpen} onClose={() => setPlanOpen(false)} onSend={onPlan} defaultExit={profile?.sensory.includes('Somewhere I can leave easily') ? 'Either of us can leave any time; say so or just go.' : 'Either of us can leave any time. No reason needed.'} />
    </Screen>
  );
}

function PlanModal({ open, onClose, onSend, defaultExit }: { open: boolean; onClose: () => void; onSend: (p: PlanCard) => void; defaultExit: string }) {
  const [what, setWhat] = useState('');
  const [where, setWhere] = useState('');
  const [when, setWhen] = useState('');
  const [howLong, setHowLong] = useState('45 minutes, longer if we both want');
  const [noise, setNoise] = useState<Noise>('quiet');
  const [exit, setExit] = useState(defaultExit);
  const [note, setNote] = useState('');
  const submit = () => {
    if (!what.trim() || !where.trim() || !when.trim()) return Alert.alert('Three blanks', 'What, where and when. The rest can be rough.');
    onSend({ what: what.trim(), where: where.trim(), when: when.trim(), how_long: howLong.trim(), noise, exit: exit.trim(), note: note.trim() || undefined });
  };
  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 }}>
        <Header title="Plan card" onBack={onClose} backLabel="Close" />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}>
          <Text style={type.bodySoft}>A plan card replaces the “so… what do you want to do?” loop. Everything the other person needs to say yes with confidence, in one card.</Text>
          <Field label="What" value={what} onChange={setWhat} placeholder="Board games, or a walk, or the aquarium" maxLength={80} />
          <Field label="Where" value={where} onChange={setWhere} placeholder="Name the exact place" maxLength={120} />
          <Field label="When" value={when} onChange={setWhen} placeholder="Saturday 2pm" maxLength={60} />
          <Field label="How long" value={howLong} onChange={setHowLong} maxLength={60} />
          <Text style={[type.label, { marginTop: 16 }]}>Noise there</Text>
          <Segmented<Noise> value={noise} onChange={setNoise} options={[{ value: 'quiet', label: 'Quiet' }, { value: 'moderate', label: 'Some' }, { value: 'loud', label: 'Loud' }]} />
          <Field label="Leaving early" value={exit} onChange={setExit} multiline maxLength={200} />
          <Field label="Note (optional)" value={note} onChange={setNote} placeholder="I will be the one in the green jacket." multiline maxLength={200} />
          <PrimaryButton title="Send plan card" onPress={submit} style={{ marginTop: 20 }} />
          <GhostButton title="Cancel" onPress={onClose} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '78%', borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10 },
  mine: { backgroundColor: colors.plum, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 6 },
  system: { ...type.caption, textAlign: 'center', marginVertical: 8, paddingHorizontal: 20, lineHeight: 17 } as any,
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
  planBtn: { height: 44, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 22, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10, fontSize: 16, color: colors.ink },
  send: { height: 44, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  script: { width: 220, backgroundColor: colors.surface2, borderRadius: radius.md, padding: 10 },
});
