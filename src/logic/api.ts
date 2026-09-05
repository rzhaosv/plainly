import { supabase, BUCKET } from '../services/supabase';
import { InboxRow, Message, Pair, PlanCard, Profile, TableRow } from './types';
import { demo, DEMO_ME, DEMO_PEOPLE, DEMO_TABLES, DEMO_MY_PAIR, DEMO_PAIRS, DEMO_INBOX, DEMO_MESSAGES } from '../dev/demo';

function db() {
  if (!supabase) throw new Error('offline');
  return supabase;
}
const PROFILE_COLS = 'id,handle,display_name,birth_year,city,pronouns,about,looking_for,identities,communication,sensory,interests,best_first,photo_path,visible,onboarded,last_seen';
const MINI = 'id,display_name,photo_path,handle,birth_year';

/** Anonymous session on first launch; nothing to type before you see the app. */
export async function ensureSession(): Promise<string> {
  if (demo) return 'me';
  const s = db();
  const { data } = await s.auth.getSession();
  if (data.session?.user) return data.session.user.id;
  const { data: signed, error } = await s.auth.signInAnonymously();
  if (error || !signed.user) throw error ?? new Error('no session');
  return signed.user.id;
}

export async function getMyProfile(uid: string): Promise<Profile | null> {
  if (demo) return demo.name === 'onboard' ? null : DEMO_ME;
  const { data } = await db().from('pl_profiles').select(PROFILE_COLS).eq('id', uid).maybeSingle();
  return (data as Profile | null) ?? null;
}

export async function saveProfile(uid: string, patch: Partial<Profile>): Promise<Profile> {
  if (demo) return { ...DEMO_ME, ...patch };
  const { data, error } = await db().from('pl_profiles').upsert({ id: uid, ...patch, last_seen: new Date().toISOString() }).select(PROFILE_COLS).single();
  if (error) throw error;
  return data as Profile;
}

export async function handleFree(handle: string, uid: string): Promise<boolean> {
  const { data } = await db().from('pl_profiles').select('id').eq('handle', handle).neq('id', uid).maybeSingle();
  return !data;
}

export async function uploadPhoto(uid: string, uri: string): Promise<string> {
  const res = await fetch(uri);
  const blob = await res.arrayBuffer();
  const path = `${uid}/${Date.now()}.jpg`;
  const { error } = await db().storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return path;
}

// ---------- People (1:1) ----------
export async function listPeople(uid: string, city: string, opts: { anywhere?: boolean; looking?: string | null; identity?: string | null } = {}): Promise<Profile[]> {
  if (demo) return DEMO_PEOPLE;
  const s = db();
  const [{ data: liked }, { data: passed }, { data: matched }] = await Promise.all([
    s.from('pl_likes').select('to_id').eq('from_id', uid),
    s.from('pl_passes').select('to_id').eq('from_id', uid),
    s.from('pl_matches').select('a_id,b_id').or(`a_id.eq.${uid},b_id.eq.${uid}`),
  ]);
  const skip = new Set<string>([uid]);
  (liked ?? []).forEach((r: any) => skip.add(r.to_id));
  (passed ?? []).forEach((r: any) => skip.add(r.to_id));
  (matched ?? []).forEach((r: any) => { skip.add(r.a_id); skip.add(r.b_id); });
  let q = s.from('pl_profiles').select(PROFILE_COLS).eq('visible', true).eq('onboarded', true).order('last_seen', { ascending: false }).limit(60);
  if (!opts.anywhere && city) q = q.ilike('city', city.trim());
  if (opts.looking && opts.looking !== 'both') q = q.in('looking_for', [opts.looking, 'both']);
  if (opts.identity) q = q.contains('identities', [opts.identity]);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as Profile[]).filter((p) => !skip.has(p.id));
}

export async function whoLikedMe(uid: string): Promise<Profile[]> {
  if (demo) return [DEMO_PEOPLE[2], DEMO_PEOPLE[1]];
  const s = db();
  const { data: likes } = await s.from('pl_likes').select('from_id').eq('to_id', uid);
  const { data: mine } = await s.from('pl_likes').select('to_id').eq('from_id', uid);
  const already = new Set((mine ?? []).map((r: any) => r.to_id));
  const ids = (likes ?? []).map((r: any) => r.from_id).filter((id: string) => !already.has(id));
  if (!ids.length) return [];
  const { data } = await s.from('pl_profiles').select(PROFILE_COLS).in('id', ids);
  return (data ?? []) as Profile[];
}

