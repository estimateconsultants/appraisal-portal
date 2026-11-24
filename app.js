// Estimate Consultants client portal (v2). Plain JS, no build step.
// Talks to the Appraisals app (Apps Script) with actions p2_*; every rule checked here is checked again there.
'use strict';
const API = 'https://script.google.com/macros/s/AKfycbw9irQ5WbSoTcrPq8d4EU7L0U0pF3XJ-akfX7SS1LvdYOohEtF6-d_967_T-UEhsgrK/exec';
const STATES = {"AL":{"n":"Alabama","dl":6,"um":"none"},"AK":{"n":"Alaska","dl":2,"um":"both"},"AZ":{"n":"Arizona","dl":2,"um":"none"},"AR":{"n":"Arkansas","dl":3,"um":"both"},"CA":{"n":"California","dl":3,"um":"both"},"CO":{"n":"Colorado","dl":3,"um":"both"},"CT":{"n":"Connecticut","dl":2,"um":"none"},"DE":{"n":"Delaware","dl":2,"um":"both"},"DC":{"n":"District of Columbia","dl":3,"um":"both"},"FL":{"n":"Florida","dl":2,"um":"none"},"GA":{"n":"Georgia","dl":4,"um":"both"},"HI":{"n":"Hawaii","dl":2,"um":"none"},"ID":{"n":"Idaho","dl":3,"um":"none"},"IL":{"n":"Illinois","dl":5,"um":"both"},"IN":{"n":"Indiana","dl":2,"um":"both"},"IA":{"n":"Iowa","dl":5,"um":"none"},"KS":{"n":"Kansas","dl":2,"um":"none"},"KY":{"n":"Kentucky","dl":2,"um":"none"},"LA":{"n":"Louisiana","dl":2,"um":"both"},"ME":{"n":"Maine","dl":6,"um":"none"},"MD":{"n":"Maryland","dl":3,"um":"both"},"MA":{"n":"Massachusetts","dl":3,"um":"none","noCert":true},"MI":{"n":"Michigan","dl":3,"um":"none","noDV":true},"MN":{"n":"Minnesota","dl":6,"um":"none"},"MS":{"n":"Mississippi","dl":3,"um":"both"},"MO":{"n":"Missouri","dl":5,"um":"none"},"MT":{"n":"Montana","dl":2,"um":"none"},"NE":{"n":"Nebraska","dl":4,"um":"none","noDV":true},"NV":{"n":"Nevada","dl":3,"um":"none"},"NH":{"n":"New Hampshire","dl":3,"um":"none"},"NJ":{"n":"New Jersey","dl":6,"um":"both"},"NM":{"n":"New Mexico","dl":4,"um":"both"},"NY":{"n":"New York","dl":3,"um":"none"},"NC":{"n":"North Carolina","dl":3,"um":"uninsured","ncAppraisal":true},"ND":{"n":"North Dakota","dl":6,"um":"none"},"OH":{"n":"Ohio","dl":2,"um":"none"},"OK":{"n":"Oklahoma","dl":2,"um":"none"},"OR":{"n":"Oregon","dl":6,"um":"both"},"PA":{"n":"Pennsylvania","dl":2,"um":"none"},"RI":{"n":"Rhode Island","dl":10,"um":"both"},"SC":{"n":"South Carolina","dl":3,"um":"both"},"SD":{"n":"South Dakota","dl":6,"um":"none"},"TN":{"n":"Tennessee","dl":3,"um":"both"},"TX":{"n":"Texas","dl":2,"um":"both"},"UT":{"n":"Utah","dl":3,"um":"both"},"VT":{"n":"Vermont","dl":3,"um":"both"},"VA":{"n":"Virginia","dl":5,"um":"both"},"WA":{"n":"Washington","dl":3,"um":"both"},"WV":{"n":"West Virginia","dl":2,"um":"both"},"WI":{"n":"Wisconsin","dl":3,"um":"none"},"WY":{"n":"Wyoming","dl":4,"um":"none"}};
const ZIPR = [[5,5,'NY'],[10,27,'MA'],[28,29,'RI'],[30,38,'NH'],[39,49,'ME'],[50,54,'VT'],[55,55,'MA'],[56,59,'VT'],[60,69,'CT'],[70,89,'NJ'],[100,149,'NY'],[150,196,'PA'],[197,199,'DE'],[200,200,'DC'],[201,201,'VA'],[202,205,'DC'],[206,219,'MD'],[220,246,'VA'],[247,268,'WV'],[270,289,'NC'],[290,299,'SC'],[300,319,'GA'],[320,349,'FL'],[350,369,'AL'],[370,385,'TN'],[386,397,'MS'],[398,399,'GA'],[400,427,'KY'],[430,459,'OH'],[460,479,'IN'],[480,499,'MI'],[500,528,'IA'],[530,549,'WI'],[550,567,'MN'],[569,569,'DC'],[570,577,'SD'],[580,588,'ND'],[590,599,'MT'],[600,629,'IL'],[630,658,'MO'],[660,679,'KS'],[680,693,'NE'],[700,714,'LA'],[716,729,'AR'],[730,732,'OK'],[733,733,'TX'],[734,749,'OK'],[750,799,'TX'],[800,816,'CO'],[820,831,'WY'],[832,838,'ID'],[840,847,'UT'],[850,865,'AZ'],[870,884,'NM'],[885,885,'TX'],[889,898,'NV'],[900,961,'CA'],[967,968,'HI'],[970,979,'OR'],[980,994,'WA'],[995,999,'AK']];
// [code, name, one-line description, after an accident?]
const TYPES = [['dv','Diminished value','The value your car lost after an accident someone else caused',1],['ncdv','North Carolina appraisal','Diminished value through the NC appraisal process, NC cars only',1],['tl','Total loss','The insurer’s total loss offer looks too low',1],
  ['estate','Estate or probate','A vehicle’s value for an estate'],['divorce','Divorce','A vehicle’s value for a settlement'],['bank','Bank or lender','Value for a loan or collateral'],['irs','IRS donation','Value for a donated vehicle'],['classic','Classic or exotic','Collector, exotic and custom vehicles'],['equip','Heavy equipment','Construction and farm equipment'],['rv','RV or camper','Motorhomes, campers and trailers']];
