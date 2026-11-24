// Estimate Consultants client portal (v2). Plain JS, no build step.
// Talks to the Appraisals app (Apps Script) with actions p2_*; every rule checked here is checked again there.
'use strict';
const API = 'https://script.google.com/macros/s/AKfycbw9irQ5WbSoTcrPq8d4EU7L0U0pF3XJ-akfX7SS1LvdYOohEtF6-d_967_T-UEhsgrK/exec';
const STATES = {"AL":{"n":"Alabama","dl":6,"um":"none"},"AK":{"n":"Alaska","dl":2,"um":"both"},"AZ":{"n":"Arizona","dl":2,"um":"none"},"AR":{"n":"Arkansas","dl":3,"um":"both"},"CA":{"n":"California","dl":3,"um":"both"},"CO":{"n":"Colorado","dl":3,"um":"both"},"CT":{"n":"Connecticut","dl":2,"um":"none"},"DE":{"n":"Delaware","dl":2,"um":"both"},"DC":{"n":"District of Columbia","dl":3,"um":"both"},"FL":{"n":"Florida","dl":2,"um":"none"},"GA":{"n":"Georgia","dl":4,"um":"both"},"HI":{"n":"Hawaii","dl":2,"um":"none"},"ID":{"n":"Idaho","dl":3,"um":"none"},"IL":{"n":"Illinois","dl":5,"um":"both"},"IN":{"n":"Indiana","dl":2,"um":"both"},"IA":{"n":"Iowa","dl":5,"um":"none"},"KS":{"n":"Kansas","dl":2,"um":"none"},"KY":{"n":"Kentucky","dl":2,"um":"none"},"LA":{"n":"Louisiana","dl":2,"um":"both"},"ME":{"n":"Maine","dl":6,"um":"none"},"MD":{"n":"Maryland","dl":3,"um":"both"},"MA":{"n":"Massachusetts","dl":3,"um":"none","noCert":true},"MI":{"n":"Michigan","dl":3,"um":"none","noDV":true},"MN":{"n":"Minnesota","dl":6,"um":"none"},"MS":{"n":"Mississippi","dl":3,"um":"both"},"MO":{"n":"Missouri","dl":5,"um":"none"},"MT":{"n":"Montana","dl":2,"um":"none"},"NE":{"n":"Nebraska","dl":4,"um":"none","noDV":true},"NV":{"n":"Nevada","dl":3,"um":"none"},"NH":{"n":"New Hampshire","dl":3,"um":"none"},"NJ":{"n":"New Jersey","dl":6,"um":"both"},"NM":{"n":"New Mexico","dl":4,"um":"both"},"NY":{"n":"New York","dl":3,"um":"none"},"NC":{"n":"North Carolina","dl":3,"um":"uninsured","ncAppraisal":true},"ND":{"n":"North Dakota","dl":6,"um":"none"},"OH":{"n":"Ohio","dl":2,"um":"none"},"OK":{"n":"Oklahoma","dl":2,"um":"none"},"OR":{"n":"Oregon","dl":6,"um":"both"},"PA":{"n":"Pennsylvania","dl":2,"um":"none"},"RI":{"n":"Rhode Island","dl":10,"um":"both"},"SC":{"n":"South Carolina","dl":3,"um":"both"},"SD":{"n":"South Dakota","dl":6,"um":"none"},"TN":{"n":"Tennessee","dl":3,"um":"both"},"TX":{"n":"Texas","dl":2,"um":"both"},"UT":{"n":"Utah","dl":3,"um":"both"},"VT":{"n":"Vermont","dl":3,"um":"both"},"VA":{"n":"Virginia","dl":5,"um":"both"},"WA":{"n":"Washington","dl":3,"um":"both"},"WV":{"n":"West Virginia","dl":2,"um":"both"},"WI":{"n":"Wisconsin","dl":3,"um":"none"},"WY":{"n":"Wyoming","dl":4,"um":"none"}};
const ZIPR = [[5,5,'NY'],[10,27,'MA'],[28,29,'RI'],[30,38,'NH'],[39,49,'ME'],[50,54,'VT'],[55,55,'MA'],[56,59,'VT'],[60,69,'CT'],[70,89,'NJ'],[100,149,'NY'],[150,196,'PA'],[197,199,'DE'],[200,200,'DC'],[201,201,'VA'],[202,205,'DC'],[206,219,'MD'],[220,246,'VA'],[247,268,'WV'],[270,289,'NC'],[290,299,'SC'],[300,319,'GA'],[320,349,'FL'],[350,369,'AL'],[370,385,'TN'],[386,397,'MS'],[398,399,'GA'],[400,427,'KY'],[430,459,'OH'],[460,479,'IN'],[480,499,'MI'],[500,528,'IA'],[530,549,'WI'],[550,567,'MN'],[569,569,'DC'],[570,577,'SD'],[580,588,'ND'],[590,599,'MT'],[600,629,'IL'],[630,658,'MO'],[660,679,'KS'],[680,693,'NE'],[700,714,'LA'],[716,729,'AR'],[730,732,'OK'],[733,733,'TX'],[734,749,'OK'],[750,799,'TX'],[800,816,'CO'],[820,831,'WY'],[832,838,'ID'],[840,847,'UT'],[850,865,'AZ'],[870,884,'NM'],[885,885,'TX'],[889,898,'NV'],[900,961,'CA'],[967,968,'HI'],[970,979,'OR'],[980,994,'WA'],[995,999,'AK']];
const TYPES = [['dv','Diminished value'],['ncdv','NC appraisal (diminished value)'],['tl','Total loss'],['estate','Estate / probate'],['divorce','Divorce'],['bank','Bank & collateral'],['irs','IRS donation'],['classic','Classic or exotic'],['equip','Heavy equipment'],['rv','RV or camper']];
const DVT = { dv: 1, dvself: 1, ncdv: 1 };
// Underinsured coverage paying for the car is only confirmed in these states.
const UNDER_OK = { SC: 1, GA: 1 };
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const app = $('app');
const Q = new URLSearchParams(location.search);
const ARROW = '<span class="ar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>';
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
function view(html, wide) { app.className = wide ? 'wide' : ''; app.innerHTML = '<div class="glow" aria-hidden="true"></div>' + html; window.scrollTo(0, 0); const f = app.querySelector('[autofocus]'); if (f) setTimeout(() => f.focus(), 60); }
function zipState(z) { z = String(z || ''); if (!/^\d{5}$/.test(z)) return null; const n = parseInt(z.slice(0, 3), 10), h = ZIPR.find((r) => n >= r[0] && n <= r[1]); return h && STATES[h[2]] ? Object.assign({ code: h[2] }, STATES[h[2]]) : null; }

