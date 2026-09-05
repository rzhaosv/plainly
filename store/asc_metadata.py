"""Plainly App Store metadata + screenshots via ASC API. Idempotent. Run from landed/.credentials with PYTHONPATH=."""
import asc, json, os, glob, time
APP='6809042236'
SUBS=tuple(x for x in os.environ.get('PLAINLY_SUBS','').split(',') if x)
SHOTS=sorted(glob.glob('/Users/raymondzhao/workspace/plainly/store/screenshots/0*.png'))
SHOTS65=sorted(glob.glob('/Users/raymondzhao/workspace/plainly/store/screenshots65/0*.png'))
DESC="""Dating and friendship for autistic, ADHD, AuDHD and otherwise neurodivergent adults. Said plainly.

Plainly is built around the two things that go wrong most for us. First, on a niche app there is never anyone nearby. Second, the swiping was never the hard part; the date was: the bar nobody could hear in, the plan that stayed vague, the two hours with no polite way out.

TABLES: SMALL GROUP INVITES NEAR YOU
Four to eight people, hosted by a member who picks a place they already know is calm: the board-game café, the museum in its first quiet hour, a jigsaw and snacks. Every table states the noise, the light, how much talking to expect, what it costs and the exit plan, before you say yes. Six people in your city is not a small number. It is a table.

PEOPLE: ONE CARD AT A TIME, NO SWIPING
Say yes or pass. Both are free, neither is a judgment. Cards show what someone is here for, how they are wired, how they like to talk (“ask, don’t hint”, “slow replies are not a signal”) and what a good first meet looks like for them. Each card gives you the script: “a good first message to me is…”.

PAIRS: DOUBLE DATES WITH YOUR SAFE PERSON
Pair up with a friend who is also on Plainly. Your pair says yes to other pairs in your city; when both say yes, a four-person chat opens. Nobody carries the conversation alone, and leaving together is easy.

PLAN CARDS
In any chat, send a card: what, where exactly, when, how long, how loud, and how either of you can leave early. The other person can say yes with confidence instead of guessing.

CARDS THAT SAY THE QUIET PART
Sensory needs and communication style go on your card once, as plain facts, so you never disclose under pressure or apologise at the door. Info-dumps welcome. Special interests get their own line.

SAFETY WITHOUT A SPEECH
Adults only (18+). Block and report on every card and in every chat; a block hides you from each other everywhere. Tables are public places, never a home. “I am out” needs no reason. One button deletes your account and data.

FREE, AND PLAINLY PLUS
Your card, unlimited yeses, tables, pairs, chats and plan cards are free. Plainly Plus adds seeing who said yes to you first, filtering People by wiring and intent, and hosting up to three tables at once. Plus is an auto-renewing subscription (monthly or yearly). Payment is charged to your Apple ID account at confirmation of purchase. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel in your Apple ID settings.

Plainly introduces people; it does not vet them. Meet in public, tell a friend, and leave whenever you like.

Terms of Use (EULA): https://tryforma.app/plainly/terms.html
Privacy Policy: https://tryforma.app/plainly/privacy.html"""
KEYWORDS="autism,autistic,adhd,audhd,neurodivergent,dating,friends,friendship,quiet,introvert,double date,group,hiki"
PROMO="Dating and friends for autistic and ADHD adults. Small tables in quiet places, one-on-one with no swiping, double dates with your safe person. Saying yes is free."
def ok(r,what):
    if 'data' in r: return r['data']
    print('FAIL',what,json.dumps(r)[:600]); return None
v=asc.api('GET',f'/v1/apps/{APP}/appStoreVersions?filter[platform]=IOS&limit=1&fields[appStoreVersions]=versionString,appStoreState')['data'][0]
VID=v['id']; print('version', v['attributes'])
locs=asc.api('GET',f'/v1/appStoreVersions/{VID}/appStoreVersionLocalizations')['data']
en=next((l for l in locs if l['attributes']['locale']=='en-US'),None)
attrs={'description':DESC,'keywords':KEYWORDS[:100],'promotionalText':PROMO[:170],'supportUrl':'https://tryforma.app/plainly/','marketingUrl':'https://tryforma.app/plainly/'}
if en: r=asc.api('PATCH',f"/v1/appStoreVersionLocalizations/{en['id']}",{'data':{'type':'appStoreVersionLocalizations','id':en['id'],'attributes':attrs}})
else: r=asc.api('POST','/v1/appStoreVersionLocalizations',{'data':{'type':'appStoreVersionLocalizations','attributes':dict(attrs,locale='en-US'),'relationships':{'appStoreVersion':{'data':{'type':'appStoreVersions','id':VID}}}}})
en=ok(r,'version loc'); print('version localization ok', en['id'] if en else '')
infos=asc.api('GET',f'/v1/apps/{APP}/appInfos')['data']
for info in infos:
    il=asc.api('GET',f"/v1/appInfos/{info['id']}/appInfoLocalizations")['data']
    l=next((x for x in il if x['attributes']['locale']=='en-US'),None)
    a={'subtitle':'Autistic & ADHD adults, meet','privacyPolicyUrl':'https://tryforma.app/plainly/privacy.html'}
    if l: r=asc.api('PATCH',f"/v1/appInfoLocalizations/{l['id']}",{'data':{'type':'appInfoLocalizations','id':l['id'],'attributes':a}})
    else: r=asc.api('POST','/v1/appInfoLocalizations',{'data':{'type':'appInfoLocalizations','attributes':dict(a,locale='en-US'),'relationships':{'appInfo':{'data':{'type':'appInfos','id':info['id']}}}}})
    print('appInfo loc', 'ok' if 'data' in r else json.dumps(r)[:300])
    r=asc.api('PATCH',f"/v1/appInfos/{info['id']}",{'data':{'type':'appInfos','id':info['id'],'relationships':{'primaryCategory':{'data':{'type':'appCategories','id':'SOCIAL_NETWORKING'}},'secondaryCategory':{'data':{'type':'appCategories','id':'LIFESTYLE'}}}}})
    print('categories', 'ok' if 'data' in r else json.dumps(r)[:300])