const DVT = { dv: 1, dvself: 1, ncdv: 1 };
// Contributory negligence: any fault by the driver bars a claim against the other driver (accident state decides).
const CONTRIB = { AL: 1, MD: 1, NC: 1, VA: 1, DC: 1 };
// Underinsured coverage that pays for vehicle damage, checked against each state's statute (Nov 2026).
// Not here on purpose: NC, DE, IN, MS, OR, CO (underinsured covers injuries only); CA, IL, UT, LA, DC, AR (uninsured only or unclear).
const UNDER_OK = { AK: 1, GA: 1, MD: 1, NJ: 1, NM: 1, RI: 1, SC: 1, TN: 1, TX: 1, VA: 1, VT: 1, WA: 1, WV: 1 };
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const app = $('app');
const Q = new URLSearchParams(location.search);
const ARROW = '<span class="ar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>';
const CHEV = '<svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
const BACK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';
const CHECK = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#121012" stroke-width="3.5" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';

// ---------- storage (works even when the browser blocks it) ----------
const store = { get(k) { try { return localStorage.getItem(k) || sessionStorage.getItem(k); } catch (e) { return null; } },
  set(k, v, keep) { try { (keep ? localStorage : sessionStorage).setItem(k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) {} } };
let S = { token: store.get('ec_tok'), account: null, files: [], email: '', setup: null };
// Last known account and claims, so a returning client sees their claim instantly while the fresh copy loads.
const snap = { save() { if (S.token) store.set('ec_snap', JSON.stringify({ a: S.account, f: S.files }), (() => { try { return !!localStorage.getItem('ec_tok'); } catch (e) { return false; } })()); },
  load() { try { const o = JSON.parse(store.get('ec_snap') || 'null'); if (o && o.a) { S.account = o.a; S.files = o.f || []; return true; } } catch (e) {} return false; } };
// Wake the server as the page opens, so the first real request doesn't wait on a cold start.
try { fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: '{"action":"p2_ping"}' }).catch(() => {}); } catch (e) {}
// Full-screen loader (the MarketTrue gauge) for the few steps that wait on the server.
function loading(msg) { app.innerHTML = '<div class="loadr"><svg width="88" height="88" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 44a22 22 0 0 1 44 0" fill="none" stroke="#332c2f" stroke-width="6" stroke-linecap="round"/><path class="arc" d="M10 44a22 22 0 0 1 44 0" fill="none" stroke="#3ddc84" stroke-width="6" stroke-linecap="round"/><path class="ndl" d="M32 40 32 20" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="40" r="5" fill="#fff"/></svg><p>' + esc(msg || 'Loading') + '</p></div>'; }

// ---------- server ----------
async function call(action, body) {
  const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action, token: S.token }, body || {})) });
  const j = await r.json();
  if (j && j.reason === 'session') { store.del('ec_tok'); S.token = null; signIn(); throw new Error('Please sign in again.'); }
  return j;
}
function busy(btn, on) { if (!btn) return; if (on) { btn.dataset.t = btn.innerHTML; btn.innerHTML = '<span class="sp"></span>'; btn.classList.add('busy'); } else { btn.innerHTML = btn.dataset.t || btn.innerHTML; btn.classList.remove('busy'); } }
function toast(t, ms) { const el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, ms || 4000); }
function prog(p) { const i = document.querySelector('#prog i'); if (i) i.style.width = (p || 0) + '%'; }
function view(html, wide, p) { app.className = wide ? 'wide' : ''; prog(p); app.innerHTML = html; window.scrollTo(0, 0); const f = app.querySelector('[autofocus]'); if (f) setTimeout(() => f.focus(), 60); }
// State of the accident (DV claims ask for it; otherwise the insured state).
function accState() { const s = S.setup || {}, c = s.acc; return c && STATES[c] ? Object.assign({ code: c }, STATES[c]) : zipState(s.zip); }
function zipState(z) { z = String(z || ''); if (!/^\d{5}$/.test(z)) return null; const n = parseInt(z.slice(0, 3), 10), h = ZIPR.find((r) => n >= r[0] && n <= r[1]); return h && STATES[h[2]] ? Object.assign({ code: h[2] }, STATES[h[2]]) : null; }

