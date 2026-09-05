import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';
import { Screen, Header, PrimaryButton, Chip, Segmented } from '../components/UI';
import { Field, Choice } from '../components/Form';
import { colors, type } from '../theme';
import { useApp } from '../store/AppContext';
import { createTable, myTables } from '../logic/api';
import { TABLE_IDEAS, Noise, Light, Talk, LookingFor } from '../logic/types';
import { ScreenProps } from '../navigation';

const HOURS = [10, 11, 13, 14, 15, 16, 17, 18, 19, 20];
const days = () => Array.from({ length: 14 }).map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i); d.setHours(0, 0, 0, 0); return d; });

export default function NewTableScreen({ navigation }: ScreenProps<'NewTable'>) {
  const { uid, profile, isPlus } = useApp();
  const [title, setTitle] = useState('');
  const [plan, setPlan] = useState('');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState(profile?.city ?? '');
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(14);
  const [capacity, setCapacity] = useState(6);
  const [noise, setNoise] = useState<Noise>('quiet');
  const [light, setLight] = useState<Light>('normal');
  const [talk, setTalk] = useState<Talk>('optional');
  const [exit, setExit] = useState('Leave whenever. Say bye or just wave; nobody will ask why.');
  const [cost, setCost] = useState('Buy your own drink');
  const [access, setAccess] = useState('');
  const [openTo, setOpenTo] = useState<LookingFor>('both');
  const [busy, setBusy] = useState(false);
  const [hosting, setHosting] = useState(0);

  useEffect(() => { if (uid) myTables(uid).then((t) => setHosting(t.filter((x) => x.host_id === uid).length)).catch(() => {}); }, [uid]);

  const useIdea = (i: (typeof TABLE_IDEAS)[number]) => { setTitle(i.title); setPlan(i.plan); setNoise(i.noise); setLight(i.light); setTalk(i.talk); };

  const submit = async () => {
    const limit = isPlus ? 3 : 1;
    if (hosting >= limit) {
      if (!isPlus) return navigation.navigate('Paywall', { reason: 'Free hosts run one open table at a time. Plus lets you host three.' });
      return Alert.alert('Three open tables', 'Finish or cancel one before opening another.');
    }
    if (title.trim().length < 3) return Alert.alert('Title', 'Give the table a name people can picture.');
    if (city.trim().length < 2) return Alert.alert('City', 'Tables are grouped by city.');
    const d = days()[day]; d.setHours(hour, 0, 0, 0);
    if (d.getTime() < Date.now()) return Alert.alert('Time', 'Pick a time that is still ahead of us.');
    setBusy(true);
    try {
      const id = await createTable({ title: title.trim(), plan: plan.trim(), city: city.trim(), venue: venue.trim(), starts_at: d.toISOString(), capacity, noise, light, talk, exit_plan: exit.trim(), cost: cost.trim(), access: access.trim(), open_to: openTo });
      navigation.replace('Table', { id });
    } catch (e: any) { Alert.alert('Could not create', e?.message ?? 'Try again.'); } finally { setBusy(false); }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Host a table" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}>
          <Text style={type.bodySoft}>Pick a place you already know is calm. You are not entertaining anyone; you are choosing the room. Start from an idea or write your own.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
            {TABLE_IDEAS.map((i) => <Chip key={i.title} text={i.title} small selected={title === i.title} onPress={() => useIdea(i)} />)}
          </ScrollView>
          <Field label="Table name" value={title} onChange={setTitle} placeholder="Board games, quiet café" maxLength={80} />
          <Field label="What we will actually do" value={plan} onChange={setPlan} placeholder="Be specific. Specific is calming." multiline maxLength={600} />
          <Field label="Place" value={venue} onChange={setVenue} placeholder="Name of the café, park, library room" maxLength={120} />
          <Field label="City" value={city} onChange={setCity} autoCapitalize="words" maxLength={60} />

          <Text style={[type.label, { marginTop: 18 }]}>Day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 8 }}>
            {days().map((d, i) => <Chip key={i} small text={i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })} selected={day === i} onPress={() => setDay(i)} />)}
          </ScrollView>
          <Text style={[type.label, { marginTop: 14 }]}>Starts</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 8 }}>
            {HOURS.map((h) => <Chip key={h} small text={new Date(2000, 0, 1, h).toLocaleTimeString(undefined, { hour: 'numeric' })} selected={hour === h} onPress={() => setHour(h)} />)}
          </ScrollView>

          <Text style={[type.label, { marginTop: 18 }]}>Seats</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>{[4, 6, 8, 10].map((n) => <Chip key={n} small text={`${n}`} selected={capacity === n} onPress={() => setCapacity(n)} />)}</View>

          <Text style={[type.label, { marginTop: 18 }]}>Noise</Text>
          <Segmented<Noise> value={noise} onChange={setNoise} options={[{ value: 'quiet', label: 'Quiet' }, { value: 'moderate', label: 'Some' }, { value: 'loud', label: 'Loud' }]} />
          <Text style={[type.label, { marginTop: 14 }]}>Light</Text>
          <Segmented<Light> value={light} onChange={setLight} options={[{ value: 'dim', label: 'Dim' }, { value: 'normal', label: 'Normal' }, { value: 'bright', label: 'Bright' }]} />
          <Text style={[type.label, { marginTop: 14 }]}>Talking</Text>
          <Segmented<Talk> value={talk} onChange={setTalk} options={[{ value: 'optional', label: 'Optional' }, { value: 'light', label: 'Light' }, { value: 'lots', label: 'Lots' }]} />

          <Field label="Leaving early" value={exit} onChange={setExit} multiline maxLength={300} hint="Say it out loud once, so nobody has to plan an excuse." />
          <Field label="Cost" value={cost} onChange={setCost} maxLength={80} />
          <Field label="Access (optional)" value={access} onChange={setAccess} placeholder="Step-free? Quiet corner? Parking?" maxLength={200} />
          <Choice<LookingFor> label="Open to" value={openTo} onChange={setOpenTo} options={[{ value: 'both', label: 'Anyone on Plainly' }, { value: 'friends', label: 'Friends-first table', sub: 'Nobody is sizing anyone up.' }, { value: 'dates', label: 'Singles table', sub: 'Everyone here is open to dates.' }]} />
          <PrimaryButton title="Open the table" onPress={submit} loading={busy} style={{ marginTop: 22 }} />
          <Text style={[type.caption, { textAlign: 'center', marginTop: 10 }]}>Hosting {hosting} of {isPlus ? 3 : 1} open table{isPlus ? 's' : ''}.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