r=asc.api('PATCH',f'/v1/apps/{APP}',{'data':{'type':'apps','id':APP,'attributes':{'contentRightsDeclaration':'DOES_NOT_USE_THIRD_PARTY_CONTENT'}}}); print('content rights', 'ok' if 'data' in r else json.dumps(r)[:200])
r=asc.api('PATCH',f'/v1/appStoreVersions/{VID}',{'data':{'type':'appStoreVersions','id':VID,'attributes':{'copyright':'2026 RZ International LLC','releaseType':'AFTER_APPROVAL'}}}); print('version attrs', 'ok' if 'data' in r else json.dumps(r)[:200])
rd=asc.api('GET',f'/v1/appStoreVersions/{VID}/appStoreReviewDetail')
ra={'contactFirstName':'Ruihao','contactLastName':'Zhao','contactPhone':'+14155550100','contactEmail':'ray@thezenithlabs.com','demoAccountRequired':False,'notes':'Plainly is a dating and friendship app for neurodivergent adults (18+). NO demo account is needed: the app creates an anonymous account on first launch, so simply open it, complete the six-step card (any values; birth year must make you 18+), and you are in. After onboarding a paywall appears; tap "Not now" to use the free tier. Tabs: Tables (hosted small group invites by city; tap "Host a table" to create one), People (say yes / pass; unlimited and free), Pairs (invite a friend by handle for double dates), Chats (opens when two people say yes, or when you join a table; includes "Plan card" composer), You (edit card, visibility, Plus, "Delete my account and data" per guideline 5.1.1). Plus subscription (monthly/yearly) unlocks who-liked-you, People filters and hosting three tables; all core features stay free. Safety: block/report on every profile and chat; adults only; tables are public places only. Backend is Supabase with row-level security; photos are optional.'}
if rd.get('data'): r=asc.api('PATCH',f"/v1/appStoreReviewDetails/{rd['data']['id']}",{'data':{'type':'appStoreReviewDetails','id':rd['data']['id'],'attributes':ra}})
else: r=asc.api('POST','/v1/appStoreReviewDetails',{'data':{'type':'appStoreReviewDetails','attributes':ra,'relationships':{'appStoreVersion':{'data':{'type':'appStoreVersions','id':VID}}}}})
print('review detail', 'ok' if 'data' in r else json.dumps(r)[:300])
if en and SHOTS:
    for disp, files in (('APP_IPHONE_67', SHOTS), ('APP_IPHONE_65', SHOTS65)):
        sets=asc.api('GET',f"/v1/appStoreVersionLocalizations/{en['id']}/appScreenshotSets?fields[appScreenshotSets]=screenshotDisplayType")['data']
        st=next((s for s in sets if s['attributes']['screenshotDisplayType']==disp),None)
        if not st: st=ok(asc.api('POST','/v1/appScreenshotSets',{'data':{'type':'appScreenshotSets','attributes':{'screenshotDisplayType':disp},'relationships':{'appStoreVersionLocalization':{'data':{'type':'appStoreVersionLocalizations','id':en['id']}}}}}),'set')
        have=[x['attributes']['fileName'] for x in asc.api('GET',f"/v1/appScreenshotSets/{st['id']}/appScreenshots?fields[appScreenshots]=fileName")['data']]
        for f in files:
            if os.path.basename(f) in have: continue
            r=asc.upload_asset('/v1/appScreenshots',{'data':{'type':'appScreenshots','attributes':{'fileName':os.path.basename(f)},'relationships':{'appScreenshotSet':{'data':{'type':'appScreenshotSets','id':st['id']}}}}},f,'appScreenshots')
            print('  shot', disp, os.path.basename(f), 'ok' if 'data' in r else json.dumps(r)[:200])
for sid in SUBS:
    cur=asc.api('GET',f'/v1/subscriptions/{sid}/appStoreReviewScreenshot')
    if cur.get('data'): print('sub', sid, 'review shot exists'); continue
    if not SHOTS: print('no screenshots yet for sub review'); continue
    r=asc.upload_asset('/v1/subscriptionAppStoreReviewScreenshots',{'data':{'type':'subscriptionAppStoreReviewScreenshots','attributes':{'fileName':'01_paywall.png'},'relationships':{'subscription':{'data':{'type':'subscriptions','id':sid}}}}},SHOTS[-1],'subscriptionAppStoreReviewScreenshots')
    print('sub', sid, 'review shot', 'ok' if 'data' in r else json.dumps(r)[:300])
time.sleep(2)
for sid in SUBS: print('sub state', asc.api('GET',f'/v1/subscriptions/{sid}?fields[subscriptions]=name,state')['data']['attributes'])
print('DONE')