export async function like(target: string): Promise<{ matched: boolean; thread_id?: string }> {
  const { data, error } = await db().rpc('pl_like', { target });
  if (error) throw error;
  return data as any;
}
export async function pass(target: string): Promise<void> {
  const { error } = await db().rpc('pl_pass', { target });
  if (error) throw error;
}
export async function block(target: string, reason?: string, details?: string): Promise<void> {
  const { error } = await db().rpc('pl_block', { target, reason: reason ?? null, details: details ?? '' });
  if (error) throw error;
}
export async function unmatch(matchId: string): Promise<void> {
  const { error } = await db().rpc('pl_unmatch', { match_id: matchId });
  if (error) throw error;
}
export async function getProfile(id: string): Promise<Profile | null> {
  if (demo) return DEMO_PEOPLE.find((p) => p.id === id) ?? DEMO_ME;
  const { data } = await db().from('pl_profiles').select(PROFILE_COLS).eq('id', id).maybeSingle();
  return (data as Profile | null) ?? null;
}
export async function matchFor(uid: string, other: string): Promise<{ id: string; thread_id: string | null } | null> {
  if (demo) return null;
  const [a, b] = uid < other ? [uid, other] : [other, uid];
  const { data } = await db().from('pl_matches').select('id,thread_id').eq('a_id', a).eq('b_id', b).maybeSingle();
  return (data as any) ?? null;
}

// ---------- Tables (group invites) ----------
export async function listTables(uid: string, city: string, anywhere = false): Promise<TableRow[]> {
  if (demo) return DEMO_TABLES;
  const s = db();
  let q = s.from('pl_tables').select('*, host:pl_profiles!pl_tables_host_id_fkey(id,display_name,photo_path,handle), rsvps:pl_table_rsvps(user_id,status)')
    .in('status', ['open', 'full']).gte('starts_at', new Date(Date.now() - 3 * 3600_000).toISOString()).order('starts_at').limit(60);
  if (!anywhere && city) q = q.ilike('city', city.trim());
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r: any) => shapeTable(r, uid));
}
export async function myTables(uid: string): Promise<TableRow[]> {
  if (demo) return [];
  const { data, error } = await db().from('pl_tables').select('*, host:pl_profiles!pl_tables_host_id_fkey(id,display_name,photo_path,handle), rsvps:pl_table_rsvps(user_id,status)')
    .in('status', ['open', 'full']).order('starts_at').limit(60);
  if (error) throw error;
  return (data ?? []).map((r: any) => shapeTable(r, uid)).filter((t) => t.mine === 'going' || t.mine === 'maybe' || t.host_id === uid);
}
function shapeTable(r: any, uid: string): TableRow {
  const rsvps: { user_id: string; status: string }[] = r.rsvps ?? [];
  const t: TableRow = { ...r, going: rsvps.filter((x) => x.status === 'going').length, mine: (rsvps.find((x) => x.user_id === uid)?.status as any) ?? null };
  delete (t as any).rsvps;
  return t;
}
export async function getTable(id: string, uid: string): Promise<TableRow | null> {
  if (demo) return DEMO_TABLES.find((t) => t.id === id) ?? DEMO_TABLES[0];
  const { data } = await db().from('pl_tables').select('*, host:pl_profiles!pl_tables_host_id_fkey(id,display_name,photo_path,handle), rsvps:pl_table_rsvps(user_id,status)').eq('id', id).maybeSingle();
  return data ? shapeTable(data, uid) : null;
}
export async function tableGuests(id: string): Promise<(Pick<Profile, 'id' | 'display_name' | 'photo_path' | 'handle' | 'birth_year'> & { status: string })[]> {
  if (demo) return [{ ...DEMO_PEOPLE[1], status: 'going' }, { ...DEMO_ME, status: 'going' }, { ...DEMO_PEOPLE[2], status: 'going' }, { ...DEMO_PEOPLE[0], status: 'maybe' }];
  const { data } = await db().from('pl_table_rsvps').select(`status, p:pl_profiles(${MINI})`).eq('table_id', id).neq('status', 'out');
  return (data ?? []).map((r: any) => ({ ...r.p, status: r.status }));
}
export async function createTable(p: Record<string, unknown>): Promise<string> {
  const { data, error } = await db().rpc('pl_create_table', { p });
  if (error) throw error;
  return data as string;
}
export async function rsvp(tbl: string, status: 'going' | 'maybe' | 'out'): Promise<void> {
  const { error } = await db().rpc('pl_rsvp', { tbl, new_status: status });
  if (error) throw error;
}
export async function cancelTable(tbl: string): Promise<void> {
  const { error } = await db().rpc('pl_cancel_table', { tbl });
  if (error) throw error;
}