// ---------- sign in ----------
function signIn(msg) {
  $('meBtn').hidden = true;
  view(`<div style="margin-top:70px"><p class="k">Your claim, in one place</p><h1 class="big">Sign in with a code</h1>
  <p class="lead">No password. We email you a 6-digit code.</p>
  <form id="f" class="mt" novalidate><label class="f" for="em">Email</label>
  <input class="in" id="em" type="email" autocomplete="email" inputmode="email" autofocus value="${esc(S.email || Q.get('email') || '')}">
  <p class="err" id="er">${esc(msg || '')}</p>
  <button class="btn red mt-s" id="go" type="submit">Send my code ${ARROW}</button></form>
  <p class="small muted mt">Questions? Email <a href="mailto:customerservice@estimateconsultants.com">customerservice@estimateconsultants.com</a>.</p></div>`);
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
  view(`<div class="swipe" style="margin-top:70px"><p class="k">Check your email</p><h1 class="big">Enter your code</h1>
  <p class="lead">Sent to <b style="color:#fff">${esc(S.email)}</b>. It may take a minute.</p>
  <form id="f" class="mt" novalidate><div class="code" id="cd">${[0,1,2,3,4,5].map((i) => `<input inputmode="numeric" autocomplete="${i ? 'off' : 'one-time-code'}" maxlength="${i ? 1 : 6}" aria-label="Digit ${i + 1}"${i ? '' : ' autofocus'}>`).join('')}</div>
  <label class="switch mt"><input type="checkbox" id="rm" checked><span class="t"></span>Remember this device for 30 days</label>
  <p class="err" id="er"></p>
  <button class="btn red mt-s" id="go" type="submit">Open my claim ${ARROW}</button></form>
  <p class="small muted mt">Didn’t get it? <a href="#" id="again">Send a new code</a> · <a href="#" id="chg">Use a different email</a></p></div>`);
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
  if (Q.get('vin') || Q.get('vehicle') || Q.get('start')) { const t = Q.get('start') || (Q.get('vr') ? 'tl' : ''); history.replaceState(null, '', location.pathname); return startSetup(t || ''); }
  if (!S.files.length) return startSetup('');
  home();
}
function profile() {
  view(`<div class="swipe" style="margin-top:50px"><p class="k">Welcome</p><h1 class="big">A little about you</h1>
  <form id="f" class="mt stack" novalidate>
  <div><label class="f" for="nm">Full name</label><input class="in" id="nm" autocomplete="name" autofocus></div>
  <div><label class="f" for="ph">Phone</label><input class="in" id="ph" type="tel" autocomplete="tel" inputmode="tel"></div>
  <p class="err" id="er"></p><button class="btn red" id="go" type="submit">Continue ${ARROW}</button></form></div>`);
  $('f').onsubmit = async (e) => {
    e.preventDefault(); const b = $('go'); busy(b, true); $('er').textContent = '';
    try { const j = await call('p2_profile', { name: $('nm').value, phone: $('ph').value }); if (!j.ok) { $('er').textContent = j.message; return; } S.account = j.account; snap.save(); afterSignIn(); }
    catch (err) { $('er').textContent = 'Couldn’t save. Try again.'; } finally { busy(b, false); }
  };
}

