import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';
import { colors, radius, type } from '../theme';
import { PrimaryButton } from '../components/UI';
import { getPackages, purchase, restore, isCancelledError } from '../services/billing';
import { useApp } from '../store/AppContext';
import { ScreenProps } from '../navigation';

export const SITE = 'https://tryforma.app/plainly';

const BENEFITS: [string, string][] = [
  ['See who said yes to you first', 'Skip the guessing. The list of people waiting on you, in the open.'],
  ['Filter People by wiring and intent', 'Only AuDHD folks looking for dates, for example. Fewer cards, better cards.'],
  ['Host up to three tables at once', 'Free hosts run one open table at a time. Plus runs the week.'],
  ['Keep saying yes free for everyone', 'Plus is how the lights stay on without paywalling likes. Thank you.'],
];

type Plan = { id: string; title: string; price: string; per: string; pkg: PurchasesPackage | null; best?: boolean };

export default function PaywallScreen({ navigation, route }: ScreenProps<'Paywall'>) {
  const { setPlus, setPrefs } = useApp();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPrefs({ seenPaywall: true });
    getPackages().then((p) => {
      const annual = p.find((x) => x.packageType === 'ANNUAL' || x.identifier === '$rc_annual');
      const monthly = p.find((x) => x.packageType === 'MONTHLY' || x.identifier === '$rc_monthly');
      const list: Plan[] = [];
      if (annual) list.push({ id: annual.identifier, title: 'Yearly', price: annual.product.priceString, per: 'per year', pkg: annual, best: true });
      if (monthly) list.push({ id: monthly.identifier, title: 'Monthly', price: monthly.product.priceString, per: 'per month', pkg: monthly });
      setPlans(list); setSelected(list[0]?.id ?? null); setLoaded(true);
    });
  }, [setPrefs]);

  const close = () => (navigation.canGoBack() ? navigation.goBack() : navigation.replace('Tabs'));
  const current = plans.find((p) => p.id === selected) ?? null;

  const onSubscribe = async () => {
    if (!current?.pkg) return Alert.alert('Not available yet', 'Plans could not be loaded right now. Check your connection and try again.');
    setBusy(true);
    try {
      if (await purchase(current.pkg)) { setPlus(true); close(); }
    } catch (e: any) {
      if (!isCancelledError(e)) Alert.alert('Purchase failed', e?.message ?? 'Please try again.');
    } finally { setBusy(false); }
  };
  const onRestore = async () => {
    setBusy(true);
    try {
      if (await restore()) { setPlus(true); Alert.alert('Restored', 'Plus is back on.'); close(); }
      else Alert.alert('Nothing to restore', 'No active Plus subscription was found for this Apple ID.');
    } catch (e: any) { Alert.alert('Restore failed', e?.message ?? 'Please try again.'); } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Pressable onPress={close} hitSlop={12} style={{ alignSelf: 'flex-end', paddingVertical: 8 }}>
          <Text style={{ color: colors.onPlumMuted, fontSize: 16, fontWeight: '600' }}>Not now</Text>
        </Pressable>
        <Text style={[type.label, { color: colors.lilac }]}>Plainly Plus</Text>
        <Text style={[type.display, { color: colors.onPlum, marginTop: 8 }]}>Saying yes stays free.{'\n'}Plus pays for the room.</Text>
        {route.params?.reason ? <Text style={[type.bodySoft, { color: colors.onPlumMuted, marginTop: 10 }]}>{route.params.reason}</Text> : null}
        <View style={{ marginTop: 22, gap: 14 }}>
          {BENEFITS.map(([t, s]) => (
            <View key={t} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={styles.tick}><Text style={{ color: colors.plum, fontWeight: '900', fontSize: 13 }}>✓</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[type.h3, { color: colors.onPlum }]}>{t}</Text>
                <Text style={[type.bodySoft, { color: colors.onPlumMuted }]}>{s}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 26, gap: 10 }}>
          {plans.map((p) => {
            const on = p.id === selected;
            return (
              <Pressable key={p.id} onPress={() => setSelected(p.id)} style={[styles.plan, on && styles.planOn]}>
                <View style={{ flex: 1 }}>
                  <Text style={[type.h3, { color: on ? colors.plum : colors.onPlum }]}>{p.title}{p.best ? '  · best value' : ''}</Text>
                  <Text style={[type.caption, { color: on ? colors.soft : colors.onPlumMuted }]}>{p.best ? 'Cancel any time' : 'Cancel any time'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[type.num, { fontSize: 24, color: on ? colors.plum : colors.onPlum }]}>{p.price}</Text>
                  <Text style={[type.caption, { color: on ? colors.soft : colors.onPlumMuted }]}>{p.per}</Text>
                </View>
              </Pressable>
            );
          })}
          {loaded && plans.length === 0 ? <Text style={[type.bodySoft, { color: colors.onPlumMuted }]}>Plans are not available on this device right now.</Text> : null}
        </View>
        <PrimaryButton title={current ? `Continue, ${current.price} ${current.per}` : 'Continue'} onPress={onSubscribe} loading={busy} color={colors.coral} style={{ marginTop: 18 }} />
        <Text style={[type.caption, { color: colors.onPlumMuted, textAlign: 'center', marginTop: 12, lineHeight: 18 }]}>
          Billed by Apple at the price shown. Renews automatically until cancelled in your Apple ID settings, at least 24 hours before the period ends.
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 14 }}>
          <Pressable onPress={onRestore}><Text style={styles.link}>Restore purchases</Text></Pressable>
          <Pressable onPress={() => Linking.openURL(`${SITE}/terms.html`)}><Text style={styles.link}>Terms</Text></Pressable>
          <Pressable onPress={() => Linking.openURL(`${SITE}/privacy.html`)}><Text style={styles.link}>Privacy</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.plum },
  tick: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.lilac, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.lg, padding: 16, borderWidth: 1.5, borderColor: 'rgba(247,243,238,0.22)' },
  planOn: { backgroundColor: colors.bg, borderColor: colors.bg },
  link: { color: colors.onPlumMuted, fontWeight: '600', fontSize: 13 },
});
