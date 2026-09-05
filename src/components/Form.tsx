import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { colors, radius, type } from '../theme';
import { Chip } from './UI';

export function Field({ label, value, onChange, placeholder, multiline, hint, autoCapitalize, keyboardType, maxLength }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; hint?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words'; keyboardType?: 'default' | 'number-pad'; maxLength?: number;
}) {
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={type.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        maxLength={maxLength}
        style={[styles.input, multiline && { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 }]}
      />
      {hint ? <Text style={[type.caption, { marginTop: 6 }]}>{hint}</Text> : null}
    </View>
  );
}

export function ChipPicker({ label, options, value, onChange, max, hint, allowCustom, customPlaceholder }: {
  label?: string; options: string[]; value: string[]; onChange: (v: string[]) => void; max?: number; hint?: string; allowCustom?: boolean; customPlaceholder?: string;
}) {
  const [custom, setCustom] = React.useState('');
  const toggle = (o: string) => {
    if (value.includes(o)) return onChange(value.filter((x) => x !== o));
    if (max && value.length >= max) return;
    onChange([...value, o]);
  };
  const add = () => {
    const t = custom.trim();
    if (!t || value.includes(t) || (max && value.length >= max)) return;
    onChange([...value, t]); setCustom('');
  };
  const extras = value.filter((v) => !options.includes(v));
  return (
    <View style={{ marginTop: 16 }}>
      {label ? <Text style={type.label}>{label}</Text> : null}
      {hint ? <Text style={[type.caption, { marginTop: 4 }]}>{hint}</Text> : null}
      <View style={styles.chips}>
        {[...options, ...extras].map((o) => <Chip key={o} text={o} small selected={value.includes(o)} onPress={() => toggle(o)} />)}
      </View>
      {allowCustom ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <TextInput value={custom} onChangeText={setCustom} placeholder={customPlaceholder ?? 'Add your own'} placeholderTextColor={colors.muted} style={[styles.input, { flex: 1, height: 44 }]} onSubmitEditing={add} returnKeyType="done" />
          <Pressable onPress={add} style={styles.add}><Text style={{ color: colors.onAccent, fontWeight: '800' }}>Add</Text></Pressable>
        </View>
      ) : null}
    </View>
  );
}

export function Choice<T extends string>({ label, options, value, onChange }: { label?: string; options: { value: T; label: string; sub?: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={{ marginTop: 16 }}>
      {label ? <Text style={[type.label, { marginBottom: 8 }]}>{label}</Text> : null}
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.choice, on && styles.choiceOn]}>
            <View style={[styles.dot, on && { borderColor: colors.accent, backgroundColor: colors.accent }]} />
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { fontWeight: '700' }]}>{o.label}</Text>
              {o.sub ? <Text style={type.sub}>{o.sub}</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: radius.md, paddingHorizontal: 14, height: 50, fontSize: 16, color: colors.ink, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  add: { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: 16, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14, marginBottom: 8 },
  choiceOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.lineStrong },
});