// ---------- claim setup ----------
function startSetup(type) {
  S.setup = { type: type || '', i: 0, a: {}, zip: '', vr: Q.get('vr') || '', vehicle: { vin: Q.get('vin') || '', mileage: Q.get('miles') || '', desc: Q.get('vehicle') || '' }, dir: '' };
  if (type) S.setup.i = 1; if (S.setup.vehicle.vin) decodeVin(S.setup.vehicle); renderSetup();
}
function questions() {
  const s = S.setup, st = zipState(s.zip), dv = !!DVT[s.type];
  const fault = [['The other driver', 'other']].concat(st && st.um !== 'none' ? [['The other driver, and they had no insurance', 'unins']] : []).concat(st && st.um !== 'none' && UNDER_OK[st.code] ? [['The other driver, without enough insurance', 'under']] : []).concat([['Me', 'me'], ['Not decided yet', 'open']]);
  const qs = [{ id: 'type' }, { id: 'zip', title: 'What ZIP code is the car kept in?', sub: 'Your state’s rules decide what’s available.' }, { id: 'vehicle' }];
  if (dv) qs.push({ id: 'fault', title: 'Who was at fault?', sub: 'Diminished value is claimed from the at-fault driver’s insurer' + (st && st.um !== 'none' ? ', or your own uninsured motorist coverage in ' + st.n + '.' : '.'), opts: fault },
    { id: 'date', title: 'When was the accident?', sub: st ? st.n + ' allows ' + st.dl + ' years to claim.' : '' },
    { id: 'prior', title: 'Any earlier accident?', sub: 'Before this one. We’ll verify the vehicle’s accident history.', opts: [['No', 'n'], ['Yes', 'y'], ['Not sure', 'u']] },
    { id: 'repair', title: 'Has it been repaired?', sub: 'We can start either way.', opts: [['Yes, repairs are done', 'done'], ['Being repaired now', 'now'], ['Not yet', 'not']] });
  if (s.type === 'dv' || s.type === 'dvself') qs.push({ id: 'service', title: 'How do you want to handle the insurer?', sub: 'Full service: the $199 isn’t charged if the insurer’s offer doesn’t reach $498.',
    opts: [['We handle it: $299 now, $199 when the offer comes in', 'full'], ['You handle it: $299, with our appraisal and a demand letter', 'self']] });
  qs.push({ id: 'summary' });
  return qs;
}
const STOP = {
  noCert: (st) => [st.n + ': certified appraisals unavailable', 'We can’t provide certified appraisals in ' + st.n + '.', true],
  noDV: (st) => ['Diminished value unavailable in ' + st.n, 'We don’t offer diminished value claims in ' + st.n + '.', true],
  ncOnly: () => ['North Carolina only', 'This appraisal option is for vehicles kept in North Carolina. Choose “Diminished value” instead.', false],
  me: () => ['You were at fault', 'Diminished value is paid by the at-fault driver’s insurer, so there’s no claim when you were at fault.', false],
  open: () => ['Fault isn’t decided yet', 'Diminished value is claimed once the other driver is found at fault. Come back as soon as their insurer accepts fault.', false],
  late: (st) => ['Past the deadline', st.n + ' allows ' + st.dl + ' years from the accident for a property damage claim, and that time has passed.', false],
  age: () => ['The car is over 10 years old', 'Our diminished value appraisals are for vehicles 10 model years old or newer.', false],
  miles: () => ['Over 100,000 miles', 'Our diminished value appraisals are for vehicles under 100,000 miles.', false],
  prior: () => ['An earlier accident', 'Our diminished value appraisals are for vehicles with no accident before this one. We verify the accident history on every claim.', false]
};
function stopScreen(code) {
  const st = zipState(S.setup.zip) || { n: '' }, x = (STOP[code] || (() => ['Not available', 'This claim doesn’t qualify. Call us and we’ll talk it through.', false]))(st);
  view(`<div class="swipe" style="margin-top:50px"><p class="k">Not available</p><h1 class="mid">${esc(x[0])}</h1><p class="lead">${esc(x[1])}${x[2] ? ' Our MarketTrue Valuation Reports are still available there: an instant, uncertified report you can use with the insurer.' : ''}</p>
  <div class="stack mt">${x[2] ? `<a class="btn red" href="https://www.estimateconsultants.com/total-loss-valuation-report.html">Get a MarketTrue Valuation Report ${ARROW}</a>` : ''}
  <a class="btn ${x[2] ? 'ghost' : 'red'}" href="tel:9103336001">Call 910-333-6001</a>
  <button class="btn ghost" type="button" id="bk">Change an answer</button></div></div>`);
  $('bk').onclick = () => { S.setup.dir = 'rev'; renderSetup(); };
}
function stopFor(id, v) {
  const s = S.setup, st = zipState(s.zip);
  if (id === 'zip') { if (st.noCert) return 'noCert'; if (DVT[s.type] && st.noDV) return 'noDV'; if (s.type === 'ncdv' && st.code !== 'NC') return 'ncOnly'; }
  if (id === 'fault' && (v === 'me' || v === 'open')) return v;
  if (id === 'date') { const y = (Date.now() - Date.parse(v + 'T12:00:00')) / 31557600000; if (y > st.dl) return 'late'; }
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
  s.i++; s.dir = ''; renderSetup();
}
function renderSetup() {
  const s = S.setup, qs = questions(); if (s.i >= qs.length) s.i = qs.length - 1;
  const q = qs[s.i], n = qs.length, pos = s.i + 1;
  const bar = `<div class="bar"><button class="back" type="button" id="bk" aria-label="Back">←</button><div class="track"><div class="fill" style="width:${Math.round(pos / n * 100)}%"></div></div><span class="cnt">${pos}/${n}</span></div>`;
  const wrap = (inner) => view(bar + `<div class="swipe ${s.dir}" style="margin-top:34px">${inner}</div>`);
  if (q.id === 'type') {
    wrap(`<p class="k">Start a claim</p><h1 class="mid">What do you need?</h1><div class="chips mt">${TYPES.map((t) => `<button class="chip" type="button" data-t="${t[0]}">${esc(t[1])}</button>`).join('')}</div>
    <button class="btn ghost mt-s" type="button" id="ns">Not sure? Answer a few questions</button>`);
    app.querySelectorAll('.chip').forEach((b) => { b.onclick = () => { s.type = b.dataset.t; s.labels = { type: b.textContent }; s.i = 1; s.dir = ''; renderSetup(); }; });
    $('ns').onclick = () => { s.type = 'dv'; s.labels = { type: 'Diminished value' }; s.i = 1; renderSetup(); };
  } else if (q.id === 'zip') {
    wrap(`<p class="k">Question ${pos - 1}</p><h1 class="mid">${esc(q.title)}</h1><p class="lead">${esc(q.sub)}</p>
    <form id="f" class="mt" novalidate><label class="f" for="z">ZIP code</label><input class="in big" id="z" inputmode="numeric" maxlength="5" autocomplete="postal-code" value="${esc(s.zip)}" autofocus>
    <p class="small" id="zp" style="margin:10px 0 0"></p><button class="btn red mt" type="submit">Continue ${ARROW}</button></form>`);
    const show = () => { const st = zipState($('z').value); $('zp').textContent = st ? st.n : 'Enter the 5-digit ZIP code'; $('zp').className = 'small ' + (st ? 'ok' : 'muted'); };
    $('z').oninput = () => { $('z').value = $('z').value.replace(/\D/g, '').slice(0, 5); show(); }; show();
    $('f').onsubmit = (e) => { e.preventDefault(); const st = zipState($('z').value); if (!st) return toast('Enter a valid 5-digit ZIP code.'); s.zip = $('z').value; answer('zip', s.zip, s.zip + ' · ' + st.n); };
  } else if (q.id === 'date') {
    const today = new Date().toISOString().slice(0, 10);
    wrap(`<p class="k">Question ${pos - 1}</p><h1 class="mid">${esc(q.title)}</h1><p class="lead">${esc(q.sub)}</p>
    <form id="f" class="mt" novalidate><label class="f" for="dt">Date of the accident</label><input class="in" id="dt" type="date" max="${today}" value="${esc(s.a.date || '')}" autofocus style="color-scheme:dark">
    <button class="btn red mt" type="submit">Continue ${ARROW}</button></form>`);
    $('f').onsubmit = (e) => { e.preventDefault(); const v = $('dt').value; if (!v || v > today) return toast('Pick the date of the accident.'); answer('date', v, v.slice(5, 7) + '/' + v.slice(8) + '/' + v.slice(0, 4)); };
  } else if (q.opts) {
    wrap(`<p class="k">Question ${pos - 1}</p><h1 class="mid">${esc(q.title)}</h1>${q.sub ? `<p class="lead">${esc(q.sub)}</p>` : ''}
    <div class="stack mt">${q.opts.map((o) => `<button class="opt" type="button" data-v="${o[1]}">${esc(o[0])}<span aria-hidden="true">→</span></button>`).join('')}</div>`);
    app.querySelectorAll('.opt').forEach((b) => { b.onclick = () => answer(q.id, b.dataset.v, b.firstChild.textContent); });
  } else if (q.id === 'vehicle') {
    const v = s.vehicle;
    if (v.year && v.mileage && s.dir !== 'rev' && !s.vehShown) { s.vehShown = 1; const why = vehicleStop(); if (why) return stopScreen(why); s.i++; return renderSetup(); }
    wrap(`<p class="k">Your vehicle</p><h1 class="mid">The car</h1>
    <form id="f" class="mt stack" novalidate>
    <div><label class="f" for="vin">VIN <span class="muted">(17 characters, on the registration or driver’s door)</span></label><input class="in" id="vin" maxlength="17" autocapitalize="characters" value="${esc(v.vin)}" autofocus style="text-transform:uppercase;letter-spacing:.06em"></div>
    <p class="small" id="vd" style="margin:-4px 0 0">${esc(v.desc ? v.desc : '')}</p>
    <div><label class="f" for="mi">Mileage</label><input class="in" id="mi" inputmode="numeric" value="${esc(v.mileage)}"></div>
    <button class="btn red" type="submit">Continue ${ARROW}</button></form>`);
    const decode = async () => {
      const vin = $('vin').value.toUpperCase().replace(/[^A-Z0-9]/g, ''); $('vin').value = vin;
      if (vin.length !== 17) { $('vd').textContent = ''; return; }
      $('vd').innerHTML = '<span class="sp" style="width:14px;height:14px;border-width:2px;vertical-align:-2px"></span> Looking it up…';
      try {
        const j = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/' + vin + '?format=json').then((r) => r.json()), x = (j.Results || [])[0] || {};
        if (x.ModelYear && x.Make) { Object.assign(v, { vin, year: x.ModelYear, make: titleCase(x.Make), model: x.Model || '', trim: x.Trim || '' }); v.desc = [v.year, v.make, v.model, v.trim].filter(Boolean).join(' '); $('vd').textContent = v.desc; $('vd').className = 'small ok'; }
        else { $('vd').textContent = 'We couldn’t read that VIN. Please check it.'; $('vd').className = 'small muted'; }
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
    const rows = [['Name', a.name], ['Email', a.email], ['Phone', a.phone], ['Vehicle', s.vehicle.desc], ['VIN', s.vehicle.vin], ['Mileage', Number(s.vehicle.mileage).toLocaleString('en-US')]]
      .concat([['service', 'Service'], ['zip', 'Car kept in'], ['fault', 'At fault'], ['date', 'Accident date'], ['prior', 'Earlier accident'], ['repair', 'Repairs']].filter((x) => L[x[0]]).map((x) => [x[1], L[x[0]]]));
    const name = s.type === 'ncdv' ? 'NC diminished value appraisal' : s.type === 'dv' ? 'Diminished value · full service' : s.type === 'dvself' ? 'Diminished value · self-service' : (L.type || '') + ' appraisal';
    wrap(`<p class="k">Check your details</p><h1 class="mid">${esc(name)}</h1><p class="ok small" style="margin:8px 0 0">Your claim qualifies.</p>
    <dl class="sum">${rows.map((r) => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>
    ${st && st.ncAppraisal && DVT[s.type] ? '<p class="note mt-s">North Carolina: if the insurer’s offer comes in more than $2,000 under our value (or 25% of the car’s value, if that’s less), state law lets either side demand an appraisal. We’ll show you that option when the offer arrives.</p>' : ''}
    <div class="stack mt"><button class="btn red" type="button" id="ok">Looks right · continue ${ARROW}</button><button class="btn ghost" type="button" id="ch">Change something</button></div><p class="err" id="er"></p>`);
    $('ch').onclick = () => { s.i = 1; s.dir = 'rev'; renderSetup(); };
    $('ok').onclick = async () => {
      const b = $('ok'); busy(b, true); const keep = app.innerHTML; loading('Setting up your claim');
      try {
        const j = await call('p2_setup', { setup: { type: s.type, zip: s.zip, answers: s.a, vehicle: s.vehicle, vr: s.vr || '' } });
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
function titleCase(t) { return String(t || '').toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\bBmw\b/, 'BMW').replace(/\bGmc\b/, 'GMC'); }

// ---------- home and claim ----------
function home() {
  view(`<div style="margin-top:30px"><p class="k">${esc((S.account || {}).name || '')}</p><h1 class="big">Your claims</h1>
  <div class="stack mt">${S.files.map((f) => `<a class="file" href="#${esc(f.fileId)}" data-f="${esc(f.fileId)}"><div class="card"><p class="k" style="margin:0 0 6px">${esc(shortType(f.type))} · ${esc(f.fileId)}</p><div style="font:400 26px/1.05 var(--disp);text-transform:uppercase;color:#fff">${esc(f.vehicle || 'Vehicle')}</div><p class="small muted" style="margin:8px 0 0">${esc(nowStep(f))}</p></div></a>`).join('') || '<p class="muted">No claims yet.</p>'}
  <button class="btn red" type="button" id="nw">Start a new claim ${ARROW}</button></div></div>`);
  app.querySelectorAll('[data-f]').forEach((a) => { a.onclick = (e) => { e.preventDefault(); claim(a.dataset.f); }; });
  $('nw').onclick = () => startSetup('');
}
function shortType(t) { t = String(t || ''); return /diminished/i.test(t) ? 'Diminished value' : /total loss/i.test(t) ? 'Total loss' : /estate|probate/i.test(t) ? 'Appraisal' : /bank/i.test(t) ? 'Bank & collateral' : /irs/i.test(t) ? 'IRS donation' : 'Appraisal'; }
function nowStep(f) { const s = (f.steps || []).find((x) => !x.done); return s ? (s.note || s.name) : 'In progress'; }
function claim(id) {
  const f = S.files.find((x) => x.fileId === id); if (!f) return home();
  history.replaceState(null, '', '#' + id);
  const steps = f.steps || [], cur = steps.findIndex((x) => !x.done), needs = (f.needs || []).filter((x) => !x.done), ups = f.updates || [];
  view(`<div style="margin-top:20px"><a href="#" id="hm" class="small" style="font-weight:600;text-decoration:none;display:inline-flex;min-height:44px;align-items:center">← Your claims</a>
  <p class="k" style="margin-top:6px">${esc(shortType(f.type))} · File ${esc(f.fileId)}</p><h1 class="big">${esc(f.vehicle)}</h1>
  ${steps.length ? `<div class="card mt"><div style="display:flex;justify-content:space-between;align-items:baseline"><p class="k" style="margin:0">Where it stands</p><span class="small" style="color:#fff;font-weight:700">Step ${Math.max(1, cur + 1 || steps.length)} of ${steps.length}</span></div>
  <div class="seg" style="grid-template-columns:repeat(${steps.length},minmax(0,1fr))">${steps.map((x, i) => `<span class="${x.done || i === cur ? 'on' : ''}"></span>`).join('')}</div>
  <div class="steps">${steps.map((x, i) => `<div class="step ${x.done ? '' : i === cur ? '' : 'next'}"><span class="dot ${x.done ? 'done' : i === cur ? 'now' : 'next'}">${x.done ? CHECK : ''}</span><div><div class="nm">${esc(x.name)}</div>${x.date || x.note ? `<div class="small ${i === cur ? '' : 'muted'}" style="${i === cur ? 'color:var(--redsoft)' : ''}">${esc([x.date, x.note].filter(Boolean).join(' · '))}</div>` : ''}</div></div>`).join('')}</div></div>` : ''}
  ${needs.length ? `<div class="card hot mt-s"><p class="k">Waiting on you · ${needs.length}</p><div class="stack" style="gap:10px">${needs.map((x) => `<div class="row"><div class="bd"><div class="nm">${esc(x.name)}</div>${x.note ? `<div class="small muted">${esc(x.note)}</div>` : ''}</div><span class="small muted">Upload soon</span></div>`).join('')}</div></div>` : ''}
  ${ups.length ? `<div class="card mt-s"><p class="k">Latest update</p>${ups.slice(-1).map((u) => `<p style="margin:0;color:var(--text)">${esc(u.text)}</p><p class="small muted" style="margin:8px 0 0">${esc(u.date || '')}</p>`).join('')}</div>` : ''}
  <p class="small muted mt">Questions? Email <a href="mailto:customerservice@estimateconsultants.com">customerservice@estimateconsultants.com</a>.</p></div>`);
  $('hm').onclick = (e) => { e.preventDefault(); history.replaceState(null, '', location.pathname); home(); };
}

// ---------- account menu ----------
$('meBtn').onclick = () => {
  const a = S.account || {};
  view(`<div style="margin-top:30px"><p class="k">Your account</p><h1 class="mid">${esc(a.name || a.email)}</h1><p class="lead">${esc(a.email)}${a.phone ? ' · ' + esc(a.phone) : ''}</p>
  <div class="stack mt"><button class="btn ghost" id="cl" type="button">Your claims</button><button class="btn ghost" id="so" type="button">Sign out</button></div></div>`);
  $('cl').onclick = home; $('so').onclick = () => { store.del('ec_tok'); store.del('ec_snap'); S = { token: null, files: [], email: a.email }; signIn(); };
};

// ---------- start ----------
(async function boot() {
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
