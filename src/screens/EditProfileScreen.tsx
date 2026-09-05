import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, Pressable, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Screen, Header, PrimaryButton } from '../components/UI';
import { Field, ChipPicker, Choice } from '../components/Form';
import { Avatar } from '../components/Bits';
import { type } from '../theme';
import { useApp } from '../store/AppContext';
import { uploadPhoto } from '../logic/api';
import { IDENTITIES, COMMUNICATION, SENSORY, INTEREST_SUGGESTIONS, LookingFor } from '../logic/types';
import { ScreenProps } from '../navigation';

export default function EditProfileScreen({ navigation }: ScreenProps<'EditProfile'>) {
  const { uid, profile, updateProfile } = useApp();
  const p = profile!;
  const [name, setName] = useState(p.display_name);
  const [city, setCity] = useState(p.city);
  const [pronouns, setPronouns] = useState(p.pronouns);
  const [about, setAbout] = useState(p.about);
  const [bestFirst, setBestFirst] = useState(p.best_first);
  const [looking, setLooking] = useState<LookingFor>(p.looking_for);
  const [identities, setIdentities] = useState(p.identities);
  const [comm, setComm] = useState(p.communication);
  const [sensory, setSensory] = useState(p.sensory);
  const [interests, setInterests] = useState(p.interests);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!r.canceled && r.assets?.[0]) setPhoto(r.assets[0].uri);
  };
  const save = async () => {
    if (name.trim().length < 1) return Alert.alert('Name', 'Add the name people should call you.');
    if (city.trim().length < 2) return Alert.alert('City', 'Tables and people are grouped by city.');
    setBusy(true);
    try {
      let photo_path = p.photo_path;
      if (photo && uid) photo_path = await uploadPhoto(uid, photo);
      await updateProfile({ display_name: name.trim(), city: city.trim(), pronouns: pronouns.trim(), about: about.trim(), best_first: bestFirst.trim(), looking_for: looking, identities, communication: comm, sensory, interests, photo_path });
      navigation.goBack();
    } catch (e: any) { Alert.alert('Could not save', e?.message ?? 'Try again.'); } finally { setBusy(false); }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Your card" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}>
          <Pressable onPress={pickPhoto} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {photo ? <Image source={{ uri: photo }} style={{ width: 72, height: 72, borderRadius: 24 }} /> : <Avatar name={name || '?'} path={p.photo_path} size={72} />}
            <Text style={[type.body, { fontWeight: '700' }]}>Change photo</Text>
          </Pressable>
          <Field label="Name" value={name} onChange={setName} autoCapitalize="words" maxLength={40} />
          <Field label="City" value={city} onChange={setCity} autoCapitalize="words" maxLength={60} />
          <Field label="Pronouns" value={pronouns} onChange={setPronouns} autoCapitalize="none" maxLength={30} />
          <Field label="A good first message to me is..." value={bestFirst} onChange={setBestFirst} multiline maxLength={200} />
          <Field label="About (optional)" value={about} onChange={setAbout} placeholder="Anything else. Info-dump if you like." multiline maxLength={600} />
          <Choice<LookingFor> label="Here for" value={looking} onChange={setLooking} options={[{ value: 'dates', label: 'Dates' }, { value: 'friends', label: 'Friends' }, { value: 'both', label: 'Either, honestly' }]} />
          <ChipPicker label="How I am wired" options={IDENTITIES} value={identities} onChange={setIdentities} />
          <ChipPicker label="How I like to talk" options={COMMUNICATION} value={comm} onChange={setComm} max={5} allowCustom />
          <ChipPicker label="A good first meet looks like" options={SENSORY} value={sensory} onChange={setSensory} max={5} allowCustom />
          <ChipPicker label="Could talk for an hour about" options={INTEREST_SUGGESTIONS} value={interests} onChange={setInterests} max={8} allowCustom customPlaceholder="Your thing" />
          <PrimaryButton title="Save card" onPress={save} loading={busy} style={{ marginTop: 22 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
