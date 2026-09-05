import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { colors, radius, type } from '../theme';
import { photoUrl } from '../services/supabase';
import { initials, Noise, NOISE_LABEL, Light, LIGHT_LABEL, Talk, TALK_LABEL, PlanCard } from '../logic/types';

export function Avatar({ name, path, size = 48, ring }: { name: string; path?: string | null; size?: number; ring?: boolean }) {
  const url = photoUrl(path);
  const st = { width: size, height: size, borderRadius: size * 0.34 };
  if (url) return <Image source={{ uri: url }} style={[st, ring && styles.ring]} />;
  return (
    <View style={[st, styles.fallback, ring && styles.ring]}>
      <Text style={{ color: colors.onAccent, fontWeight: '800', fontSize: size * 0.38 }}>{initials(name)}</Text>
    </View>
  );
}

/** A row of flat facts. The point of Plainly: the sensory facts are on the card, not discovered at the door. */
export function Facts({ items, tone = 'accent' }: { items: string[]; tone?: 'accent' | 'coral' | 'muted' }) {
  const bg = tone === 'coral' ? colors.coralSoft : tone === 'muted' ? colors.surface2 : colors.accentSoft;
  const fg = tone === 'coral' ? colors.coral : tone === 'muted' ? colors.soft : colors.accent;
  return (
    <View style={styles.facts}>
      {items.filter(Boolean).map((t) => (
        <View key={t} style={[styles.fact, { backgroundColor: bg }]}>
          <Text style={[styles.factText, { color: fg }]}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

export function SensoryLine({ noise, light, talk }: { noise: Noise; light: Light; talk: Talk }) {
  return <Facts tone="muted" items={[NOISE_LABEL[noise], LIGHT_LABEL[light], TALK_LABEL[talk]]} />;
}

export function Notice({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.notice}>
      <Text style={[type.h3, { fontFamily: undefined }]}>{title}</Text>
      <Text style={[type.bodySoft, { marginTop: 6 }]}>{body}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.accent, fontWeight: '700' }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PlanCardView({ plan, mine }: { plan: PlanCard; mine: boolean }) {
  return (
    <View style={[styles.plan, mine && { backgroundColor: colors.plum }]}>
      <Text style={[type.label, { color: mine ? colors.lilac : colors.accent }]}>Plan card</Text>
      <Text style={[type.h3, { marginTop: 6, color: mine ? colors.onPlum : colors.ink }]}>{plan.what}</Text>
      <Row k="Where" v={plan.where} mine={mine} />
      <Row k="When" v={plan.when} mine={mine} />
      <Row k="How long" v={plan.how_long} mine={mine} />
      <Row k="Noise" v={NOISE_LABEL[plan.noise]} mine={mine} />
      <Row k="Leaving early" v={plan.exit} mine={mine} />
      {plan.note ? <Row k="Note" v={plan.note} mine={mine} /> : null}
    </View>
  );
}
function Row({ k, v, mine }: { k: string; v: string; mine: boolean }) {
  return (
    <View style={{ flexDirection: 'row', marginTop: 6, gap: 8 }}>
      <Text style={[type.caption, { width: 86, color: mine ? colors.onPlumMuted : colors.muted }]}>{k}</Text>
      <Text style={[type.bodySoft, { flex: 1, color: mine ? colors.onPlum : colors.soft }]}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  ring: { borderWidth: 2, borderColor: colors.lilac },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  fact: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  factText: { fontSize: 12.5, fontWeight: '700' },
  notice: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.line, marginTop: 12 },
  plan: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.line, maxWidth: 320 },
});
