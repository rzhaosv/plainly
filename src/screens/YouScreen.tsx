import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Switch, Alert, ScrollView } from 'react-native';
import { Screen, Eyebrow, Card, ProBadge } from '../components/UI';
import { Avatar, Facts } from '../components/Bits';
import { colors, radius, type } from '../theme';
import { useApp } from '../store/AppContext';
import { restore } from '../services/billing';
import { deleteAccount } from '../logic/api';
import { LOOKING_LABEL } from '../logic/types';
import { TabProps } from '../navigation';
import { SITE } from './PaywallScreen';

function Row({ label, value, onPress, danger, plus }: { label: string; value?: string; onPress: () => void; danger?: boolean; plus?: boolean }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
        <Text style={[type.body, { fontWeight: '600' }, danger && { color: colors.danger }]}>{label}</Text>
        {plus ? <ProBadge /> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {value ? <Text style={type.sub}>{value}</Text> : null}
        <Text style={{ color: colors.muted, fontSize: 18 }}>›</Text>
      </View>
    </Pressable>
  );
}

export default function YouScreen({ navigation }: TabProps<'You'>) {
  const { profile, isPlus, setPlus, updateProfile, retry } = useApp();
  if (!profile) return <Screen><Text style={type.body}>Loading…</Text></Screen>;

  const onRestore = async () => {
    try { if (await restore()) { setPlus(true); Alert.alert('Restored', 'Plus is on.'); } else Alert.alert('Nothing to restore', 'No active Plus subscription for this Apple ID.'); }
    catch (e: any) { Alert.alert('Restore failed', e?.message ?? 'Try again.'); }
  };
  const onDelete = () => Alert.alert('Delete your account?', 'Your card, matches, tables, pairs and messages are removed for good. There is no undo.', [
    { text: 'Keep', style: 'cancel' },
    { text: 'Delete everything', style: 'destructive', onPress: async () => { try { await deleteAccount(); retry(); } catch (e: any) { Alert.alert('Could not delete', e?.message ?? 'Try again.'); } } },
  ]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Eyebrow style={{ marginTop: 8 }}>You</Eyebrow>
        <Pressable onPress={() => navigation.navigate('EditProfile')} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 }}>
          <Avatar name={profile.display_name} path={profile.photo_path} size={72} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={type.h1}>{profile.display_name}</Text>
              {isPlus ? <ProBadge /> : null}
            </View>
            <Text style={type.sub}>@{profile.handle} · {profile.city}</Text>
            <Text style={[type.caption, { marginTop: 2, color: colors.accent, fontWeight: '700' }]}>Edit card ›</Text>
          </View>
        </Pressable>
        <View style={{ marginTop: 12 }}><Facts tone="coral" items={[LOOKING_LABEL[profile.looking_for], ...profile.identities.slice(0, 2)]} /></View>

        <Card style={{ marginTop: 18, backgroundColor: colors.accentSoft, borderColor: colors.accentSoft }}>
          <Text style={type.label}>Your handle</Text>
          <Text style={[type.h2, { marginTop: 4 }]}>@{profile.handle}</Text>
          <Text style={[type.bodySoft, { marginTop: 4 }]}>Give this to your safe person so they can pair with you for double dates.</Text>
        </Card>

        <Text style={[type.label, { marginTop: 22, marginBottom: 6 }]}>Visibility</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[type.body, { fontWeight: '600' }]}>Show my card in People</Text>
            <Text style={type.sub}>Off means a break. Tables and chats keep working.</Text>
          </View>
          <Switch value={profile.visible} onValueChange={(v) => updateProfile({ visible: v })} trackColor={{ true: colors.accent }} />
        </View>

        <Text style={[type.label, { marginTop: 22, marginBottom: 6 }]}>Plus</Text>
        <Card style={{ padding: 0 }}>
          {!isPlus ? <Row label="Get Plainly Plus" value="from $6.99" onPress={() => navigation.navigate('Paywall')} /> : null}
          <Row label="Restore purchases" onPress={onRestore} />
        </Card>

        <Text style={[type.label, { marginTop: 22, marginBottom: 6 }]}>Safety and support</Text>
        <Card style={{ padding: 0 }}>
          <Row label="Community rules" onPress={() => Linking.openURL(`${SITE}/#rules`)} />
          <Row label="Report a problem" onPress={() => Linking.openURL('mailto:tryformaapp@gmail.com?subject=Plainly%20report')} />
          <Row label="Privacy policy" onPress={() => Linking.openURL(`${SITE}/privacy.html`)} />
          <Row label="Terms of use" onPress={() => Linking.openURL(`${SITE}/terms.html`)} />
        </Card>

        <Text style={[type.label, { marginTop: 22, marginBottom: 6 }]}>Account</Text>
        <Card style={{ padding: 0 }}>
          <Row label="Delete my account and data" onPress={onDelete} danger />
        </Card>
        <Text style={[type.caption, { marginTop: 14, lineHeight: 18 }]}>Your account is tied to this phone; no email or password to remember. Deleting the app deletes your access, so use the button above if you want your card gone from Plainly too.</Text>
        <Text style={[type.caption, { marginTop: 8 }]}>Plainly is made by Forma, a tiny studio. It is a way to meet people, not therapy or a crisis service.</Text>
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, marginBottom: -1 },
});