// ---------- sign in ----------
function signIn(msg) {
  $('meBtn').hidden = true;
  view(`<div class="top-gap" style="padding-top:56px"><h1 class="h">Sign in to your claim</h1>
  <p class="lead">We’ll email you a 6-digit code. There’s no password to remember.</p>
  <form id="f" class="mt" novalidate><label class="f" for="em">Email</label>
  <input class="in" id="em" type="email" autocomplete="email" inputmode="email" autofocus value="${esc(S.email || (S.inv && S.inv.email) || Q.get('email') || '')}">
  <p class="err" id="er">${esc(msg || '')}</p>
  <button class="btn red mt-s" id="go" type="submit">Send my code ${ARROW}</button></form>
  <p class="small muted mt">You don’t need the portal to work with us. You can also call or text <a href="tel:9103336001">910-333-6001</a>, or email <a href="mailto:customerservice@estimateconsultants.com">customerservice@estimateconsultants.com</a>.</p></div>`);
  $('f').onsubmit = async (e) => {
    e.preventDefault(); const b = $('go'), em = $('em').value.trim(); $('er').textContent = '';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { $('er').textContent = 'Please check the email address.'; return; }
    // Go straight to the code screen; the request finishes in the background (back to this screen if the address isn't accepted).
    S.email = em.toLowerCase(); codeStep();
    try {
      const j = await call('p2_code_request', { email: em });
      if (!j.ok) { signIn(); $('er').innerHTML = esc(j.message) + (j.suggest ? ` <a href="#" id="sg">Use ${esc(j.suggest)}</a>` : ''); if (j.suggest) $('sg').onclick = (ev) => { ev.preventDefault(); $('em').value = j.suggest; }; return; }
      S.email = j.email;
    } catch (err) { signIn('Couldn’t send the code. Check your connection and try again.'); }
  };
}
function codeStep() {
  view(`<div class="swipe top-gap" style="padding-top:56px"><h1 class="h">Check your email</h1>
  <p class="lead">Enter the code we sent to <b style="color:#fff;font-weight:600">${esc(S.email)}</b>. It can take a minute to arrive.</p>
  <form id="f" class="mt" novalidate><div class="code" id="cd">${[0,1,2,3,4,5].map((i) => `<input inputmode="numeric" autocomplete="${i ? 'off' : 'one-time-code'}" maxlength="${i ? 1 : 6}" aria-label="Digit ${i + 1}"${i ? '' : ' autofocus'}>`).join('')}</div>
  <label class="check mt-s"><input type="checkbox" id="rm" checked>Keep me signed in on this device for 30 days</label>
  <p class="err" id="er"></p>
  <button class="btn red mt-s" id="go" type="submit">Open my claim ${ARROW}</button></form>
  <div class="mt" style="display:flex;flex-wrap:wrap;gap:10px 24px"><button class="link" type="button" id="again">Send a new code</button><button class="link" type="button" id="chg">Use a different email</button></div></div>`);
  const ins = [...$('cd').querySelectorAll('input')];
  const val = () => ins.map((x) => x.value).join('');
  ins.forEach((x, i) => {
    x.addEventListener('input', () => {
      const d = x.value.replace(/\D/g, '');
      if (d.length > 1) { d.slice(0, 6).split('').forEach((c, k) => { if (ins[k]) ins[k].value = c; }); ins[Math.min(5, d.length - 1)].focus(); }
      else { x.value = d; if (d && ins[i + 1]) ins[i + 1].focus(); }
      if (val().length === 6) $('f').requestSubmit();
    });
    x.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !x.value && ins[i - 1]) ins[i - 1].focus(); });
  });
  $('again').onclick = async (e) => { e.preventDefault(); const j = await call('p2_code_request', { email: S.email }).catch(() => null); toast(j && j.ok ? 'New code sent.' : (j && j.message) || 'Couldn’t send it. Try again.'); };
  $('chg').onclick = (e) => { e.preventDefault(); signIn(); };
  $('f').onsubmit = async (e) => {
    e.preventDefault(); if (val().length !== 6) { $('er').textContent = 'Enter all 6 digits.'; return; }
    const b = $('go'); busy(b, true); $('er').textContent = '';
    try {
      const j = await call('p2_code_verify', { email: S.email, code: val(), remember: $('rm').checked });
      if (!j.ok) { $('er').textContent = j.message; ins.forEach((x) => { x.value = ''; }); ins[0].focus(); return; }
      S.token = j.token; store.set('ec_tok', j.token, $('rm').checked); S.account = j.account; S.files = j.files || []; snap.save();
      afterSignIn();
    } catch (err) { $('er').textContent = 'Couldn’t check the code. Try again.'; } finally { busy(b, false); }
  };
}
function afterSignIn() {
  const a = S.account || {}; $('meBtn').hidden = false; $('meBtn').textContent = (a.name || a.email || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  if (!a.name) return profile();
  // Invited from the app: start the setup with what we already have, once.
  if (S.inv && !S.invUsed) { S.invUsed = 1; history.replaceState(null, '', location.pathname); return startSetup(S.inv.type || '', S.inv); }
  if (Q.get('vin') || Q.get('vehicle') || Q.get('start')) { const t = Q.get('start') || (Q.get('vr') ? 'tl' : ''); history.replaceState(null, '', location.pathname); return startSetup(t || ''); }
  if (!S.files.length) return startSetup('');
  home();
}
function profile() {
  view(`<div class="swipe top-gap"><h1 class="h">Your name and phone</h1><p class="lead">These go on your claim file.</p>
  <form id="f" class="mt stack" novalidate>
  <div><label class="f" for="nm">Full name</label><input class="in" id="nm" autocomplete="name" autofocus value="${esc((S.inv && S.inv.name) || '')}"></div>
  <div><label class="f" for="ph">Phone</label><input class="in" id="ph" type="tel" autocomplete="tel" inputmode="tel" value="${esc((S.inv && S.inv.phone) || '')}"></div>
  <p class="err" id="er"></p><button class="btn red" id="go" type="submit">Continue ${ARROW}</button></form></div>`);
  $('f').onsubmit = async (e) => {
    e.preventDefault(); const b = $('go'); busy(b, true); $('er').textContent = '';
    try { const j = await call('p2_profile', { name: $('nm').value, phone: $('ph').value }); if (!j.ok) { $('er').textContent = j.message; return; } S.account = j.account; snap.save(); afterSignIn(); }
    catch (err) { $('er').textContent = 'Couldn’t save. Try again.'; } finally { busy(b, false); }
  };
}

// ---------- claim setup ----------
function startSetup(type, pre) {
  pre = pre || {};
  S.setup = { type: type || '', i: 0, a: {}, zip: zipState(pre.zip) ? pre.zip : '', preZip: !!zipState(pre.zip), acc: STATES[pre.acc] ? pre.acc : undefined, preAcc: !!STATES[pre.acc], inv: pre.id || '',
    vr: Q.get('vr') || '', vehicle: { vin: pre.vin || Q.get('vin') || '', mileage: String(pre.miles || Q.get('miles') || '').replace(/[^\d]/g, ''), desc: pre.vehicle || Q.get('vehicle') || '' }, dir: '' };
  if (type) S.setup.i = 1; if (S.setup.vehicle.vin) decodeVin(S.setup.vehicle); renderSetup();
}
function questions() {
  const s = S.setup, st = zipState(s.zip), dv = !!DVT[s.type], acc = accState();
  const fault = [['The other driver', 'other']].concat(st && st.um !== 'none' ? [['The other driver, and they had no insurance', 'unins']] : []).concat(st && st.um !== 'none' && UNDER_OK[st.code] ? [['The other driver, without enough insurance', 'under']] : []).concat(acc && CONTRIB[acc.code] ? [['Partly me, partly the other driver', 'partly']] : []).concat([['Me', 'me'], ['Not decided yet', 'open']]);
  const qs = [{ id: 'type' }, { id: 'zip', title: 'What ZIP code is the car insured at?', sub: 'Your policy’s state decides what your own coverage includes.' }];
  if (dv) qs.push({ id: 'acc', title: 'Which state was the accident in?', sub: 'That state’s law sets the deadline and the rules for a claim against the other driver.' });
  qs.push({ id: 'vehicle' });
  if (dv) qs.push({ id: 'fault', title: 'Who was at fault?', sub: 'Diminished value is claimed from the at-fault driver’s insurer' + (st && st.um !== 'none' ? ', or your own ' + (UNDER_OK[st.code] ? 'uninsured or underinsured' : 'uninsured') + ' motorist coverage in ' + st.n + '.' : '.'), opts: fault },
    { id: 'date', title: 'When was the accident?', sub: acc ? 'In ' + acc.n + ', you generally have ' + acc.dl + ' years from the accident to file suit if the claim isn’t resolved. The insurer may close the claim sooner, so it’s best to start early.' : '' },
    { id: 'prior', title: 'Any earlier accident?', sub: 'Before this one. We’ll verify the vehicle’s accident history.', opts: [['No', 'n'], ['Yes', 'y'], ['Not sure', 'u']] },
    { id: 'lease', title: 'Is the car leased?', sub: '', opts: [['No', 'n'], ['Yes, it’s leased', 'y']] },
    { id: 'repair', title: 'Has it been repaired?', sub: 'We can start either way.', opts: [['Yes, repairs are done', 'done'], ['Being repaired now', 'now'], ['Not yet', 'not']] });
  if (s.type === 'dv' || s.type === 'dvself') qs.push({ id: 'service', title: 'How do you want to handle the insurer?', sub: 'Full service: the $199 isn’t charged if the insurer’s offer doesn’t reach $498.',
    opts: [['We handle it: $299 now, $199 when the offer comes in', 'full'], ['You handle it: $299, with our appraisal and a demand letter', 'self']] });
  qs.push({ id: 'summary' });
  return qs;
}
const STOP = {
  noCert: (st) => [st.n + ': certified appraisals unavailable', 'We can’t provide certified appraisals in ' + st.n + '.', true],
  noDV: (st) => ['Diminished value unavailable in ' + st.n, 'We don’t offer diminished value claims in ' + st.n + '.', true],
  ncOnly: () => ['North Carolina only', 'This appraisal option is for accidents in North Carolina. Choose “Diminished value” instead.', false],
  partly: (st) => ['Partly at fault', st.n + ' doesn’t allow a claim against the other driver when you were even partly at fault for the accident.', false],
  me: () => ['You were at fault', 'Diminished value is paid by the at-fault driver’s insurer, so there’s no claim when you were at fault.', false],
  open: () => ['Fault isn’t decided yet', 'Diminished value is claimed once the other driver is found at fault. Come back as soon as their insurer accepts fault.', false],
  late: (st) => ['Past the deadline', 'In ' + st.n + ', the general deadline to file suit for property damage is ' + st.dl + ' years from the accident, and that time has passed.', false],
  age: () => ['The car is over 10 years old', 'Our diminished value appraisals are for vehicles 10 model years old or newer.', false],
  miles: () => ['Over 100,000 miles', 'Our diminished value appraisals are for vehicles under 100,000 miles.', false],
  prior: () => ['An earlier accident', 'Our diminished value appraisals are for vehicles with no accident before this one. We verify the accident history on every claim.', false]
};
function stopScreen(code) {
  const st = (code === 'late' || code === 'partly' || (code === 'noDV' && accState() && accState().noDV) ? accState() : zipState(S.setup.zip)) || { n: '' }, x = (STOP[code] || (() => ['Not available', 'This claim doesn’t qualify. Call us and we’ll talk it through.', false]))(st);
  view(`<div class="swipe top-gap"><h1 class="h">${esc(x[0])}</h1><p class="lead">${esc(x[1])}${x[2] ? ' Our MarketTrue Valuation Reports are still available there: an instant, uncertified report you can use with the insurer.' : ''}</p>
  <div class="stack mt">${x[2] ? `<a class="btn red" href="https://www.estimateconsultants.com/total-loss-valuation-report.html">Get a MarketTrue Valuation Report ${ARROW}</a>` : ''}
  <a class="btn ${x[2] ? 'ghost' : 'red'}" href="tel:9103336001">Call 910-333-6001</a>
  <button class="btn ghost" type="button" id="bk">Change an answer</button></div></div>`);
  $('bk').onclick = () => { S.setup.dir = 'rev'; renderSetup(); };
}
// Leased cars: the leasing company may own the diminished value claim. Not a stop, just a heads-up.
function leaseNote() {
  view(`<div class="swipe top-gap"><h1 class="h">Check your lease first</h1>
  <p class="lead">On a leased car, the leasing company may own the diminished value claim, since they own the car. Your lease or the leasing company can tell you who can file it. We can still do your appraisal either way.</p>
  <div class="stack mt"><button class="btn red" type="button" id="go">Continue ${ARROW}</button><button class="btn ghost" type="button" id="bk">Change my answer</button></div></div>`, false, Math.round((S.setup.i + 1) / questions().length * 100));
  $('go').onclick = () => { S.setup.i++; S.setup.dir = ''; renderSetup(); };
  $('bk').onclick = () => { S.setup.dir = 'rev'; renderSetup(); };
}
function stopFor(id, v) {
  const s = S.setup, st = zipState(s.zip);
  if (id === 'zip') { if (st.noCert) return 'noCert'; if (DVT[s.type] && st.noDV) return 'noDV'; }
  if (id === 'acc') { const a = accState(); if (a.noDV) return 'noDV'; if (s.type === 'ncdv' && a.code !== 'NC') return 'ncOnly'; }
  if (id === 'fault' && (v === 'me' || v === 'open' || v === 'partly')) return v;
  if (id === 'date') { const y = (Date.now() - Date.parse(v + 'T12:00:00')) / 31557600000; if (y > accState().dl) return 'late'; }
  if (id === 'age' && v === 'n') return 'age';
  if (id === 'miles' && v === 'n') return 'miles';
  if (id === 'prior' && v === 'y') return 'prior';
  return '';
}
function answer(id, v, label) {
  const s = S.setup;
  if (id === 'service') { s.type = v === 'self' ? 'dvself' : 'dv'; s.labels = s.labels || {}; s.labels.service = label; s.i++; s.dir = ''; return renderSetup(); }
  s.a[id] = v; s.labels = s.labels || {}; s.labels[id] = label || v;
  const stop = stopFor(id, v); if (stop) return stopScreen(stop);
  if (id === 'lease' && v === 'y') return leaseNote();
  s.i++; s.dir = ''; renderSetup();
}
function renderSetup() {
  const s = S.setup, qs = questions(); if (s.i >= qs.length) s.i = qs.length - 1;
  const q = qs[s.i], n = qs.length, pos = s.i + 1;
  const bar = `<div class="backrow"><button class="back" type="button" id="bk">${BACK}Back</button><span class="cnt">${pos} of ${n}</span></div>`;
  const wrap = (inner) => view(bar + `<div class="swipe ${s.dir}" style="padding-top:14px">${inner}</div>`, false, Math.round(pos / n * 100));
  if (q.id === 'type') {
    const row = (t) => `<button class="li" type="button" data-t="${t[0]}"><span class="bd"><span class="nm">${esc(t[1])}</span><span class="d">${esc(t[2])}</span></span>${CHEV}</button>`;
    wrap(`<h1 class="h">What’s the appraisal for?</h1>
    <p class="grp">After an accident</p><div class="list">${TYPES.filter((t) => t[3]).map(row).join('')}</div>
    <p class="grp">Other appraisals</p><div class="list">${TYPES.filter((t) => !t[3]).map(row).join('')}</div>
    <p class="mt" style="margin-bottom:0"><button class="link" type="button" id="ns">Not sure which one? Start with diminished value</button></p>`);
    app.querySelectorAll('[data-t]').forEach((b) => { b.onclick = () => { s.type = b.dataset.t; s.labels = { type: b.querySelector('.nm').textContent }; s.i = 1; s.dir = ''; renderSetup(); }; });
    $('ns').onclick = () => { s.type = 'dv'; s.labels = { type: 'Diminished value' }; s.i = 1; renderSetup(); };
  } else if (q.id === 'zip' && s.preZip && !s.zipShown && s.dir !== 'rev') {
    s.zipShown = 1; const st0 = zipState(s.zip); return answer('zip', s.zip, s.zip + ', ' + st0.n);
  } else if (q.id === 'acc' && s.preAcc && !s.accShown && s.dir !== 'rev') {
    s.accShown = 1; return answer('acc', s.acc, STATES[s.acc].n);
  } else if (q.id === 'zip') {
    wrap(`<h1 class="h">${esc(q.title)}</h1><p class="lead">${esc(q.sub)}</p>
    <form id="f" class="mt" novalidate><label class="f" for="z">ZIP code</label><input class="in zip" id="z" inputmode="numeric" maxlength="5" autocomplete="postal-code" value="${esc(s.zip)}" autofocus>
    <p class="hint" id="zp"></p><button class="btn red mt" type="submit">Continue ${ARROW}</button></form>`);
    const show = () => { const st = zipState($('z').value); $('zp').textContent = st ? st.n : 'Enter the 5-digit ZIP code'; $('zp').className = 'hint' + (st ? ' ok' : ''); };
    $('z').oninput = () => { $('z').value = $('z').value.replace(/\D/g, '').slice(0, 5); show(); }; show();
    $('f').onsubmit = (e) => { e.preventDefault(); const st = zipState($('z').value); if (!st) return toast('Enter a valid 5-digit ZIP code.'); if (s.zip !== $('z').value) delete s.acc; s.zip = $('z').value; answer('zip', s.zip, s.zip + ', ' + st.n); };
  } else if (q.id === 'acc') {
    const cur = s.acc || (zipState(s.zip) || {}).code || '';
    wrap(`<h1 class="h">${esc(q.title)}</h1><p class="lead">${esc(q.sub)}</p>
    <form id="f" class="mt" novalidate><label class="f" for="as">State</label><select class="in" id="as" autofocus>${Object.keys(STATES).sort((a, b) => STATES[a].n.localeCompare(STATES[b].n)).map((c) => `<option value="${c}"${c === cur ? ' selected' : ''}>${esc(STATES[c].n)}</option>`).join('')}</select>
    <button class="btn red mt" type="submit">Continue ${ARROW}</button></form>`);
    $('f').onsubmit = (e) => { e.preventDefault(); s.acc = $('as').value; answer('acc', s.acc, STATES[s.acc].n); };
  } else if (q.id === 'date') {
    const today = new Date().toISOString().slice(0, 10);
    wrap(`<h1 class="h">${esc(q.title)}</h1><p class="lead">${esc(q.sub)}</p>
    <form id="f" class="mt" novalidate><label class="f" for="dt">Date of the accident</label><input class="in" id="dt" type="date" max="${today}" value="${esc(s.a.date || '')}" autofocus style="color-scheme:dark">
    <button class="btn red mt" type="submit">Continue ${ARROW}</button></form>`);
    $('f').onsubmit = (e) => { e.preventDefault(); const v = $('dt').value; if (!v || v > today) return toast('Pick the date of the accident.'); answer('date', v, v.slice(5, 7) + '/' + v.slice(8) + '/' + v.slice(0, 4)); };
  } else if (q.opts) {
    wrap(`<h1 class="h">${esc(q.title)}</h1>${q.sub ? `<p class="lead">${esc(q.sub)}</p>` : ''}
    <div class="list mt">${q.opts.map((o) => `<button class="li opt" type="button" data-v="${o[1]}"><span class="rad" aria-hidden="true"></span><span class="bd">${esc(o[0])}</span></button>`).join('')}</div>`);
    app.querySelectorAll('.opt').forEach((b) => { b.onclick = () => answer(q.id, b.dataset.v, b.querySelector('.bd').textContent); });
  } else if (q.id === 'vehicle') {
    const v = s.vehicle;
    if (v.year && v.mileage && s.dir !== 'rev' && !s.vehShown) { s.vehShown = 1; const why = vehicleStop(); if (why) return stopScreen(why); s.i++; return renderSetup(); }
    wrap(`<h1 class="h">Your vehicle</h1><p class="lead">The VIN tells us the year, make and model.</p>
    <form id="f" class="mt stack" novalidate>
    <div><label class="f" for="vin">VIN <span class="muted">(17 characters, on the registration or driver’s door)</span></label><input class="in" id="vin" maxlength="17" autocapitalize="characters" value="${esc(v.vin)}" autofocus style="text-transform:uppercase;letter-spacing:.06em"></div>
    <p class="hint" id="vd" style="margin:-4px 0 0">${esc(v.desc ? v.desc : '')}</p>
    <div><label class="f" for="mi">Mileage</label><input class="in" id="mi" inputmode="numeric" value="${esc(v.mileage)}"></div>
    <button class="btn red" type="submit">Continue ${ARROW}</button></form>`);
    const decode = async () => {
      const vin = $('vin').value.toUpperCase().replace(/[^A-Z0-9]/g, ''); $('vin').value = vin;
      if (vin.length !== 17) { $('vd').textContent = ''; return; }
      $('vd').innerHTML = '<span class="sp" style="width:14px;height:14px;border-width:2px;vertical-align:-2px"></span> Looking it up…';
      try {
        const j = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/' + vin + '?format=json').then((r) => r.json()), x = (j.Results || [])[0] || {};
        if (x.ModelYear && x.Make) { Object.assign(v, { vin, year: x.ModelYear, make: titleCase(x.Make), model: x.Model || '', trim: x.Trim || '' }); v.desc = [v.year, v.make, v.model, v.trim].filter(Boolean).join(' '); $('vd').textContent = v.desc; $('vd').className = 'hint ok'; }
        else { $('vd').textContent = 'We couldn’t read that VIN. Please check it.'; $('vd').className = 'hint'; }
      } catch (e) { $('vd').textContent = ''; }
    };
    $('vin').oninput = () => { if ($('vin').value.replace(/[^A-Za-z0-9]/g, '').length === 17) decode(); };
    if (v.vin && !v.year) decode();
    $('f').onsubmit = (e) => { e.preventDefault(); v.vin = $('vin').value.toUpperCase().replace(/[^A-Z0-9]/g, ''); v.mileage = $('mi').value.replace(/[^\d]/g, '');
      if (v.vin.length !== 17) return toast('Enter the 17-character VIN.'); if (!v.year) return toast('We need a VIN we can read.'); if (!v.mileage) return toast('Enter the mileage.');
      const why = vehicleStop(); if (why) return stopScreen(why);
      s.i++; s.dir = ''; renderSetup(); };
  } else if (q.id === 'summary') {
    const st = zipState(s.zip), L = s.labels || {}, a = S.account || {};
    const rows = [['Name', a.name], ['Email', a.email], ['Phone', fmtPhone(a.phone)], ['Vehicle', s.vehicle.desc], ['VIN', s.vehicle.vin], ['Mileage', Number(s.vehicle.mileage).toLocaleString('en-US')]]
      .concat([['service', 'Service'], ['zip', 'Insured at'], ['acc', 'Accident in'], ['fault', 'At fault'], ['date', 'Accident date'], ['prior', 'Earlier accident'], ['lease', 'Leased'], ['repair', 'Repairs']].filter((x) => L[x[0]]).map((x) => [x[1], L[x[0]]])).filter((r) => r[1]);
    const name = s.type === 'ncdv' ? 'North Carolina diminished value appraisal' : s.type === 'dv' ? 'Diminished value, full service' : s.type === 'dvself' ? 'Diminished value, self-service' : (L.type || '') + ' appraisal';
    wrap(`<h1 class="h">Check your details</h1><p class="lead"><span class="ok">Your claim qualifies</span> for a ${esc(name.charAt(0).toLowerCase() + name.slice(1)).replace(/^north carolina/, 'North Carolina')}.</p>
    <dl class="list sum mt">${rows.map((r) => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>
    ${DVT[s.type] && st && st.code === 'MD' && /unins|under/.test(s.a.fault || '') ? '<p class="note mt-s">Maryland: the state insurance department says uninsured and underinsured motorist coverage must pay diminished value, and insurers can’t exclude it (Bulletin 24-8, April 2024).</p>' : ''}
    ${accState() && accState().ncAppraisal && DVT[s.type] ? '<p class="note mt-s">North Carolina: if the other driver’s fault isn’t in dispute and their insurer’s number is more than $2,000 from ours (or 25% of the car’s value, if that’s less), state law lets either side demand an appraisal. Each side names a licensed appraiser; if they can’t agree, an umpire decides between the two numbers, and either side can reject that decision within 15 days. We’ll show you this option if the offer comes in that far apart.</p>' : ''}
    <div class="stack mt"><button class="btn red" type="button" id="ok">Set up my claim ${ARROW}</button><button class="btn ghost" type="button" id="ch">Change something</button></div><p class="err" id="er"></p>`);
    $('ch').onclick = () => { s.i = 1; s.dir = 'rev'; renderSetup(); };
    $('ok').onclick = async () => {
      const b = $('ok'); busy(b, true); const keep = app.innerHTML; loading('Setting up your claim');
      try {
        const j = await call('p2_setup', { setup: { type: s.type, zip: s.zip, answers: s.a, vehicle: s.vehicle, vr: s.vr || '', accState: DVT[s.type] ? accState().code : '', inv: s.inv || '' } });
        if (!j.ok) { if (j.reason === 'qualify') return stopScreen(j.why); renderSetup(); toast(j.message || 'Couldn’t save your claim. Try again.'); return; }
        S.files = j.files || S.files; S.setup = null; snap.save(); toast(j.existing ? 'This vehicle already has a file. Here it is.' : 'Your claim is set up.'); claim(j.fileId);
      } catch (e) { renderSetup(); toast('Couldn’t save your claim. Check your connection and try again.'); }
    };
  }
  $('bk').onclick = () => { if (s.i <= 0 || (s.i === 1 && !S.files.length && false)) return home(); s.i--; s.dir = 'rev'; if (s.i === 0) s.type = ''; renderSetup(); };
}
function vehicleStop() { const s = S.setup, v = s.vehicle; if (!DVT[s.type]) return ''; if (parseInt(v.year, 10) < new Date().getFullYear() - 10) return 'age'; if (Number(v.mileage) >= 100000) return 'miles'; return ''; }
// Reads the VIN as soon as we have one (from a link or typed), so the vehicle screen can be skipped or filled in.
async function decodeVin(v) {
  const vin = String(v.vin || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (vin.length !== 17) return false;
  try { const j = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/' + vin + '?format=json').then((r) => r.json()), x = (j.Results || [])[0] || {};
    if (x.ModelYear && x.Make) { Object.assign(v, { vin, year: x.ModelYear, make: titleCase(x.Make), model: x.Model || '', trim: x.Trim || '' }); v.desc = [v.year, v.make, v.model, v.trim].filter(Boolean).join(' '); return true; } } catch (e) {}
  return false;
}
function fmtPhone(p) { const d = String(p || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, ''); return d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : String(p || ''); }
function titleCase(t) { return String(t || '').toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\bBmw\b/, 'BMW').replace(/\bGmc\b/, 'GMC'); }

// ---------- home and claim ----------
function home() {
  view(`<div class="top-gap"><h1 class="h">Your claims</h1>
  ${S.files.length ? `<div class="list mt">${S.files.map((f) => `<a class="li" href="#${esc(f.fileId)}" data-f="${esc(f.fileId)}"><span class="bd"><span class="nm" style="font-weight:600">${esc(f.vehicle || 'Vehicle')}</span><span class="d">${esc(shortType(f.type))}, file ${esc(f.fileId)}</span><span class="d" style="color:var(--redsoft)">${esc(nowStep(f))}</span></span>${CHEV}</a>`).join('')}</div>` : '<p class="lead">You don’t have a claim with us yet.</p>'}
  <div class="mt"><button class="btn red" type="button" id="nw">Start a new claim ${ARROW}</button></div></div>`);
  app.querySelectorAll('[data-f]').forEach((a) => { a.onclick = (e) => { e.preventDefault(); claim(a.dataset.f); }; });
  $('nw').onclick = () => startSetup('');
}
function shortType(t) { t = String(t || ''); return /diminished/i.test(t) ? 'Diminished value' : /total loss/i.test(t) ? 'Total loss' : /estate|probate/i.test(t) ? 'Appraisal' : /bank/i.test(t) ? 'Bank & collateral' : /irs/i.test(t) ? 'IRS donation' : 'Appraisal'; }
function nowStep(f) { const s = (f.steps || []).find((x) => !x.done); return s ? (s.note || s.name) : 'In progress'; }
function claim(id) {
  const f = S.files.find((x) => x.fileId === id); if (!f) return home();
  history.replaceState(null, '', '#' + id);
  const steps = f.steps || [], cur = steps.findIndex((x) => !x.done), needs = (f.needs || []).filter((x) => !x.done), ups = f.updates || [];
  const done = steps.filter((x) => x.done).length;
  view(`<div><div class="backrow"><a href="#" id="hm" class="back">${BACK}Your claims</a></div>
  <div class="claimhd"><p class="meta">${esc(shortType(f.type))}, file ${esc(f.fileId)}</p><h1 class="plate">${esc(f.vehicle)}</h1></div>
  ${needs.length ? `<section class="sec"><h2 class="h2">We need from you</h2><div class="list need">${needs.map((x) => `<div class="li"><span class="bd"><span class="nm" style="font-weight:600">${esc(x.name)}</span>${x.note ? `<span class="d">${esc(x.note)}</span>` : ''}</span><span class="tag">Needed</span></div>`).join('')}</div></section>` : ''}
  ${steps.length ? `<section class="sec"><h2 class="h2">Progress <span class="muted" style="font-weight:400">${done} of ${steps.length} done</span></h2>
  <ol class="tl">${steps.map((x, i) => `<li class="${x.done ? 'done' : i === cur ? 'now' : 'next'}"><span class="dot">${x.done ? CHECK : ''}</span><div><div class="nm">${esc(x.name)}</div>${x.date || x.note ? `<div class="sub">${esc([x.note, x.date].filter(Boolean).join(', '))}</div>` : ''}</div></li>`).join('')}</ol></section>` : ''}
  ${ups.length ? `<section class="sec"><h2 class="h2">Latest update</h2>${ups.slice(-1).map((u) => `<p class="upd">${esc(u.text)}</p><p class="meta" style="margin-top:6px">${esc(u.date || '')}</p>`).join('')}</section>` : ''}
  <p class="small muted mt">Questions? Email <a href="mailto:customerservice@estimateconsultants.com">customerservice@estimateconsultants.com</a>.</p></div>`);
  $('hm').onclick = (e) => { e.preventDefault(); history.replaceState(null, '', location.pathname); home(); };
}

// ---------- account menu ----------
$('meBtn').onclick = () => {
  const a = S.account || {};
  view(`<div class="top-gap"><h1 class="h">${esc(a.name || 'Your account')}</h1>
  <dl class="list sum mt"><div><dt>Email</dt><dd>${esc(a.email)}</dd></div>${a.phone ? `<div><dt>Phone</dt><dd>${esc(fmtPhone(a.phone))}</dd></div>` : ''}</dl>
  <div class="stack mt"><button class="btn ghost" id="cl" type="button">Your claims</button><button class="btn ghost" id="so" type="button">Sign out</button></div></div>`);
  $('cl').onclick = home; $('so').onclick = () => { store.del('ec_tok'); store.del('ec_snap'); S = { token: null, files: [], email: a.email }; signIn(); };
};

// ---------- start ----------
(async function boot() {
  const invId = Q.get('inv');
  if (invId && /^[a-f0-9]{32}$/.test(invId)) {
    loading('Opening your claim');
    try { const j = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'p2_invite', inv: invId }) }).then((x) => x.json());
      if (j.ok) { S.inv = Object.assign({ id: invId }, j.invite); S.email = S.inv.email; snap.load(); if (S.account && S.account.email && S.account.email !== S.inv.email) { store.del('ec_tok'); store.del('ec_snap'); S.token = null; S.account = null; S.files = []; } }
      else toast(j.message || 'This link has expired.', 7000);
    } catch (e) {}
  }
  if (!S.token) return signIn();
  const had = snap.load();
  if (had) afterSignIn(); else loading('Opening your claim');
  try {
    const j = await call('p2_me'); if (!j.ok) return signIn();
    const changed = JSON.stringify([j.account, j.files]) !== JSON.stringify([S.account, S.files]);
    S.account = j.account; S.files = j.files || []; snap.save();
    if (!had) afterSignIn(); else if (changed && !S.setup) { const open = (location.hash || '').slice(1); if (open && S.files.some((f) => f.fileId === open)) claim(open); else afterSignIn(); }
  } catch (e) { if (!had && S.token) app.innerHTML = '<p class="err" style="margin-top:80px">Couldn’t load your account. Check your connection and refresh.</p>'; }
})();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
