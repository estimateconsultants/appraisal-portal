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
const ARROW = '<span class="ar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>';
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
  <input class="in" id="em" type="email" autocomplete="email" inputmode="email" autofocus value="${esc(S.email || (S.inv && S.inv.email) || Q.get('email') || Q.get('s') || '')}">
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
    ${DVT[s.type] ? '<p class="note mt-s">Insurers often offer much less than the full diminished value at first. Getting the full amount can mean small claims court. We’ll give you our honest estimate of where it may settle once we’ve done the appraisal.</p>' : ''}
    ${DVT[s.type] && st && st.code === 'MD' && /unins|under/.test(s.a.fault || '') ? '<p class="note mt-s">Maryland: the state insurance department says uninsured and underinsured motorist coverage must pay diminished value, and insurers can’t exclude it (Bulletin 24-8, April 2024).</p>' : ''}
    ${accState() && accState().ncAppraisal && DVT[s.type] ? '<p class="note mt-s">North Carolina: if the other driver’s fault isn’t in dispute and their insurer’s number is more than $2,000 from ours (or 25% of the car’s value, if that’s less), state law lets either side demand an appraisal. Each side names a licensed appraiser; if they can’t agree, an umpire decides between the two numbers, and either side can reject that decision within 15 days. We’ll show you this option if the offer comes in that far apart.</p>' : ''}
    <div class="stack mt"><button class="btn red" type="button" id="ok">Set up my claim ${ARROW}</button><button class="btn ghost" type="button" id="ch">Change something</button></div><p class="err" id="er"></p>`);
    $('ch').onclick = () => { s.i = 1; s.dir = 'rev'; renderSetup(); };
    $('ok').onclick = async () => {
      const b = $('ok'); busy(b, true); const keep = app.innerHTML; const pg = setupProgress();
      try {
        const j = await call('p2_setup', { setup: { type: s.type, zip: s.zip, answers: s.a, vehicle: s.vehicle, vr: s.vr || '', accState: DVT[s.type] ? accState().code : '', inv: s.inv || '' } });
        if (!j.ok) { pg.stop(); if (j.reason === 'qualify') return stopScreen(j.why); renderSetup(); toast(j.message || 'Couldn’t save your claim. Try again.'); return; }
        await pg.done(); S.files = j.files || S.files; S.setup = null; snap.save(); toast(j.existing ? 'This vehicle already has a file. Here it is.' : 'Your claim is set up.'); claim(j.fileId);
      } catch (e) { pg.stop(); renderSetup(); toast('Couldn’t save your claim. Check your connection and try again.'); }
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
  const steps = f.steps || [], cur = steps.findIndex((x) => !x.done), ups = f.updates || [];
  const needs = (f.needs || []).filter((x) => x.id !== 'other'), other = (f.needs || []).find((x) => x.id === 'other');
  const open = needs.filter((x) => !x.done && !(x.files || []).length).length, done = steps.filter((x) => x.done).length;
  const money = (n) => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const row = (x) => {
    const got = (x.files || []).length;
    const shots = isShotNeed(x), sd = shots ? shotsFor(f, x).filter((k) => shotDone(x, k)).length : 0, sn = shots ? shotsFor(f, x).length : 0;
    const right = x.done ? '<span class="tag ok">Checked</span>'
      : shots ? `<button class="upbtn" type="button" data-shots="${esc(x.id)}">${sd ? 'Continue' : 'Start'}</button>`
      : `<label class="upbtn" for="u_${esc(x.id)}">${got ? 'Add more' : 'Upload'}</label><input type="file" id="u_${esc(x.id)}" data-need="${esc(x.id)}" accept="image/*,application/pdf" multiple hidden>`;
    const sub = shots ? `<span class="d${sd === sn ? ' ok' : ''}">${sd === sn ? 'All ' + sn + ' photos received' : sd + ' of ' + sn + ' photos. We’ll show you each one to take.'}</span>`
      : got ? `<span class="d ok">Received: ${x.files.map((y) => esc(y.name)).join(', ')}</span>` : (x.note ? `<span class="d">${esc(x.note)}</span>` : '');
    return `<div class="li" id="n_${esc(x.id)}"><span class="bd"><span class="nm" style="font-weight:600">${esc(x.name)}</span>${sub}<span class="d upst" hidden></span></span>${right}</div>`;
  };
  const showOffer = f.kind === 'dv' || f.kind === 'tl', invs = f.invoices || [], dueInv = invs.filter((x) => x.status === 'due'); const needSign = !!(f.agreement && !f.agreement.signed);
  view(`<div><div class="backrow"><a href="#" id="hm" class="back">${BACK}Your claims</a></div>
  ${heroHtml(f)}
  ${f.agreement ? `<section class="sec"><h2 class="h2">Your agreement</h2><div class="list${f.agreement.signed ? '' : ' need'}"><div class="li"><span class="bd"><span class="nm" style="font-weight:600">Appraisal agreement</span>${FULLSVC(f) ? '<span class="d">This allows us to speak to the insurer about your claim.</span>' : ''}<span class="d${f.agreement.signed ? ' ok' : ''}">${f.agreement.signed ? 'Signed' : 'Ready for you to sign'}</span></span>${f.agreement.signed ? '<span class="tag ok">Signed</span>' : `<a class="btn red sm" href="${esc(f.agreement.url)}">Sign</a>`}</div></div></section>` : ''}
  ${invs.length ? `<section class="sec"><h2 class="h2">Payments</h2><div class="list${dueInv.length ? ' need' : ''}">${invs.map((x) => `<div class="li"><span class="bd"><span class="nm" style="font-weight:600">${esc(x.desc)}</span><span class="d${x.status === 'paid' ? ' ok' : ''}">${x.status === 'paid' ? 'Paid ' + esc(x.paidAt) : x.status === 'later' ? money(x.cents / 100) : x.status === 'waived' ? 'Waived' : money(x.cents / 100) + ' due'}${x.note ? ', ' + esc(x.note) : ''}</span></span>${x.status === 'due' && needSign ? `<button class="btn sm dim" type="button" disabled>Pay ${money(x.cents / 100)}</button>` : x.status === 'due' ? `<button class="btn red sm" type="button" data-pay="${esc(x.id)}">Pay ${money(x.cents / 100)}</button>` : x.status === 'later' ? '<button class="btn sm dim" type="button" disabled>Not yet due</button>' : x.status === 'waived' ? '<span class="tag ok">Waived</span>' : `<span class="tag ok">${money(x.cents / 100)}</span>`}</div>`).join('')}</div>
  ${dueInv.length ? `<p class="meta" style="margin-top:10px">${needSign ? 'Sign your agreement above, then you can pay here.' : 'Paid securely through Stripe. Your card details never reach us.'}</p>` : ''}</section>` : ''}
  ${`<section class="sec"><h2 class="h2">${open ? 'We need from you' : 'Your documents'} ${open ? `<span class="muted" style="font-weight:400">${open} to go</span>` : ''}</h2>
  <div class="list${open ? ' need' : ''}">${needs.map(row).join('')}${row(other || { id: 'other', name: 'Anything else', note: 'Other photos or documents you want us to have' })}</div>
  <p class="meta" style="margin-top:10px">Photos or PDFs. We’ll check each one and mark it when it’s good.</p></section>`}
  ${(f.docs || []).length ? `<section class="sec"><h2 class="h2">Your finished documents</h2><div class="list">${f.docs.map((x) => `<div class="li"><span class="bd"><span class="nm" style="font-weight:600">${esc(x.name.replace(/\.pdf$/i, ''))}</span>${f.locked ? '<span class="d">Available once your balance is paid</span>' : ''}</span>${f.locked ? '<span class="tag">Locked</span>' : `<button class="upbtn" type="button" data-doc="${esc(x.id)}">Download</button>`}</div>`).join('')}</div></section>` : ''}
  ${f.kind === 'dv' ? `<section class="sec"><h2 class="h2">What to expect</h2>
  ${f.estimate ? `<p class="meta" style="margin:0">Where we expect it to settle</p><p class="upd" style="font-size:22px;font-weight:600;margin-top:2px">${money(f.estimate.low)}${f.estimate.high ? ' to ' + money(f.estimate.high) : ''}</p>` : ''}
  <p class="upd" style="margin-top:${f.estimate ? '10px' : '0'}">Insurers often start well below the full diminished value, and some offer very little unless there’s real pressure behind the claim. Getting the full amount can mean filing in small claims court against the at-fault driver.${f.nc ? ' In North Carolina, if you and the insurer are far enough apart, either side can demand an appraisal, which can settle it without court.' : ''} That choice is yours, and our appraisal is built to be used there.</p>
  <p class="meta" style="margin-top:8px">General information, not legal advice.</p></section>` : ''}
  ${showOffer && f.offer != null ? `<section class="sec"><h2 class="h2">The insurer’s offer</h2><p class="upd" style="font-size:22px;font-weight:600">${money(f.offer)}</p>
  ${!f.final ? '<p class="meta" style="margin-top:4px">We’re still working with the insurer to get as close to our value as we can.</p>'
    : f.decision ? `<p class="meta ${f.decision.choice === 'accept' ? 'ok' : ''}" style="margin-top:4px">${f.decision.choice === 'accept' ? 'You accepted this offer on ' + esc(f.decision.at) + '.' : 'You chose not to accept this offer on ' + esc(f.decision.at) + '.'} We’ll be in touch about next steps.</p>`
    : `<p class="lead" style="margin-top:6px">This is the insurer’s final offer. We presented our appraisal and pushed for as close to our value as we could, and this is the most they’re willing to pay. Would you like to accept it?</p>
       <div class="stack mt-s"><div class="grid2"><button class="btn ghost" type="button" id="acc">Accept the offer</button><button class="btn ghost" type="button" id="dec">Don’t accept</button></div></div>`}
  ${f.final ? optionsBlock(f) : ''}
  ${f.waived ? '<p class="meta ok" style="margin-top:12px">We waived the $199 second payment.</p>' : ''}</section>` : ''}
  ${steps.length ? `<section class="sec"><h2 class="h2">Progress <span class="muted" style="font-weight:400">${done} of ${steps.length} done</span></h2>
  <ol class="tl">${steps.map((x, i) => `<li class="${x.done ? 'done' : i === cur ? 'now' : 'next'}"><span class="dot">${x.done ? CHECK : ''}</span><div><div class="nm">${esc(x.name)}</div>${x.date || x.note ? `<div class="sub">${esc([x.note, x.date].filter(Boolean).join(', '))}</div>` : ''}</div></li>`).join('')}</ol></section>` : ''}
  ${ups.length ? `<section class="sec"><h2 class="h2">Latest update</h2>${ups.slice(-1).map((u) => `<p class="upd">${esc(u.text)}</p><p class="meta" style="margin-top:6px">${esc(u.date || '')}</p>`).join('')}</section>` : ''}
  ${lettersBlock(f)}
  <section class="sec"><h2 class="h2">Need a hand?</h2>
  ${(f.issues || []).map((x) => `<p class="meta ok" style="margin:0 0 8px">We got your note from ${esc(x.at)}. We’ll email you as soon as it’s sorted out.</p>`).join('')}
  <p class="meta" style="margin:0 0 10px">A question, or something on this page that doesn’t look right? Send us a note and we’ll email you as soon as it’s sorted out.</p>
  <button class="btn ghost sm" type="button" id="iss">Send us a note</button></section>
  <p class="small muted mt">Questions? Email <a href="mailto:customerservice@estimateconsultants.com">customerservice@estimateconsultants.com</a>.</p></div>`);
  $('iss').onclick = () => reportIssue(f, id);
  carPhoto(f);
  app.querySelectorAll('[data-shots]').forEach((b) => { b.onclick = () => photoTool(f, id, b.dataset.shots); });
  app.querySelectorAll('[data-letter]').forEach((b) => { b.onclick = () => openLetter(f, id, b.dataset.letter); });
  app.querySelectorAll('[data-saved]').forEach((b) => { b.onclick = () => getLetter(f, b, b.dataset.saved); });
  $('hm').onclick = (e) => { e.preventDefault(); history.replaceState(null, '', location.pathname); home(); };
  app.querySelectorAll('input[type=file][data-need]').forEach((inp) => { inp.onchange = () => { const list = [...inp.files]; inp.value = ''; if (list.length) uploadAll(f, inp.dataset.need, list); }; });
  app.querySelectorAll('.upbtn').forEach((l) => { l.tabIndex = 0; l.setAttribute('role', 'button'); l.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $(l.htmlFor).click(); } }; });
  app.querySelectorAll('[data-pay]').forEach((b) => { b.onclick = async () => {
    busy(b, true);
    try { const j = await call('p2_pay', { fileId: f.fileId, invId: b.dataset.pay, lang: window.EC_LANG || 'en', embedded: true }); if (j.paid) { S.files = j.files || S.files; snap.save(); return claim(id); }
      if (j.ok && j.clientSecret && j.pk) { busy(b, false); return payHere(j.pk, j.clientSecret); }
      if (!j.ok || !j.url) { busy(b, false); return toast(j.message || 'Payments aren’t available right now.'); } location.href = j.url; }
    catch (e) { busy(b, false); toast('Couldn’t open the payment page. Check your connection and try again.'); }
  }; });
  app.querySelectorAll('[data-doc]').forEach((b) => { b.onclick = async () => {
    const t = b.textContent; b.disabled = true; b.textContent = 'Opening…';
    try { const j = await call('p2_doc', { fileId: f.fileId, docId: b.dataset.doc }); if (!j.ok) return toast(j.message || 'Couldn’t open that document.');
      const bin = atob(j.data), u = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
      const url = URL.createObjectURL(new Blob([u], { type: j.mime })), a = document.createElement('a'); a.href = url; a.download = j.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) { toast('Couldn’t open that document. Check your connection and try again.'); } finally { b.disabled = false; b.textContent = t; }
  }; });
  const decide = async (choice) => {
    const ok = await askChoice(choice === 'accept' ? 'Accept ' + money(f.offer) + '?' : 'Don’t accept ' + money(f.offer) + '?', choice === 'accept' ? 'We’ll note your choice and follow up with the next steps.' : 'We’ll get in touch about what you can do next.', choice === 'accept' ? 'Yes, accept it' : 'Yes, don’t accept');
    if (!ok) return;
    try { const r = await call('p2_decide', { fileId: f.fileId, choice }); if (!r.ok) return toast(r.message || 'Couldn’t save your choice.'); S.files = r.files || S.files; snap.save(); toast('Thanks. We got your choice.'); claim(id); }
    catch (err) { toast('Couldn’t save your choice. Check your connection and try again.'); }
  };
  if ($('acc')) $('acc').onclick = () => decide('accept');
  if ($('dec')) $('dec').onclick = () => decide('decline');
}

// ---------- claim header: a photo of the same model (not their car), with the vehicle name over it ----------
function vehParts(v) { const w = String(v || '').split(/\s+/); return { top: w.slice(0, 3).join(' '), rest: w.slice(3).join(' ').replace(/^[-\s]+/, '') }; }
function heroHtml(f) {
  const v = vehParts(f.vehicle);
  return `<div class="hero" id="hero"><div class="ph" id="ph"></div>
    <svg class="arcs" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="none" stroke="currentColor"><path d="M40 210a160 160 0 0 1 320 0" stroke-width="1"/><path d="M80 210a120 120 0 0 1 240 0" stroke-width="1"/><path d="M120 210a80 80 0 0 1 160 0" stroke-width="1"/></g></svg>
    <div class="hcap"><p class="meta">${esc(shortType(f.type))}, file ${esc(f.fileId)}</p><h1 class="plate">${esc(v.top)}</h1>${v.rest ? `<p class="meta trim">${esc(v.rest)}</p>` : ''}</div>
    <a class="credit" id="phc" hidden target="_blank" rel="noopener"></a></div>`;
}
async function carPhoto(f) {
  const v = vehParts(f.vehicle).top, key = 'ec_ph_' + v.toLowerCase(); if (!v) return;
  let hit = null; try { hit = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
  if (!hit) {
    try {
      const q = encodeURIComponent(v.replace(/^\d{4}\s+/, '') + ' ' + (v.match(/^\d{4}/) || [''])[0]);
      const j = await fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=3&gsrsearch=' + q + '&prop=pageimages&piprop=thumbnail&pithumbsize=1000').then((r) => r.json());
      const pages = Object.values((j.query || {}).pages || {}).sort((a, b) => a.index - b.index).filter((p) => p.thumbnail && p.thumbnail.width >= p.thumbnail.height);
      if (pages[0]) hit = { src: pages[0].thumbnail.source, title: pages[0].title };
      try { localStorage.setItem(key, JSON.stringify(hit || { none: 1 })); } catch (e) {}
    } catch (e) { return; }
  }
  if (!hit || !hit.src) return;
  const img = new Image(); img.onload = () => { const ph = $('ph'); if (!ph) return; ph.style.backgroundImage = 'url("' + hit.src + '")'; ph.classList.add('on'); $('hero').classList.add('hasph');
    const c = $('phc'); if (c) { c.hidden = false; c.href = 'https://en.wikipedia.org/wiki/' + encodeURIComponent(hit.title.replace(/ /g, '_')); c.textContent = 'Photo of a similar vehicle: Wikipedia'; } };
  img.src = hit.src;
}
// ---------- "Setting up your claim": the gauge fills as a progress meter ----------
function setupProgress() {
  const steps = [[0, 'Checking your details'], [10, 'Creating your claim file'], [30, 'Preparing your agreement'], [55, 'Setting up your payment'], [75, 'Getting your checklist ready'], [90, 'Almost done']];
  app.innerHTML = `<div class="loadr setupg" id="sg" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Setting up your claim">
    <svg width="200" height="130" viewBox="0 0 64 42" aria-hidden="true"><path d="M8 38a24 24 0 0 1 48 0" fill="none" stroke="#25302b" stroke-width="5" stroke-linecap="round"/>
    <path id="sgA" d="M8 38a24 24 0 0 1 48 0" fill="none" stroke="#7fd69a" stroke-width="5" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>
    <g id="sgN" style="transform-origin:32px 38px;transform:rotate(-90deg)"><path d="M32 38 32 19" stroke="#eef2ef" stroke-width="2.6" stroke-linecap="round"/></g><circle cx="32" cy="38" r="3.6" fill="#eef2ef"/></svg>
    <div class="pct"><b id="sgP">0</b><span>%</span></div><p id="sgT">${esc(steps[0][1])}</p></div>`;
  let p = 0, fin = false, raf = 0, last = '', t0 = performance.now(), tf = 0, pf = 0, resolveDone = null;
  const draw = (v) => { const a = $('sgA'), n = $('sgN'), b = $('sgP'), t = $('sgT'), g = $('sg'); if (!a) return;
    a.setAttribute('stroke-dashoffset', String(100 - v)); n.style.transform = 'rotate(' + (-90 + 1.8 * v) + 'deg)'; b.textContent = Math.round(v); g.setAttribute('aria-valuenow', String(Math.round(v)));
    const s = steps.filter((x) => v >= x[0]).pop()[1]; if (s !== last) { last = s; t.textContent = v >= 100 ? 'Done' : s; } };
  const tick = (now) => {
    if (!fin) p = 93 * (1 - Math.exp(-(now - t0) / 15000));                // eases toward 93% while the server works
    else { const k = Math.min(1, (now - tf) / 650); p = pf + (100 - pf) * (1 - Math.pow(1 - k, 3)); if (k >= 1) { draw(100); setTimeout(resolveDone, 250); return; } }
    draw(p); raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return { done: () => new Promise((res) => { fin = true; tf = performance.now(); pf = p; resolveDone = res; }), stop: () => cancelAnimationFrame(raf) };
}
// ---------- vehicle photos: one guided shot at a time ----------
const SHOT_ICON = { corner: '<path d="M6 30h52M12 30l5-11h26l9 11M17 30a4 4 0 1 0 8 0M41 30a4 4 0 1 0 8 0"/><path d="M44 12l8-6M52 6v6h-6"/>', side: '<path d="M4 32h56M8 32l6-12h30l10 12M14 32a4 4 0 1 0 8 0M42 32a4 4 0 1 0 8 0"/>',
  odo: '<circle cx="32" cy="24" r="16"/><path d="M32 24l9-7"/><path d="M24 34h16"/>', vin: '<rect x="10" y="12" width="44" height="24" rx="3"/><path d="M16 20h32M16 28h20"/>', seat: '<path d="M22 8h14l-2 22H24zM18 30h28v8H18z"/>', close: '<circle cx="28" cy="22" r="12"/><path d="M37 31l12 12"/>', tire: '<circle cx="32" cy="24" r="16"/><circle cx="32" cy="24" r="6"/>' };
// Same shots, names and order as the Vehicle Photo Guide; each tile shows the guide's example photo.
const SHOTS = {
  rf: ['Right front corner', 'rf', 'Passenger side, front. Stand back so the whole vehicle is in the photo.'], lf: ['Left front corner', 'lf', 'Driver side, front. Whole vehicle in the photo.'],
  rr: ['Right rear corner', 'rr', 'Passenger side, back. Whole vehicle in the photo.'], lr: ['Left rear corner', 'lr', 'Driver side, back. Whole vehicle in the photo.'],
  vin: ['VIN', 'vind', 'The sticker in the driver door jamb, or the plate through the windshield.'], odo: ['Odometer with mileage', 'odo', 'Turn the car on so the mileage shows. No need to start the engine.'],
  eng: ['Engine bay', 'eng', 'Hood open, the whole engine bay.'], ia: ['Interior from the driver door', 'ia', 'All four doors open.'], ib: ['Interior from the passenger door', 'ib', 'Front seats and dash.'],
  ic: ['Interior from the left rear door', 'ic', 'Back seats.'], id: ['Interior from the right rear door', 'id', 'Back seats.'],
  dmg: ['Damage or wear close-up', '', 'Scratches, dents, chips, stains, tears. Up close, in good light. Add as many as you need.'],
  mr: ['Right side', '', 'The whole bike from the right, on its stand. Stand back so both wheels are in the photo.'], ml: ['Left side', '', 'The whole bike from the left.'],
  mf: ['Front', '', 'Straight on from the front, with the headlight and forks.'], mb: ['Rear', '', 'Straight on from the back, with the plate.'],
  mvin: ['VIN', '', 'Stamped on the frame by the steering head (turn the bars to see it), or on the frame sticker.'], modo: ['Gauges with mileage', '', 'Key on so the mileage shows. No need to start it.'],
  meng: ['Engine', '', 'The engine from the side with the most detail.'], mfork: ['Forks and front wheel', '', 'Close enough to see the fork tubes and the wheel.'],
  mods: ['Added parts', '', 'Exhaust, seat, bags, audio, wheels, lights. One photo each, plus any receipts. Add as many as you need.']
};
// Motorcycles get their own photo list: from the make or model, or the switch in the photo sheet (remembered on this device).
const BIKE_MAKES = /\b(harley|indian|ducati|triumph|ktm|aprilia|mv agusta|moto guzzi|royal enfield|zero|husqvarna|vespa|piaggio|victory|buell|can-am|ural|benelli|cfmoto|kymco|sym|bimota|norton)\b/i;
const BIKE_MODELS = /\b(glide|softail|sportster|road king|gold ?wing|ninja|vulcan|shadow|rebel|cbr\d*[a-z]*|cb\d+[a-z]*|crf\d*[a-z]*|gsx[-\w]*|v-strom|hayabusa|boulevard|yzf[-\w]*|mt-\d+|xsr\d*|tenere|v star|r \d{3,4}|k 1600|s 1000|g 310|africa twin|grom|z\d{3}|versys|klr\d*|scout|chief|chieftain|tri glide|freewheeler|ryker)\b/i;
function isBike(f) { let o = null; try { o = localStorage.getItem('ec_bike_' + f.fileId); } catch (e) {} if (o === '1') return true; if (o === '0') return false; const d = String(f.vehicle || ''); return BIKE_MAKES.test(d) || BIKE_MODELS.test(d); }
function isShotNeed(x) { return x.id === 'photos' || /^vehicle photos$/i.test(x.name || ''); }
function shotsFor(f, x) { const hasOdo = (f.needs || []).some((n) => n.id === 'odo');
  if (isBike(f)) return ['mr', 'ml', 'mf', 'mb', 'mvin'].concat(hasOdo ? [] : ['modo'], ['meng', 'mfork', 'mods', 'dmg']);
  return ['rf', 'lf', 'rr', 'lr', 'vin'].concat(hasOdo ? [] : ['odo'], ['eng', 'ia', 'ib', 'ic', 'id', 'dmg']); }
function shotDone(x, k) { const nm = SHOTS[k][0].toLowerCase(); return (x.files || []).some((y) => String(y.name || '').toLowerCase().indexOf(nm) === 0); }
function photoTool(f, id, needId) {
  const x = (f.needs || []).find((n) => n.id === needId); if (!x) return; const keys = shotsFor(f, x), local = {};
  const m = document.createElement('div'); m.className = 'shotsheet'; document.body.appendChild(m); document.body.style.overflow = 'hidden';
  const close = () => { m.remove(); document.body.style.overflow = ''; claim(id); };
  const draw = () => {
    const done = keys.filter((k) => shotDone(x, k) || local[k] === 'ok').length;
    m.innerHTML = `<div class="shotbar"><button class="link" type="button" id="shx">Done</button><b>Vehicle photos</b><span class="muted">${done} of ${keys.length}</span></div>
      <div class="shotprog"><i style="width:${Math.round(done / keys.length * 100)}%"></i></div>
      <p class="meta shothint">Tap each one to take it. Daylight, level ground, the whole vehicle in frame, and no people in the photos.</p>
      <div class="shots">${keys.map((k) => { const s = SHOTS[k], st = local[k] || (shotDone(x, k) ? 'ok' : '');
        const pic = local['t_' + k] ? `<img src="${local['t_' + k]}" alt="">` : s[1] ? `<img class="ex" src="/guide/${s[1]}.webp" alt="" loading="lazy"><em>Example</em>` : `<span class="nopic"><svg viewBox="0 0 64 44" width="56" height="40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${SHOT_ICON.close}</svg></span>`;
        return `<label class="shot ${st}" for="sh_${k}"><span class="pic">${pic}${st === 'ok' ? '<span class="si"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#0d1a12" stroke-width="3"><path d="M5 12l5 5 9-10"/></svg></span>' : st === 'up' ? '<span class="si up"><span class="sp"></span></span>' : ''}</span>
          <span class="sn">${esc(s[0])}</span><span class="sd">${st === 'warn' ? esc(local['w_' + k]) + ' Tap to retake.' : esc(s[2])}</span>
          <input type="file" id="sh_${k}" data-k="${k}" accept="image/*" capture="environment" ${k === 'dmg' || k === 'mods' ? 'multiple' : ''} hidden></label>`; }).join('')}</div>
      <div class="shotfoot"><label class="btn ghost" for="shlib">Choose from your photos instead</label><input type="file" id="shlib" accept="image/*" multiple hidden>
      <button class="link mt-s" type="button" id="shkind">${isBike(f) ? 'Not a motorcycle? Show the car photo list' : 'Is it a motorcycle? Show the motorcycle photo list'}</button></div>`;
    $('shx').onclick = close;
    $('shkind').onclick = () => { try { localStorage.setItem('ec_bike_' + f.fileId, isBike(f) ? '0' : '1'); } catch (e) {} m.remove(); document.body.style.overflow = ''; photoTool(f, id, needId); };
    m.querySelectorAll('input[data-k]').forEach((inp) => { inp.onchange = () => { const l = [...inp.files]; inp.value = ''; l.forEach((file, i) => sendShot(inp.dataset.k, file, i)); }; });
    $('shlib').onchange = () => { const l = [...$('shlib').files]; $('shlib').value = ''; const open = keys.filter((k) => !(shotDone(x, k) || local[k] === 'ok' || local[k] === 'up')); l.forEach((file, i) => sendShot(open[i] || 'dmg', file, i)); };
  };
  const sendShot = async (k, file, n) => {
    local[k] = 'up'; try { local['t_' + k] = URL.createObjectURL(file); } catch (e) {} draw();
    try {
      const url = URL.createObjectURL(file), img = await loadImg(url); const why = photoCheck(img);
      const data = shrink(img), hash = await sha256(Uint8Array.from(atob(data.slice(0, 4000)), (c) => c.charCodeAt(0)).buffer);
      const name = SHOTS[k][0] + (n ? ' ' + (n + 1) : '') + '.jpg';
      const j = await call('p2_upload', { fileId: f.fileId, need: needId, name, mime: 'image/jpeg', data, hash: hash + k + n });
      if (!j.ok && !j.dup) throw new Error(j.message || 'Couldn’t send it.');
      if (j.files) { S.files = j.files; snap.save(); const nf = S.files.find((y) => y.fileId === f.fileId); const nx = nf && (nf.needs || []).find((y) => y.id === needId); if (nx) x.files = nx.files; }
      if (why) { local[k] = 'warn'; local['w_' + k] = why; } else local[k] = 'ok';
    } catch (e) { local[k] = 'warn'; local['w_' + k] = 'Didn’t send.'; }
    draw();
  };
  draw();
}

// ---------- uploads: photo check, shrink, duplicate catch ----------
function readAs(file, how) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r[how](file); }); }
async function sha256(buf) {
  try { const h = await crypto.subtle.digest('SHA-256', buf); return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join(''); }
  catch (e) { const u = new Uint8Array(buf); let h1 = 0x811c9dc5, h2 = 0x01000193; for (let i = 0; i < u.length; i++) { h1 = Math.imul(h1 ^ u[i], 16777619) >>> 0; h2 = Math.imul(h2 ^ u[i], 2246822519) >>> 0; } return 'f' + h1.toString(16) + h2.toString(16) + u.length.toString(16); }
}
function loadImg(url) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; }); }
// Dark, blurry or tiny photos get a second look before they're sent.
function photoCheck(img) {
  const w = 360, h = Math.max(1, Math.round(img.naturalHeight * w / img.naturalWidth)), c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h); const px = g.getImageData(0, 0, w, h).data, gray = new Float32Array(w * h);
  let sum = 0; for (let i = 0; i < w * h; i++) { const v = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]; gray[i] = v; sum += v; }
  let n = 0, m = 0, m2 = 0; for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x, l = gray[i - 1] + gray[i + 1] + gray[i - w] + gray[i + w] - 4 * gray[i]; n++; m += l; m2 += l * l; }
  const varL = n ? m2 / n - (m / n) * (m / n) : 999, mean = sum / (w * h);
  if (Math.min(img.naturalWidth, img.naturalHeight) < 600) return 'This photo is very small, so details may not show.';
  if (mean < 40) return 'This photo looks too dark to read.';
  if (varL < 20) return 'This photo looks blurry.';
  return '';
}
function shrink(img) { const max = 2000, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.85).split(',')[1]; }
// What a client can usually do if they don't accept (by the accident state), and a nudge to talk with an attorney.
const OPTS = {
  NC: ['Demand an appraisal, if fault isn’t in dispute and you’re more than $2,000 apart (or 25% of the car’s value, if that’s less). N.C. Gen. Stat. § 20-279.21(d1).', 'File in small claims court for up to $10,000.'],
  SC: ['File in magistrate court for up to $7,500.', 'Ask about South Carolina’s property damage arbitration.'],
  GA: ['Send a written settlement demand by certified mail. Under O.C.G.A. § 33-4-7, if the insurer doesn’t pay within 60 days and you later recover at least that amount, it can owe a penalty and attorney’s fees.', 'File in magistrate court for up to $15,000.'],
  VA: ['File in the small claims division of general district court for up to $5,000.'],
  TN: ['File in general sessions court, which handles civil cases up to $25,000.'],
  FL: ['File in small claims court for up to $8,000.'],
  TX: ['File in justice court for up to $20,000.']
};
function optionsBlock(f) {
  const c = String(f.acc || '').toUpperCase(), stt = STATES[c], list = (OPTS[c] || ['File in small claims court against the at-fault driver. Your state court’s website lists the limit.']).slice();
  if (stt) list.push('You generally have ' + stt.dl + ' years from the accident to file suit.');
  return `<div class="note mt"><p style="margin:0 0 8px;color:#fff;font-weight:600">If you don’t accept${stt ? ', your usual options in ' + esc(stt.n) + ' are' : ', your usual options are'}:</p><ul style="margin:0;padding-left:18px">${list.map((x) => `<li style="margin:4px 0">${esc(x)}</li>`).join('')}</ul>
  <p style="margin:10px 0 0">We recommend talking with an attorney before you decide. Many offer a free first consultation. Our appraisal can be used in any of these.</p><p class="meta" style="margin:8px 0 0">General information, not legal advice.</p></div>`;
}
// Who we speak to the insurer for (full service, NC appraisal, total loss); self-service clients handle the insurer themselves.
function FULLSVC(f) { return !/self[- ]service/i.test(f.type || '') && (f.kind === 'dv' || f.kind === 'tl'); }
// Stripe's payment form right on the page.
function loadStripe() { return window.Stripe ? Promise.resolve() : new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://js.stripe.com/v3/'; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
async function payHere(pk, secret) {
  const m = document.createElement('div'); m.className = 'sheet paysheet';
  m.innerHTML = '<div class="sheetbox" role="dialog" aria-modal="true" aria-label="Payment"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h2 class="h2" style="margin:0">Payment</h2><button class="link" type="button" id="pclose">Close</button></div><div id="pform"><div class="boot" style="padding:40px 0"><span class="sp"></span></div></div><p class="meta" style="margin-top:10px">Paid securely through Stripe. Your card details never reach us.</p></div>';
  document.body.appendChild(m);
  let co = null; $('pclose').onclick = () => { try { co && co.destroy(); } catch (e) {} m.remove(); };
  try { await loadStripe(); const stripe = window.Stripe(pk); co = await stripe.initEmbeddedCheckout({ fetchClientSecret: async () => secret }); $('pform').innerHTML = ''; co.mount('#pform'); }
  catch (e) { m.remove(); toast('Couldn’t load the payment form. Check your connection and try again.'); }
}
function askChoice(title, text, yes) {
  return new Promise((res) => {
    const m = document.createElement('div'); m.className = 'sheet';
    m.innerHTML = `<div class="sheetbox" role="dialog" aria-modal="true"><h2 class="h2">${esc(title)}</h2><p class="meta" style="margin:0 0 16px">${esc(text)}</p><div class="stack"><button class="btn ghost" type="button" data-a="1">${esc(yes)}</button><button class="btn ghost" type="button" data-a="0">Go back</button></div></div>`;
    document.body.appendChild(m); m.querySelectorAll('button').forEach((b) => { b.onclick = () => { m.remove(); res(b.dataset.a === '1'); }; }); m.querySelector('button').focus();
  });
}
// ---------- letters the client can fill in, print, email to themselves or save on the claim ----------
const LT = (f) => f.letter || {};
const fmt$ = (n) => { const v = Number(String(n || '').replace(/[^\d.]/g, '')); return v ? '$' + v.toLocaleString('en-US', { maximumFractionDigits: 2 }) : ''; };
const todayStr = () => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const SELF = (f) => /self[- ]service/i.test(f.type || '');
const LETTERS = {
  demand: {
    title: 'Diminished value demand letter', sub: 'To the at-fault driver’s insurer, asking them to pay your diminished value.',
    when: (f) => f.kind === 'dv' && SELF(f),
    fields: (f) => [['carrier', 'Insurance company', LT(f).carrier], ['adj', 'Adjuster’s name', LT(f).adj], ['claim', 'Claim number', LT(f).claim], ['atFault', 'Their insured (the at-fault driver)', LT(f).atFault],
      ['dol', 'Date of the accident', LT(f).dol], ['vin', 'VIN', LT(f).vin], ['amount', 'Diminished value from your appraisal', fmt$(LT(f).dv)], ['days', 'Days to respond', '30'],
      ['name', 'Your name', LT(f).name || (S.account || {}).name], ['address', 'Your mailing address', String(LT(f).address || '').replace(/\s*\n\s*/g, ', ')], ['phone', 'Your phone', fmtPhone((S.account || {}).phone || '')], ['email', 'Your email', (S.account || {}).email]],
    body: (v, f) => [todayStr(), [v.carrier, v.adj ? 'Attn: ' + v.adj : ''].filter(Boolean).join('\n'),
      ['Re: Diminished value claim', v.claim ? 'Claim number: ' + v.claim : '', v.atFault ? 'Your insured: ' + v.atFault : '', v.dol ? 'Date of loss: ' + v.dol : '', 'Vehicle: ' + [f.vehicle, v.vin ? 'VIN ' + v.vin : ''].filter(Boolean).join(', ')].filter(Boolean).join('\n'),
      'Dear ' + (v.adj || 'Claims Adjuster') + ',',
      'I am making a claim for the diminished value of my vehicle, which was damaged in the accident on ' + (v.dol || '[date]') + ' caused by your insured. Even after proper repairs, a vehicle with an accident on its history sells for less than the same vehicle without one.',
      'An independent appraisal from Estimate Consultants puts the diminished value of my vehicle at ' + (v.amount || '[amount]') + '. A copy of the appraisal is enclosed.',
      'Please pay ' + (v.amount || '[amount]') + ' for the diminished value of my vehicle. I ask for a written response within ' + (v.days || '30') + ' days of the date of this letter. If you disagree with the amount, please explain in writing how you reached your figure and send me any appraisal or valuation you relied on.',
      'You can reach me at ' + [v.phone, v.email].filter(Boolean).join(' or ') + '.',
      'Sincerely,\n\n\n' + (v.name || '') + (v.address ? '\n' + v.address : '')]
  },
  followup: {
    title: 'Follow-up letter', sub: 'If the insurer hasn’t answered your demand.',
    when: (f) => f.kind === 'dv' && SELF(f),
    fields: (f) => [['carrier', 'Insurance company', LT(f).carrier], ['adj', 'Adjuster’s name', LT(f).adj], ['claim', 'Claim number', LT(f).claim], ['sent', 'Date you sent your demand', ''],
      ['amount', 'Amount you asked for', fmt$(LT(f).dv)], ['days', 'Days to respond', '14'], ['name', 'Your name', LT(f).name || (S.account || {}).name], ['phone', 'Your phone', fmtPhone((S.account || {}).phone || '')], ['email', 'Your email', (S.account || {}).email]],
    body: (v, f) => [todayStr(), [v.carrier, v.adj ? 'Attn: ' + v.adj : ''].filter(Boolean).join('\n'),
      ['Re: Diminished value claim, follow-up', v.claim ? 'Claim number: ' + v.claim : '', 'Vehicle: ' + f.vehicle].filter(Boolean).join('\n'),
      'Dear ' + (v.adj || 'Claims Adjuster') + ',',
      'On ' + (v.sent || '[date]') + ', I sent you a demand for ' + (v.amount || '[amount]') + ' for the diminished value of my vehicle, along with an independent appraisal. I have not received a response.',
      'Please respond in writing within ' + (v.days || '14') + ' days of the date of this letter, either with payment or with an explanation of your position and any valuation you relied on.',
      'You can reach me at ' + [v.phone, v.email].filter(Boolean).join(' or ') + '.',
      'Sincerely,\n\n\n' + (v.name || '')]
  },
  smallclaims: {
    title: 'Small claims prep sheet', sub: 'What to gather and know before filing. Print it and fill in the blanks.', sheet: true,
    when: (f) => f.kind === 'dv' && (SELF(f) || (f.decision && f.decision.choice === 'decline')),
    fields: (f) => [['atFault', 'The at-fault driver (who you’d file against)', LT(f).atFault], ['carrier', 'Their insurance company', LT(f).carrier], ['claim', 'Claim number', LT(f).claim],
      ['dol', 'Date of the accident', LT(f).dol], ['amount', 'Diminished value from your appraisal', fmt$(LT(f).dv)], ['offer', 'The insurer’s last offer', f.offer != null ? fmt$(f.offer) : '']],
    body: (v, f) => {
      const c = String(f.acc || '').toUpperCase(), st = STATES[c], opts = (OPTS[c] || []).filter((x) => /court/i.test(x));
      return [
        ['Your claim', 'Vehicle: ' + f.vehicle, 'Date of the accident: ' + (v.dol || '________'), 'Claim number: ' + (v.claim || '________'), 'Their insurer: ' + (v.carrier || '________'),
          'Your appraisal: ' + (v.amount || '________') + '     Their last offer: ' + (v.offer || '________')].join('\n'),
        ['Who you file against', 'In most states you file against the at-fault driver, not their insurance company: ' + (v.atFault || '________') + '. Their insurer usually handles the defense.'].join('\n'),
        ['Where and how much', (opts.length ? opts.join(' ') : 'File in small claims court in the county where the accident happened or where the driver lives. Your state court’s website lists the limit and filing fee.'),
          st ? 'You generally have ' + st.dl + ' years from the accident to file in ' + st.n + '.' : '', 'Filing fee: ________     Court: ________________'].filter(Boolean).join('\n'),
        ['What to bring (three copies of each: the judge, the other side, you)', '☐ Your diminished value appraisal', '☐ The final repair invoice', '☐ Photos of the damage and the repaired car',
          '☐ The police or accident report', '☐ Your demand letter and anything the insurer sent back', '☐ Proof of the insurer’s offers (letters or emails)', '☐ Proof the other driver was at fault (report, photos, witness names)'].join('\n'),
        ['Timeline', 'Accident: ____________', 'Repairs done: ____________', 'Demand sent: ____________', 'Insurer’s answer: ____________', 'Filed: ____________', 'Hearing: ____________'].join('\n'),
        'Notes\n\n\n\n'];
    }
  }
};
function lettersBlock(f) {
  const avail = Object.keys(LETTERS).filter((k) => LETTERS[k].when(f)), saved = f.letters || [];
  if (!avail.length && !saved.length) return '';
  return `<section class="sec"><h2 class="h2">Letters and forms</h2><p class="meta" style="margin:0 0 10px">Fill these in with your details. Then print them, email them to yourself, or save them here.</p>
  <div class="list">${avail.map((k) => `<div class="li"><span class="bd"><span class="nm" style="font-weight:600">${esc(LETTERS[k].title)}</span><span class="d">${esc(LETTERS[k].sub)}</span></span><button class="btn ghost sm" type="button" data-letter="${k}">Fill in</button></div>`).join('')}
  ${saved.map((x) => `<div class="li"><span class="bd"><span class="nm" style="font-weight:600">${esc(x.name)}</span><span class="d">Saved ${esc(x.at)}</span></span><button class="btn ghost sm" type="button" data-saved="${esc(x.id)}">Download</button></div>`).join('')}</div>
  <p class="meta" style="margin-top:8px">General information, not legal advice.</p></section>`;
}
function letterHtml(title, parts, sheet) {
  const p = (t) => esc(t).replace(/\n/g, '<br>');
  const body = sheet ? parts.map((t) => { const [h, ...r] = t.split('\n'); return `<h2>${esc(h)}</h2><p>${p(r.join('\n'))}</p>`; }).join('') : parts.map((t) => `<p>${p(t)}</p>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page{margin:.9in}body{font:11.5pt/1.55 Georgia,'Times New Roman',serif;color:#111;margin:0}h1{font:700 16pt Arial,Helvetica,sans-serif;margin:0 0 4px}h2{font:700 11pt Arial,Helvetica,sans-serif;margin:18px 0 4px}p{margin:0 0 12px}.ft{margin-top:28px;padding-top:8px;border-top:1px solid #ccc;font:8.5pt Arial,Helvetica,sans-serif;color:#666}</style></head><body>${sheet ? `<h1>${esc(title)}</h1>` : ''}${body}<div class="ft">Prepared with Estimate Consultants, estimateconsultants.com${sheet ? '. General information, not legal advice.' : ''}</div></body></html>`;
}
function openLetter(f, id, key) {
  const L = LETTERS[key], flds = L.fields(f), m = document.createElement('div'); m.className = 'sheet paysheet';
  m.innerHTML = `<div class="sheetbox" role="dialog" aria-modal="true" aria-labelledby="ltt"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:12px"><h2 class="h2" id="ltt" style="margin:0">${esc(L.title)}</h2><button class="link" type="button" id="ltx">Close</button></div>
    <div id="ltf" class="stack">${flds.map(([k, lab, val]) => `<div><label class="f" for="lf_${k}">${esc(lab)}</label><input class="in" id="lf_${k}" value="${esc(val || '')}"></div>`).join('')}
    <button class="btn red" type="button" id="ltp">See the ${L.sheet ? 'sheet' : 'letter'}</button></div>
    <div id="ltv" hidden><p class="meta" style="margin:0 0 8px">You can change any of the wording below before you print or save.</p><textarea class="in" id="ltt2" rows="16" style="height:auto;padding:14px 16px;line-height:1.5;resize:vertical;font-size:15px"></textarea>
    <div class="stack mt-s"><button class="btn red" type="button" id="ltpr">Print</button><div class="grid2"><button class="btn ghost" type="button" id="ltem">Email it to me</button><button class="btn ghost" type="button" id="ltsv">Save to my claim</button></div><button class="link" type="button" id="ltbk" style="justify-self:start">Back to the details</button></div></div></div>`;
  document.body.appendChild(m);
  const close = () => m.remove(); $('ltx').onclick = close;
  const vals = () => Object.fromEntries(flds.map(([k]) => [k, $('lf_' + k).value.trim()]));
  const parts = () => $('ltt2').value.split(/\n{2,}(?=\S)/).map((x) => x.replace(/\s+$/, ''));
  const step = (two) => { $('ltf').style.display = two ? 'none' : ''; $('ltv').hidden = !two; m.querySelector('.sheetbox').scrollTop = 0; };
  $('ltp').onclick = () => { $('ltt2').value = L.body(vals(), f).join('\n\n'); step(true); };
  $('ltbk').onclick = () => step(false);
  $('ltpr').onclick = () => {
    const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(fr);
    fr.contentDocument.open(); fr.contentDocument.write(letterHtml(L.title, parts(), L.sheet)); fr.contentDocument.close();
    setTimeout(() => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { toast('Couldn’t open printing on this device. Try Email it to me.'); } setTimeout(() => fr.remove(), 60000); }, 300);
  };
  const save = async (b, send) => {
    busy(b, true);
    try { const r = await call('p2_letter', { fileId: f.fileId, kind: key, title: L.title, parts: parts(), sheet: !!L.sheet, send });
      busy(b, false); if (!r.ok) return toast(r.message || 'Couldn’t save it.');
      S.files = r.files || S.files; snap.save(); close(); toast(send ? 'Sent to ' + ((S.account || {}).email || 'your email') + '. It’s saved on your claim too.' : 'Saved to your claim.'); claim(id); }
    catch (e) { busy(b, false); toast('Couldn’t save it. Check your connection and try again.'); }
  };
  $('ltem').onclick = () => save($('ltem'), true); $('ltsv').onclick = () => save($('ltsv'), false);
}
async function getLetter(f, b, lid) {
  const t = b.textContent; b.disabled = true; b.textContent = 'Opening…';
  try { const j = await call('p2_letter_get', { fileId: f.fileId, id: lid }); if (!j.ok) return toast(j.message || 'Couldn’t open it.');
    const bin = atob(j.data), u = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
    const url = URL.createObjectURL(new Blob([u], { type: 'application/pdf' })), a = document.createElement('a'); a.href = url; a.download = j.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch (e) { toast('Couldn’t open it. Check your connection and try again.'); } finally { b.disabled = false; b.textContent = t; }
}
// "Something not right?": the client's note goes on the file and flags it for Kevin until he marks it handled.
function reportIssue(f, id) {
  const m = document.createElement('div'); m.className = 'sheet';
  m.innerHTML = `<div class="sheetbox" role="dialog" aria-modal="true" aria-labelledby="isst"><h2 class="h2" id="isst">Send us a note</h2><p class="meta" style="margin:0 0 12px">A sentence or two is fine. We’ll email you as soon as it’s sorted out.</p>
    <label class="f" for="istx" style="position:absolute;left:-9999px">Your message</label><textarea class="in" id="istx" rows="5" maxlength="2000" style="height:auto;padding:14px 16px;line-height:1.5;resize:vertical"></textarea>
    <div class="stack mt-s"><button class="btn red" type="button" id="issgo">Send</button><button class="btn ghost" type="button" id="issno">Cancel</button></div></div>`;
  document.body.appendChild(m); $('istx').focus();
  $('issno').onclick = () => m.remove();
  $('issgo').onclick = async () => {
    const text = $('istx').value.trim(); if (text.length < 3) { $('istx').focus(); return toast('Add a sentence or two first.'); }
    const b = $('issgo'); busy(b, true);
    try { const r = await call('p2_issue', { fileId: f.fileId, text }); if (!r.ok) { busy(b, false); return toast(r.message || 'Couldn’t send your message.'); }
      S.files = r.files || S.files; snap.save(); m.remove(); toast('Sent. We’ll email you as soon as it’s sorted out.'); claim(id); }
    catch (e) { busy(b, false); toast('Couldn’t send your message. Check your connection and try again.'); }
  };
}
function askPhoto(name, why) {
  return new Promise((res) => {
    const m = document.createElement('div'); m.className = 'sheet';
    m.innerHTML = `<div class="sheetbox" role="dialog" aria-modal="true"><h2 class="h2">${esc(why)}</h2><p class="meta" style="margin:0 0 16px">${esc(name)}. A clear photo helps us get your appraisal right the first time.</p><div class="stack"><button class="btn red" type="button" data-a="0">Choose another photo</button><button class="btn ghost" type="button" data-a="1">Send it anyway</button></div></div>`;
    document.body.appendChild(m); m.querySelectorAll('button').forEach((b) => { b.onclick = () => { m.remove(); res(b.dataset.a === '1'); }; }); m.querySelector('button').focus();
  });
}
async function uploadAll(f, needId, list) {
  const known = new Set([].concat(...(f.needs || []).map((n) => (n.files || []).map((x) => x.h))).filter(Boolean));
  const st = () => document.querySelector('#n_' + CSS.escape(needId) + ' .upst');
  let sent = 0, skipped = 0;
  for (let k = 0; k < list.length; k++) {
    const file = list[k], s = st(); if (s) { s.hidden = false; s.innerHTML = '<span class="sp" style="width:14px;height:14px;border-width:2px;vertical-align:-2px"></span> Sending ' + (k + 1) + ' of ' + list.length + '…'; }
    try {
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      if (!isPdf && !/^image\//.test(file.type)) { toast(file.name + ': please use a photo or a PDF.'); skipped++; continue; }
      if (file.size > 20 * 1048576) { toast(file.name + ' is over 20 MB.'); skipped++; continue; }
      const buf = await readAs(file, 'readAsArrayBuffer'), hash = await sha256(buf);
      if (hash && known.has(hash)) { toast('You already sent ' + file.name + '.'); skipped++; continue; }
      let data, mime;
      if (isPdf) { data = (await readAs(file, 'readAsDataURL')).split(',')[1]; mime = 'application/pdf'; }
      else {
        const url = URL.createObjectURL(file); let img; try { img = await loadImg(url); } catch (e) { toast('We couldn’t open ' + file.name + '. Try a JPG or PNG.'); skipped++; continue; } finally { setTimeout(() => URL.revokeObjectURL(url), 2000); }
        const why = photoCheck(img); if (why && !(await askPhoto(file.name, why))) { skipped++; continue; }
        data = shrink(img); mime = 'image/jpeg';
      }
      const j = await call('p2_upload', { fileId: f.fileId, need: needId, name: file.name, mime, data, hash });
      if (!j.ok) { toast(j.message || 'Couldn’t send ' + file.name + '.'); skipped++; continue; }
      if (hash) known.add(hash); S.files = j.files || S.files; sent++;
    } catch (e) { toast('Couldn’t send ' + file.name + '. Check your connection and try again.'); skipped++; }
  }
  snap.save(); claim(f.fileId); if (sent) toast(sent === 1 ? 'Sent. We’ll check it and mark it when it’s good.' : sent + ' files sent. We’ll check them and mark them when they’re good.', 5000);
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
  const paidF = Q.get('paid'), paidI = Q.get('inv');
  if (paidF && paidI) {
    loading('Confirming your payment');
    try { const j = await call('p2_pay_check', { fileId: paidF, invId: paidI, s: Q.get('s') || '' }); history.replaceState(null, '', location.pathname + '#' + paidF);
      const m = await call('p2_me'); if (m.ok) { S.account = m.account; S.files = m.files || []; snap.save(); }
      $('meBtn').hidden = false; claim(paidF); toast(j.paid ? 'Payment received. Thank you.' : 'We’re still confirming your payment. It will show here shortly.', 6000); return;
    } catch (e) {}
  }
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
