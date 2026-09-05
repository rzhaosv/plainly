import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, type } from '../theme';
import { PrimaryButton, GhostButton, ProgressDots, Eyebrow } from '../components/UI';
import { Field, ChipPicker, Choice } from '../components/Form';
import { Avatar } from '../components/Bits';
import { useApp } from '../store/AppContext';
import { IDENTITIES, COMMUNICATION, SENSORY, INTEREST_SUGGESTIONS, LookingFor } from '../logic/types';
import { handleFree, uploadPhoto } from '../logic/api';

const STEPS = 6;

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { uid, updateProfile } = useApp();
  const [step, setStep] = useState(0);
  const [looking, setLooking] = useState<LookingFor>('both');
  const [identities, setIdentities] = useState<string[]>([]);
  const [comm, setComm] = useState<string[]>([]);
  const [sensory, setSensory] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [year, setYear] = useState('');
  const [city, setCity] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [bestFirst, setBestFirst] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!r.canceled && r.assets?.[0]) setPhoto(r.assets[0].uri);
  };

  const finish = async () => {
    const y = Number(year);
    const thisYear = new Date().getFullYear();
    const h = handle.trim().toLowerCase().replace(/^@/, '');
    if (name.trim().length < 1) return Alert.alert('One more thing', 'Add the name people should call you.');
    if (!/^[a-z0-9_]{3,20}$/.test(h)) return Alert.alert('Handle', 'Handles are 3 to 20 characters: letters, numbers, underscores.');
    if (!y || thisYear - y < 18 || thisYear - y > 110) return Alert.alert('Age', 'Plainly is for adults. Enter the year you were born.');
    if (city.trim().length < 2) return Alert.alert('City', 'Tables and people are grouped by city, so this one matters.');
    setBusy(true);
    try {
      if (uid && !(await handleFree(h, uid))) { setBusy(false); return Alert.alert('Handle taken', 'Someone already has that one. Try another.'); }
      let photo_path: string | null = null;
      if (photo && uid) { try { photo_path = await uploadPhoto(uid, photo); } catch { /* photo optional */ } }
      await updateProfile({
        display_name: name.trim(), handle: h, birth_year: y, city: city.trim(), pronouns: pronouns.trim(), looking_for: looking,
        identities, communication: comm, sensory, interests, best_first: bestFirst.trim(), photo_path, visible: true, onboarded: true,
      });
      onDone();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Try again in a moment.');
    } finally { setBusy(false); }
  };

  const next = () => (step < STEPS - 1 ? setStep(step + 1) : finish());
  const back = () => step > 0 && setStep(step - 1);
  const canNext = step === 1 ? true : step === 2 ? identities.length > 0 : true;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.top}><ProgressDots count={STEPS} index={step} /></View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === 0 && (
            <>
              <View style={{ alignItems: 'center', marginTop: 24 }}>
                <Image source={require('../../assets/icon.png')} style={{ width: 120, height: 120, borderRadius: 30 }} />
              </View>
              <Eyebrow style={{ textAlign: 'center', marginTop: 22 }}>Plainly</Eyebrow>
              <Text style={[type.display, { textAlign: 'center', marginTop: 8 }]}>Dating and friends,{'\n'}for the neurodivergent.</Text>
              <Text style={[type.bodySoft, { textAlign: 'center', marginTop: 14, fontSize: 16, lineHeight: 25 }]}>
                Small tables in quiet places. One-on-one when you are ready. Double dates with your safe person. Every plan says how loud it is and how to leave.
              </Text>
              <View style={styles.promise}>
                <Line t="No swiping, no streaks, no games." />
                <Line t="Saying yes is free, and stays free." />
                <Line t="Your sensory needs go on the card, not in an apology later." />
                <Line t="Adults only. Nobody has to explain their diagnosis." />
              </View>
            </>
          )}
          {step === 1 && (
            <>
              <Text style={type.h1}>What are you here for?</Text>
              <Text style={[type.bodySoft, { marginTop: 8 }]}>You can change this any time. People see it, so nobody has to guess.</Text>
              <Choice value={looking} onChange={setLooking} options={[
                { value: 'dates', label: 'Dates', sub: 'Romance, at whatever pace.' },
                { value: 'friends', label: 'Friends', sub: 'People to do the thing with. Parallel play counts.' },
                { value: 'both', label: 'Either, honestly', sub: 'Open to what fits.' },
              ]} />
            </>
          )}
          {step === 2 && (
            <>
              <Text style={type.h1}>How are you wired?</Text>
              <Text style={[type.bodySoft, { marginTop: 8 }]}>Pick what fits. Self-identified counts; nobody here asks for paperwork.</Text>
              <ChipPicker options={IDENTITIES} value={identities} onChange={setIdentities} />
            </>
          )}
          {step === 3 && (
            <>
              <Text style={type.h1}>How you like to talk</Text>
              <Text style={[type.bodySoft, { marginTop: 8 }]}>Up to five. These show on your card so the other person can just do it, instead of guessing.</Text>
              <ChipPicker options={COMMUNICATION} value={comm} onChange={setComm} max={5} allowCustom customPlaceholder="Something else, in your words" />
            </>
          )}
          {step === 4 && (
            <>
              <Text style={type.h1}>A good first meet looks like</Text>
              <Text style={[type.bodySoft, { marginTop: 8 }]}>Up to five. Hosts use these to pick places; matches use them to send you a plan that actually works.</Text>
              <ChipPicker options={SENSORY} value={sensory} onChange={setSensory} max={5} allowCustom customPlaceholder="Add your own" />
            </>
          )}
          {step === 5 && (
            <>
              <Text style={type.h1}>The card people see</Text>
              <Pressable onPress={pickPhoto} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16 }}>
                {photo ? <Image source={{ uri: photo }} style={{ width: 72, height: 72, borderRadius: 24 }} /> : <Avatar name={name || '?'} size={72} />}
                <View style={{ flex: 1 }}>
                  <Text style={[type.body, { fontWeight: '700' }]}>{photo ? 'Change photo' : 'Add a photo (optional)'}</Text>
                  <Text style={type.sub}>A photo of you, or of your special interest. Both are fine here.</Text>
                </View>
              </Pressable>
              <Field label="Name" value={name} onChange={setName} placeholder="What people should call you" autoCapitalize="words" maxLength={40} />
              <Field label="Handle" value={handle} onChange={setHandle} placeholder="for friends to find you, e.g. quietowl" autoCapitalize="none" maxLength={20} hint="Lowercase letters, numbers, underscores. Your safe person uses this to pair with you." />
              <Field label="Year you were born" value={year} onChange={setYear} placeholder="e.g. 1994" keyboardType="number-pad" maxLength={4} hint="Only your age is shown." />
              <Field label="City" value={city} onChange={setCity} placeholder="Where you could actually meet" autoCapitalize="words" maxLength={60} />
              <Field label="Pronouns (optional)" value={pronouns} onChange={setPronouns} placeholder="they/them" autoCapitalize="none" maxLength={30} />
              <Field label="A good first message to me is..." value={bestFirst} onChange={setBestFirst} placeholder="e.g. a question about my current obsession, not 'hey'" multiline maxLength={200} hint="Give people the script. It is kinder for everyone." />
              <ChipPicker label="Things I could talk about for an hour" options={INTEREST_SUGGESTIONS} value={interests} onChange={setInterests} max={8} allowCustom customPlaceholder="Your thing" />
            </>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton title={step === STEPS - 1 ? 'Make my card' : step === 0 ? 'Start' : 'Next'} onPress={next} loading={busy} disabled={!canNext} />
          {step > 0 ? <GhostButton title="Back" onPress={back} /> : <Text style={[type.caption, { textAlign: 'center', marginTop: 12 }]}>By continuing you agree to the Terms and confirm you are 18 or older.</Text>}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Line({ t }: { t: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.coral, marginTop: 8 }} />
      <Text style={[type.body, { flex: 1 }]}>{t}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: { paddingTop: 12, paddingBottom: 6 },
  body: { paddingHorizontal: 22, paddingBottom: 24 },
  footer: { paddingHorizontal: 22, paddingBottom: 8, paddingTop: 8, gap: 4 },
  promise: { marginTop: 26, backgroundColor: colors.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.line },
});
