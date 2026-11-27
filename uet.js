/* Microsoft Advertising tag for the portal: counts ad clicks that turn into a started file and a paid invoice.
   Same tag as the main site (js/uet.js there). Loads after the page so it never slows the first taps. */
(function () {
  var UET_ID = '343288781';
  window.uetq = window.uetq || [];
  window.ecAdLead = function (what) { try { window.uetq.push('event', 'submit_lead_form', { event_category: 'lead', event_label: what || 'portal', revenue_value: 5, currency: 'USD' }); } catch (e) {} };
  window.ecAdPurchase = function (id, value, item) { try { window.uetq.push('event', 'purchase', { revenue_value: value, currency: 'USD', event_label: item || 'portal' }); } catch (e) {} };
  window.addEventListener('load', function () {
    setTimeout(function () {
      (function (w, d, t, r, u) { var f, n, i; w[u] = w[u] || [], f = function () { var o = { ti: UET_ID, enableAutoSpaTracking: true }; o.q = w[u], w[u] = new UET(o), w[u].push('pageLoad'); },
        n = d.createElement(t), n.src = r, n.async = 1, n.onload = n.onreadystatechange = function () { var s = this.readyState; s && s !== 'loaded' && s !== 'complete' || (f(), n.onload = n.onreadystatechange = null); },
        i = d.getElementsByTagName(t)[0], i.parentNode.insertBefore(n, i); })(window, document, 'script', 'https://bat.bing.net/bat.js?ti=343288781', 'uetq');
    }, 1500);
  });
})();
