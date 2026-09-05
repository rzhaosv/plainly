# Plainly

Dating and friendship for neurodivergent adults (autistic, ADHD, AuDHD and the rest of us). Small hosted tables in quiet places, one-on-one when you are ready, double dates with your safe person. Every plan says how loud it is and how to leave.

Expo SDK 57 / React Native 0.86. Backend: Supabase (tables prefixed `pl_`, RLS on everything, writes through `pl_*` RPCs). Billing: RevenueCat, entitlement `plus`.

- `npm start` to run; `npx tsc --noEmit` to typecheck.
- iOS builds run in `rzhaosv/forma` → `.github/workflows/plainly-ios-build.yml` (macos-26, `eas build --local`).
- Site and legal: https://tryforma.app/plainly/
