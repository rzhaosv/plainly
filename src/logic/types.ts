export type LookingFor = 'dates' | 'friends' | 'both';
export type Noise = 'quiet' | 'moderate' | 'loud';
export type Light = 'dim' | 'normal' | 'bright';
export type Talk = 'optional' | 'light' | 'lots';

export type Profile = {
  id: string;
  handle: string | null;
  display_name: string;
  birth_year: number | null;
  city: string;
  pronouns: string;
  about: string;
  looking_for: LookingFor;
  identities: string[];
  communication: string[];
  sensory: string[];
  interests: string[];
  best_first: string;
  photo_path: string | null;
  visible: boolean;
  onboarded: boolean;
  last_seen: string;
};

export type TableRow = {
  id: string;
  host_id: string;
  title: string;
  plan: string;
  city: string;
  venue: string;
  starts_at: string;
  ends_at: string | null;
  capacity: number;
  noise: Noise;
  light: Light;
  talk: Talk;
  exit_plan: string;
  cost: string;
  access: string;
  open_to: LookingFor;
  thread_id: string | null;
  status: 'open' | 'full' | 'cancelled' | 'done';
  going?: number;
  mine?: 'going' | 'maybe' | 'out' | null;
  host?: Pick<Profile, 'id' | 'display_name' | 'photo_path' | 'handle'> | null;
};

export type Pair = {
  id: string;
  a_id: string;
  b_id: string;
  name: string;
  note: string;
  city: string;
  vibe: LookingFor;
  status: 'pending' | 'active' | 'ended';
  a?: Pick<Profile, 'id' | 'display_name' | 'photo_path' | 'handle' | 'birth_year'> | null;
  b?: Pick<Profile, 'id' | 'display_name' | 'photo_path' | 'handle' | 'birth_year'> | null;
};

export type InboxRow = {
  thread_id: string;
  kind: 'match' | 'pair' | 'table';
  title: string;
  ref_id: string | null;
  last_message_at: string;
  last_body: string | null;
  last_kind: string | null;
  unread: number;
  members: { id: string; name: string; photo: string | null; handle: string | null }[];
};

export type PlanCard = {
  what: string;
  where: string;
  when: string;
  how_long: string;
  noise: Noise;
  exit: string;
  note?: string;
};

export type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  kind: 'text' | 'plan' | 'system';
  body: string;
  plan: PlanCard | null;
  created_at: string;
};

/** Chip vocab. Written the way the community says it, not the way a clinic says it. */
export const IDENTITIES = ['Autistic', 'ADHD', 'AuDHD', 'Dyslexic / dyspraxic', 'OCD', 'Tourette’s', 'Self-identified', 'Late-diagnosed', 'Still figuring it out'];
export const COMMUNICATION = [
  'Text before voice',
  'Voice notes are fine',
  'Please no surprise calls',
  'Say it plainly, I will too',
  'I need processing time',
  'Info-dumps welcome',
  'Slow replies are not a signal',
  'Ask, don’t hint',
  'I read tone badly over text',
  'Emojis help me',
];
export const SENSORY = [
  'Quiet places',
  'Dim light',
  'No strong smells',
  'Somewhere I can leave easily',
  'Side by side beats face to face',
  'A shared activity, not just talking',
  'Daytime over night',
  'Short first meet (under an hour)',
  'I stim, that is fine',
  'Loud is okay sometimes',
];
export const INTEREST_SUGGESTIONS = ['Board games', 'Trains', 'Birds', 'Baking', 'Video games', 'Lego', 'History', 'Linguistics', 'Fungi', 'Anime', 'Hiking', 'Cats', 'Space', 'Knitting', 'Music theory', 'Maps', 'D&D', 'Coding', 'Film', 'Plants'];

export const NOISE_LABEL: Record<Noise, string> = { quiet: 'Quiet', moderate: 'Some noise', loud: 'Loud' };
export const LIGHT_LABEL: Record<Light, string> = { dim: 'Dim light', normal: 'Normal light', bright: 'Bright' };
export const TALK_LABEL: Record<Talk, string> = { optional: 'Talking optional', light: 'Light talking', lots: 'Talk-heavy' };
export const LOOKING_LABEL: Record<LookingFor, string> = { dates: 'Dates', friends: 'Friends', both: 'Dates or friends' };

export const TABLE_IDEAS: { title: string; plan: string; noise: Noise; light: Light; talk: Talk }[] = [
  { title: 'Board games, quiet café', plan: 'Two or three co-op games. Nobody has to talk while a turn is happening.', noise: 'quiet', light: 'normal', talk: 'light' },
  { title: 'Parallel-play reading hour', plan: 'Bring a book. We read next to each other, then ten minutes of talking about them if you want.', noise: 'quiet', light: 'normal', talk: 'optional' },
  { title: 'Slow walk, then tea', plan: 'A loop of the park at whatever pace. Walking makes talking easier and staring optional.', noise: 'quiet', light: 'bright', talk: 'light' },
  { title: 'Jigsaw and snacks', plan: 'One 1000-piece puzzle, six people, no agenda. Leave when you want.', noise: 'quiet', light: 'normal', talk: 'optional' },
  { title: 'Museum, quiet morning', plan: 'First hour after opening, when it is empty. We split up and regroup at the café.', noise: 'quiet', light: 'dim', talk: 'optional' },
  { title: 'Special-interest show and tell', plan: 'Five minutes each on the thing you love. Info-dumping is the point.', noise: 'moderate', light: 'normal', talk: 'lots' },
];

export const age = (birthYear: number | null | undefined) => (birthYear ? new Date().getFullYear() - birthYear : null);
export const initials = (name: string) => name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || '?';
export function timeLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const day = sameDay ? 'Today' : d.toDateString() === tomorrow.toDateString() ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  return `${day}, ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}
export function ago(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
