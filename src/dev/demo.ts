/**
 * Web-only demo data for App Store screenshots: `?demo=<tables|table|people|pairs|chats|thread|paywall|onboard>`.
 * On native `demo` is always null and nothing here is used. api.ts returns these canned rows instead of hitting Supabase.
 */
import { Platform } from 'react-native';
import { Profile, TableRow, Pair, InboxRow, Message } from '../logic/types';

export type DemoName = 'tables' | 'table' | 'people' | 'pairs' | 'chats' | 'thread' | 'paywall' | 'onboard' | 'you';
const VALID: DemoName[] = ['tables', 'table', 'people', 'pairs', 'chats', 'thread', 'paywall', 'onboard', 'you'];

function read(): { name: DemoName } | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const n = new URLSearchParams(window.location.search).get('demo') as DemoName | null;
  return n && VALID.includes(n) ? { name: n } : null;
}
export const demo = read();

const ME = 'me';
const at = (h: number, dayOffset = 0) => { const d = new Date(); d.setDate(d.getDate() + dayOffset); d.setHours(h, 0, 0, 0); return d.toISOString(); };
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

const person = (id: string, p: Partial<Profile>): Profile => ({
  id, handle: id, display_name: 'Someone', birth_year: 1994, city: 'Portland', pronouns: '', about: '', looking_for: 'both', identities: [], communication: [], sensory: [], interests: [], best_first: '', photo_path: null, visible: true, onboarded: true, last_seen: ago(5), ...p,
});

export const DEMO_ME: Profile = person(ME, { handle: 'quietowl', display_name: 'Sam', birth_year: 1993, pronouns: 'they/them', looking_for: 'both', identities: ['AuDHD', 'Late-diagnosed'], communication: ['Text before voice', 'Say it plainly, I will too', 'Slow replies are not a signal'], sensory: ['Quiet places', 'Side by side beats face to face', 'Short first meet (under an hour)'], interests: ['Board games', 'Birds', 'Linguistics', 'Maps'], best_first: 'a question about whatever I am currently obsessed with. This week it is corvids.' });

export const DEMO_PEOPLE: Profile[] = [
  person('p1', { handle: 'mossandmaps', display_name: 'Priya', birth_year: 1995, pronouns: 'she/her', looking_for: 'dates', identities: ['Autistic', 'Self-identified'], communication: ['Ask, don’t hint', 'I need processing time', 'Info-dumps welcome'], sensory: ['Dim light', 'A shared activity, not just talking', 'Somewhere I can leave easily'], interests: ['Fungi', 'Hiking', 'Knitting', 'Film'], best_first: 'tell me the last thing you learned that nobody asked to hear about.' }),
  person('p2', { handle: 'theo_trains', display_name: 'Theo', birth_year: 1990, pronouns: 'he/him', looking_for: 'friends', identities: ['ADHD'], communication: ['Voice notes are fine', 'Emojis help me', 'Please no surprise calls'], sensory: ['Daytime over night', 'Loud is okay sometimes', 'A shared activity, not just talking'], interests: ['Trains', 'Baking', 'D&D', 'History'], best_first: 'a board game you think I have not played. I probably have.' }),
  person('p3', { handle: 'lex_reads', display_name: 'Lex', birth_year: 1997, pronouns: 'they/she', looking_for: 'both', identities: ['AuDHD', 'OCD'], communication: ['Text before voice', 'I read tone badly over text', 'Say it plainly, I will too'], sensory: ['Quiet places', 'No strong smells', 'Short first meet (under an hour)'], interests: ['Anime', 'Plants', 'Music theory'], best_first: 'your current comfort rewatch, no judgment either way.' }),
];

export const DEMO_TABLES: TableRow[] = [
  { id: 't1', host_id: 'p2', title: 'Board games, quiet café', plan: 'Two or three co-op games at Cardboard Corner. Nobody has to talk while a turn is happening. I bring the games; you bring nothing.', city: 'Portland', venue: 'Cardboard Corner, back room', starts_at: at(14, 1), ends_at: null, capacity: 6, noise: 'quiet', light: 'normal', talk: 'light', exit_plan: 'Leave whenever. Say bye or just wave; nobody will ask why.', cost: 'Buy your own drink', access: 'Step-free, quiet corner, parking behind', open_to: 'both', thread_id: 'th3', status: 'open', going: 4, mine: 'going', host: { id: 'p2', display_name: 'Theo', photo_path: null, handle: 'theo_trains' } },
  { id: 't2', host_id: 'p1', title: 'Museum, first quiet hour', plan: 'Meet at the doors at opening. We split up, wander at our own pace, regroup at the café at 11 for whoever wants to.', city: 'Portland', venue: 'Portland Art Museum', starts_at: at(10, 2), ends_at: null, capacity: 8, noise: 'quiet', light: 'dim', talk: 'optional', exit_plan: 'Just go. Text the chat “off” if you like, or don’t.', cost: 'Museum ticket', access: 'Elevators, benches everywhere', open_to: 'friends', thread_id: 'th4', status: 'open', going: 3, mine: null, host: { id: 'p1', display_name: 'Priya', photo_path: null, handle: 'mossandmaps' } },
  { id: 't3', host_id: 'p3', title: 'Parallel-play reading hour', plan: 'Bring a book. We read next to each other at the long table, then ten minutes of talking about them if you want.', city: 'Portland', venue: 'Central Library, 3rd floor', starts_at: at(18, 3), ends_at: null, capacity: 6, noise: 'quiet', light: 'normal', talk: 'optional', exit_plan: 'Leave any time; the whole point is no pressure.', cost: 'Free', access: '', open_to: 'both', thread_id: 'th5', status: 'open', going: 5, mine: 'maybe', host: { id: 'p3', display_name: 'Lex', photo_path: null, handle: 'lex_reads' } },
];

