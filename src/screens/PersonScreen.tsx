import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, PrimaryButton, SecondaryButton, GhostButton, Card } from '../components/UI';
import { Avatar, Facts } from '../components/Bits';
import { colors, type } from '../theme';
import { useApp } from '../store/AppContext';
import { getProfile, like, pass, block, matchFor, unmatch } from '../logic/api';
import { Profile, age, LOOKING_LABEL } from '../logic/types';
import { ScreenProps } from '../navigation';

export default function PersonScreen({ navigation, route }: ScreenProps<'Person'>) {
  const { uid } = useApp();
  const [p, setP] = useState<Profile | null>(null);
  const [match, setMatch] = useState<{ id: string; thread_id: string | null } | null>(null);
  const [gone, setGone] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    setP(await getProfile(route.params.id));
    setMatch(await matchFor(uid, route.params.id));
  }, [uid, route.params.id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onYes = async () => {
    if (!p) return;
    try {
      const r = await like(p.id);
      if (r.matched && r.thread_id) navigation.replace('Thread', { id: r.thread_id, title: p.display_name });
      else { setGone(true); Alert.alert('Sent', `If ${p.display_name} says yes too, a chat opens. Nothing to do until then.`); }
    } catch (e: any) { Alert.alert('Could not send', e?.message ?? 'Try again.'); }
  };
  const onPass = async () => { if (!p) return; try { await pass(p.id); } catch { /* ok */ } navigation.goBack(); };
  const onBlock = () => Alert.alert('Block or report', 'Blocking hides you from each other everywhere. Reporting also tells us why.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Block', style: 'destructive', onPress: async () => { await block(route.params.id); navigation.goBack(); } },
    { text: 'Block and report', style: 'destructive', onPress: () => Alert.alert('Reason', 'Pick the closest.', [
      { text: 'Harassment', onPress: async () => { await block(route.params.id, 'harassment'); navigation.goBack(); } },
      { text: 'Fake or scam', onPress: async () => { await block(route.params.id, 'fake'); navigation.goBack(); } },
      { text: 'Under 18', onPress: async () => { await block(route.params.id, 'underage'); navigation.goBack(); } },
      { text: 'Something else', onPress: async () => { await block(route.params.id, 'other'); navigation.goBack(); } },
    ]) },
  ]);
  const onUnmatch = () => match && Alert.alert('Unmatch?', 'The chat closes for both of you. No message is sent.', [{ text: 'Keep' }, { text: 'Unmatch', style: 'destructive', onPress: async () => { await unmatch(match.id); navigation.goBack(); } }]);

  if (!p) return <Screen edges={['top', 'bottom']}><Header title="" onBack={() => navigation.goBack()} /></Screen>;
  const isMe = p.id === uid;
  const a = age(p.birth_year);

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <Avatar name={p.display_name} path={p.photo_path} size={132} />
          <Text style={[type.display, { marginTop: 14, textAlign: 'center' }]}>{p.display_name}{a ? `, ${a}` : ''}</Text>
          <Text style={[type.sub, { marginTop: 4 }]}>{[p.pronouns, p.city, `@${p.handle ?? ''}`].filter(Boolean).join(' · ')}</Text>
          <View style={{ marginTop: 12 }}><Facts tone="coral" items={[LOOKING_LABEL[p.looking_for]]} /></View>
        </View>
        {p.identities.length ? <Section title="How I am wired"><Facts items={p.identities} /></Section> : null}
        {p.best_first ? <Section title="A good first message to me is"><Text style={type.quote}>“{p.best_first}”</Text></Section> : null}
        {p.about ? <Section title="About"><Text style={type.body}>{p.about}</Text></Section> : null}
        {p.communication.length ? <Section title="How I like to talk"><Facts tone="muted" items={p.communication} /></Section> : null}
        {p.sensory.length ? <Section title="A good first meet looks like"><Facts tone="muted" items={p.sensory} /></Section> : null}
        {p.interests.length ? <Section title="Could talk for an hour about"><Text style={type.body}>{p.interests.join(' · ')}</Text></Section> : null}

        {!isMe ? (
          <View style={{ marginTop: 24, gap: 10 }}>
            {match?.thread_id ? <PrimaryButton title="Open chat" onPress={() => navigation.navigate('Thread', { id: match.thread_id!, title: p.display_name })} /> : !gone ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <SecondaryButton title="Pass" onPress={onPass} style={{ flex: 1 }} />
                <PrimaryButton title="Say yes" onPress={onYes} style={{ flex: 1.6, height: 52 }} />
              </View>
            ) : <Text style={[type.sub, { textAlign: 'center' }]}>Yes sent.</Text>}
            {match ? <GhostButton title="Unmatch" onPress={onUnmatch} /> : null}
            <GhostButton title="Block or report" onPress={onBlock} color={colors.danger} />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card style={{ marginTop: 14 }}><Text style={[type.label, { marginBottom: 10 }]}>{title}</Text>{children}</Card>;
}
const styles = StyleSheet.create({});
