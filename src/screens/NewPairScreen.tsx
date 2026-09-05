import React, { useState } from 'react';
import { Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen, Header, PrimaryButton } from '../components/UI';
import { Field, Choice } from '../components/Form';
import { type } from '../theme';
import { useApp } from '../store/AppContext';
import { createPair } from '../logic/api';
import { LookingFor } from '../logic/types';
import { ScreenProps } from '../navigation';

export default function NewPairScreen({ navigation }: ScreenProps<'NewPair'>) {
  const { profile } = useApp();
  const [handle, setHandle] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [city, setCity] = useState(profile?.city ?? '');
  const [vibe, setVibe] = useState<LookingFor>('both');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (handle.trim().length < 3) return Alert.alert('Handle', 'Ask your friend for their Plainly handle. It is on their You tab.');
    setBusy(true);
    try { await createPair(handle, name, note, city, vibe); navigation.goBack(); }
    catch (e: any) { Alert.alert('Could not invite', e?.message ?? 'Try again.'); } finally { setBusy(false); }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Invite your safe person" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}>
          <Text style={type.bodySoft}>Your safe person is a friend, sibling, roommate; anyone you are relaxed around. They need a Plainly card too. Once they accept, your pair shows up to other pairs in your city.</Text>
          <Field label="Their handle" value={handle} onChange={setHandle} placeholder="@quietowl" autoCapitalize="none" maxLength={21} />
          <Field label="Pair name (optional)" value={name} onChange={setName} placeholder="e.g. The Puzzle People" maxLength={60} />
          <Field label="A line about the two of you" value={note} onChange={setNote} placeholder="One of us talks, one of us listens. We like museums before they get busy." multiline maxLength={400} />
          <Field label="City" value={city} onChange={setCity} autoCapitalize="words" maxLength={60} />
          <Choice<LookingFor> label="As a pair we are open to" value={vibe} onChange={setVibe} options={[
            { value: 'dates', label: 'Double dates', sub: 'Both of you are single and open to it.' },
            { value: 'friends', label: 'Friend pairs', sub: 'Two duos doing a thing together.' },
            { value: 'both', label: 'Either', sub: 'See what fits.' },
          ]} />
          <PrimaryButton title="Send the invite" onPress={submit} loading={busy} style={{ marginTop: 22 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