const mini = (p: Profile) => ({ id: p.id, display_name: p.display_name, photo_path: p.photo_path, handle: p.handle, birth_year: p.birth_year });
export const DEMO_MY_PAIR: Pair = { id: 'pr0', a_id: ME, b_id: 'f1', name: 'The Puzzle People', note: 'One of us talks, one of us listens. We like museums before they get busy.', city: 'Portland', vibe: 'dates', status: 'active', a: mini(DEMO_ME), b: { id: 'f1', display_name: 'Noor', photo_path: null, handle: 'noor_k', birth_year: 1994 } };
export const DEMO_PAIRS: Pair[] = [
  { id: 'pr1', a_id: 'p1', b_id: 'p3', name: 'Fungi & Film Club', note: 'We will absolutely info-dump about mushrooms and then ask about yours. Quiet cafés, short first meets, no bars.', city: 'Portland', vibe: 'dates', status: 'active', a: mini(DEMO_PEOPLE[0]), b: mini(DEMO_PEOPLE[2]) },
  { id: 'pr2', a_id: 'p2', b_id: 'f2', name: 'Theo & Marcus', note: 'Board games, trains, one of us bakes. Double dates or friend pairs, honestly either.', city: 'Portland', vibe: 'both', status: 'active', a: mini(DEMO_PEOPLE[1]), b: { id: 'f2', display_name: 'Marcus', photo_path: null, handle: 'marcusm', birth_year: 1991 } },
];

export const DEMO_INBOX: InboxRow[] = [
  { thread_id: 'th1', kind: 'match', title: '', ref_id: null, last_message_at: ago(12), last_body: 'Plan: Board games at Cardboard Corner, Saturday 2pm', last_kind: 'plan', unread: 1, members: [{ id: 'p1', name: 'Priya', photo: null, handle: 'mossandmaps' }] },
  { thread_id: 'th2', kind: 'pair', title: 'Double date', ref_id: 'pm1', last_message_at: ago(95), last_body: 'Sunday works for both of us. Museum first hour?', last_kind: 'text', unread: 2, members: [{ id: 'p1', name: 'Priya', photo: null, handle: 'mossandmaps' }, { id: 'p3', name: 'Lex', photo: null, handle: 'lex_reads' }, { id: 'f1', name: 'Noor', photo: null, handle: 'noor_k' }] },
  { thread_id: 'th3', kind: 'table', title: 'Board games, quiet café', ref_id: 't1', last_message_at: ago(400), last_body: 'Back room is booked. It has a door, so it stays quiet.', last_kind: 'text', unread: 0, members: [{ id: 'p2', name: 'Theo', photo: null, handle: 'theo_trains' }, { id: 'p3', name: 'Lex', photo: null, handle: 'lex_reads' }, { id: 'f2', name: 'Marcus', photo: null, handle: 'marcusm' }] },
];

export const DEMO_MESSAGES: Message[] = [
  { id: 'm0', thread_id: 'th1', sender_id: ME, kind: 'system', body: 'You both said yes. No need to be clever: say hi, or send a plan card.', plan: null, created_at: ago(300) },
  { id: 'm1', thread_id: 'th1', sender_id: 'p1', kind: 'text', body: 'Hi. Your card said questions about your current obsession, so: corvids. Go.', plan: null, created_at: ago(240) },
  { id: 'm2', thread_id: 'th1', sender_id: ME, kind: 'text', body: 'Crows hold grudges for years and teach them to their kids. I have thoughts. Also I do not do small talk well, would a plan card be easier?', plan: null, created_at: ago(200) },
  { id: 'm3', thread_id: 'th1', sender_id: 'p1', kind: 'text', body: 'Yes please. Slow replies from me are normal, you are not being ignored.', plan: null, created_at: ago(150) },
  { id: 'm4', thread_id: 'th1', sender_id: ME, kind: 'plan', body: 'Plan: Board games at Cardboard Corner, Saturday 2pm', plan: { what: 'Board games, co-op only', where: 'Cardboard Corner, back room', when: 'Saturday 2pm', how_long: '45 minutes, longer if we both want', noise: 'quiet', exit: 'Either of us can leave any time. No reason needed.', note: 'I will be the one in the green jacket.' }, created_at: ago(60) },
  { id: 'm5', thread_id: 'th1', sender_id: 'p1', kind: 'text', body: 'Yes. That is the easiest yes I have said all year.', plan: null, created_at: ago(12) },
];