// ---------- Pairs (double dates) ----------
export async function myPairs(uid: string): Promise<Pair[]> {
  if (demo) return [DEMO_MY_PAIR];
  const { data, error } = await db().from('pl_pairs').select(`*, a:pl_profiles!pl_pairs_a_id_fkey(${MINI}), b:pl_profiles!pl_pairs_b_id_fkey(${MINI})`)
    .or(`a_id.eq.${uid},b_id.eq.${uid}`).neq('status', 'ended').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Pair[];
}
export async function listPairs(mine: Pair, anywhere = false): Promise<Pair[]> {
  if (demo) return DEMO_PAIRS;
  const s = db();
  const { data: liked } = await s.from('pl_pair_likes').select('to_pair').eq('from_pair', mine.id);
  const { data: matched } = await s.from('pl_pair_matches').select('a_pair,b_pair').or(`a_pair.eq.${mine.id},b_pair.eq.${mine.id}`);
  const skip = new Set<string>([mine.id]);
  (liked ?? []).forEach((r: any) => skip.add(r.to_pair));
  (matched ?? []).forEach((r: any) => { skip.add(r.a_pair); skip.add(r.b_pair); });
  let q = s.from('pl_pairs').select(`*, a:pl_profiles!pl_pairs_a_id_fkey(${MINI}), b:pl_profiles!pl_pairs_b_id_fkey(${MINI})`).eq('status', 'active').limit(40);
  if (!anywhere && mine.city) q = q.ilike('city', mine.city.trim());
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as Pair[]).filter((p) => !skip.has(p.id) && p.a_id !== mine.a_id && p.b_id !== mine.a_id && p.a_id !== mine.b_id && p.b_id !== mine.b_id);
}
export async function createPair(friendHandle: string, name: string, note: string, city: string, vibe: string): Promise<string> {
  const { data, error } = await db().rpc('pl_create_pair', { friend_handle: friendHandle.replace(/^@/, '').toLowerCase(), pair_name: name, pair_note: note, pair_city: city, pair_vibe: vibe });
  if (error) throw error;
  return data as string;
}
export async function acceptPair(pid: string): Promise<void> {
  const { error } = await db().rpc('pl_accept_pair', { pid });
  if (error) throw error;
}
export async function endPair(pid: string): Promise<void> {
  const { error } = await db().from('pl_pairs').update({ status: 'ended' }).eq('id', pid);
  if (error) throw error;
}
export async function pairLike(mine: string, target: string): Promise<{ matched: boolean; thread_id?: string }> {
  const { data, error } = await db().rpc('pl_pair_like', { mine, target });
  if (error) throw error;
  return data as any;
}

// ---------- Chat ----------
export async function inbox(): Promise<InboxRow[]> {
  if (demo) return DEMO_INBOX;
  const { data, error } = await db().rpc('pl_inbox');
  if (error) throw error;
  return (data ?? []) as InboxRow[];
}
export async function messages(threadId: string): Promise<Message[]> {
  if (demo) return DEMO_MESSAGES;
  const { data, error } = await db().from('pl_messages').select('*').eq('thread_id', threadId).order('created_at').limit(300);
  if (error) throw error;
  return (data ?? []) as Message[];
}
export async function sendText(threadId: string, uid: string, body: string): Promise<void> {
  const { error } = await db().from('pl_messages').insert({ thread_id: threadId, sender_id: uid, kind: 'text', body });
  if (error) throw error;
}
export async function sendPlan(threadId: string, uid: string, plan: PlanCard): Promise<void> {
  const { error } = await db().from('pl_messages').insert({ thread_id: threadId, sender_id: uid, kind: 'plan', body: `Plan: ${plan.what} at ${plan.where}, ${plan.when}`, plan });
  if (error) throw error;
}
export async function markRead(t: string): Promise<void> {
  if (demo) return ;
  await db().rpc('pl_mark_read', { t });
}
export function subscribeThread(threadId: string, onMessage: (m: Message) => void): () => void {
  if (!supabase || demo) return () => {};
  const ch = supabase.channel(`pl-thread-${threadId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pl_messages', filter: `thread_id=eq.${threadId}` }, (payload) => onMessage(payload.new as Message))
    .subscribe();
  return () => { supabase?.removeChannel(ch); };
}
export async function threadMembers(threadId: string): Promise<Pick<Profile, 'id' | 'display_name' | 'photo_path' | 'handle' | 'birth_year'>[]> {
  if (demo) return [DEMO_PEOPLE[0], DEMO_ME];
  const { data } = await db().from('pl_thread_members').select(`p:pl_profiles(${MINI})`).eq('thread_id', threadId);
  return (data ?? []).map((r: any) => r.p);
}

export async function deleteAccount(): Promise<void> {
  const { error } = await db().rpc('pl_delete_me');
  if (error) throw error;
  await db().auth.signOut();
}
