const GOOGLE_CLIENT_ID =
  '272701100644-rj9p5sqtlk8ir0cm9133l2q0a9745qm0.apps.googleusercontent.com';

const GA_SCOPES = 'https://www.googleapis.com/auth/analytics.readonly';
const GSC_SCOPES = 'https://www.googleapis.com/auth/webmasters.readonly';

let gaAccessToken = null;
let gscAccessToken = null;
let gaTokenClient = null;
let gscTokenClient = null;

const signInBtn = document.getElementById('ga-signin');
const signOutBtn = document.getElementById('ga-signout');
const statusEl = document.getElementById('ga-status');
const propertyInputWrapper = document.getElementById('property-input-wrapper');

const gscSignInBtn = document.getElementById('gsc-signin');
const gscSignOutBtn = document.getElementById('gsc-signout');
const gscStatusEl = document.getElementById('gsc-status');
const gscInputWrapper = document.getElementById('gsc-input-wrapper');

const accountSelect = document.getElementById('ga-account-select');
const propertySelect = document.getElementById('ga-property-select');
const loadBtn = document.getElementById('ga-load');

const gscPropertySelect = document.getElementById('gsc-property-select');
const gscLoadBtn = document.getElementById('gsc-load');

const helpTrigger = document.getElementById('ga4-help-trigger');
const helpBox = document.getElementById('ga4-help-box');

const resultsEl = document.getElementById('ga-results');
const tableBodyMoM = document.querySelector('#ga-table-mom tbody');
const tableBodyWoW = document.querySelector('#ga-table-wow tbody');
const tableBodyYoY = document.querySelector('#ga-table-yoy tbody');
const tableBodyAvg = document.querySelector('#ga-table-avg tbody');
const tableBodyNew = document.querySelector('#ga-table-new tbody');

const gscWowBody = document.querySelector('#gsc-wow-table tbody');
const gscMomBody = document.querySelector('#gsc-mom-table tbody');
const gscYoyBody = document.querySelector('#gsc-yoy-table tbody');

const propertyDomainEl = document.getElementById('property-domain');

const copyBtnMoM = document.getElementById('copy-btn-mom');
const copyTextMoM = document.getElementById('copy-text-mom');
const copyBtnWoW = document.getElementById('copy-btn-wow');
const copyTextWoW = document.getElementById('copy-text-wow');
const copyBtnYoY = document.getElementById('copy-btn-yoy');
const copyTextYoY = document.getElementById('copy-text-yoy');
const copyBtnAvg = document.getElementById('copy-btn-avg');
const copyTextAvg = document.getElementById('copy-text-avg');
const copyBtnNew = document.getElementById('copy-btn-new');
const copyTextNew = document.getElementById('copy-text-new');

const copyBtnGscWow = document.getElementById('copy-btn-gsc-wow');
const copyTextGscWow = document.getElementById('copy-text-gsc-wow');
const copyBtnGscMom = document.getElementById('copy-btn-gsc-mom');
const copyTextGscMom = document.getElementById('copy-text-gsc-mom');
const copyBtnGscYoy = document.getElementById('copy-btn-gsc-yoy');
const copyTextGscYoy = document.getElementById('copy-text-gsc-yoy');

const tableData = {
  momSessions: [],
  wowSessions: [],
  yoySessions: [],
  avgSession: [],
  newUsers: []
};

const gscTableData = {
  wow: [],
  mom: [],
  yoy: []
};

helpTrigger.addEventListener('click', () => {
  helpBox.style.display =
    helpBox.style.display === 'none' || helpBox.style.display === '' ? 'block' : 'none';
});

function setStatus(msg) {
  statusEl.textContent = msg;
  statusEl.style.display = msg ? 'block' : 'none';
}

function setGscStatus(msg) {
  gscStatusEl.textContent = msg;
  gscStatusEl.style.display = msg ? 'block' : 'none';
}

function initOAuth() {
  gaTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: GA_SCOPES,
    callback: (res) => {
      if (!res.access_token) {
        setStatus('Login failed.');
        return;
      }
      gaAccessToken = res.access_token;
      signInBtn.style.display = 'none';
      signOutBtn.style.display = 'inline-block';
      propertyInputWrapper.style.display = 'block';
      setStatus('Signed in. Loading your GA4 accounts...');
      loadAccounts();
    }
  });

  gscTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: GSC_SCOPES,
    callback: (res) => {
      if (!res.access_token) {
        setGscStatus('GSC login failed.');
        return;
      }
      gscAccessToken = res.access_token;
      gscSignInBtn.style.display = 'none';
      gscSignOutBtn.style.display = 'inline-block';
      gscInputWrapper.style.display = 'block';
      setGscStatus('Signed in. Loading your GSC properties...');
      loadGscSites();
    }
  });

  signInBtn.onclick = () =>
    gaTokenClient.requestAccessToken({ prompt: gaAccessToken ? '' : 'consent' });

  signOutBtn.onclick = () => location.reload();

  gscSignInBtn.onclick = () =>
    gscTokenClient.requestAccessToken({ prompt: gscAccessToken ? '' : 'consent' });

  gscSignOutBtn.onclick = () => location.reload();

  accountSelect.addEventListener('change', () => {
    const accountName = accountSelect.value;
    propertySelect.innerHTML = '';
    if (!accountName) {
      propertySelect.disabled = true;
      propertySelect.innerHTML = '<option value="">Select an account first</option>';
      loadBtn.disabled = true;
      return;
    }
    propertySelect.disabled = true;
    propertySelect.innerHTML = '<option value="">Loading properties...</option>';
    loadBtn.disabled = true;
    loadProperties(accountName);
  });

  propertySelect.addEventListener('change', () => {
    const propertyId = propertySelect.value;
    loadBtn.disabled = !propertyId;
  });

  loadBtn.onclick = () => {
    const propertyId = propertySelect.value;
    if (!propertyId || !propertyId.startsWith('properties/')) {
      setStatus('Please select a GA4 property.');
      return;
    }
    loadReports(propertyId);
  };

  gscPropertySelect.addEventListener('change', () => {
    const siteUrl = gscPropertySelect.value;
    gscLoadBtn.disabled = !siteUrl;
  });

  gscLoadBtn.onclick = () => {
    const siteUrl = gscPropertySelect.value;
    if (!siteUrl) {
      setGscStatus('Please select a GSC property.');
      return;
    }
    loadGscReports(siteUrl);
  };

  copyBtnMoM.onclick = () => copyTableToClipboard('momSessions');
  copyBtnWoW.onclick = () => copyTableToClipboard('wowSessions');
  copyBtnYoY.onclick = () => copyTableToClipboard('yoySessions');
  copyBtnAvg.onclick = () => copyTableToClipboard('avgSession');
  copyBtnNew.onclick = () => copyTableToClipboard('newUsers');

  copyBtnGscWow.onclick = () => copyGscTableToClipboard('wow');
  copyBtnGscMom.onclick = () => copyGscTableToClipboard('mom');
  copyBtnGscYoy.onclick = () => copyGscTableToClipboard('yoy');
}

function loadAccounts() {
  if (!gaAccessToken) return;

  accountSelect.disabled = true;
  accountSelect.innerHTML = '<option value="">Loading accounts...</option>';

  fetch('https://analyticsadmin.googleapis.com/v1beta/accounts', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + gaAccessToken
    }
  })
    .then(r => r.json())
    .then(data => {
      const accounts = data.accounts || [];
      accountSelect.innerHTML = '';

      if (!accounts.length) {
        accountSelect.innerHTML = '<option value="">No GA4 accounts found</option>';
        setStatus('No GA4 accounts found for this user.');
        return;
      }

      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Select an account';
      placeholder.selected = true;
      accountSelect.appendChild(placeholder);

      accounts.forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc.name;
        opt.textContent = `${acc.displayName} (${acc.name})`;
        accountSelect.appendChild(opt);
      });

      accountSelect.disabled = false;
      propertySelect.disabled = true;
      propertySelect.innerHTML = '<option value="">Select an account first</option>';
      loadBtn.disabled = true;
      setStatus('Select an account, then a property.');
    })
    .catch(err => {
      console.error(err);
      setStatus('Error loading GA4 accounts.');
      accountSelect.innerHTML = '<option value="">Error loading accounts</option>';
    });
}

function loadProperties(accountName) {
  if (!gaAccessToken || !accountName) return;

  const url = `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:${encodeURIComponent(accountName)}`;

  fetch(url, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + gaAccessToken
    }
  })
    .then(r => r.json())
    .then(data => {
      const properties = data.properties || [];
      propertySelect.innerHTML = '';

      if (!properties.length) {
        propertySelect.innerHTML = '<option value="">No properties found for this account</option>';
        propertySelect.disabled = true;
        loadBtn.disabled = true;
        setStatus('No properties found under this account.');
        return;
      }

      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Select a property';
      placeholder.selected = true;
      propertySelect.appendChild(placeholder);

      properties.forEach(prop => {
        const opt = document.createElement('option');
        opt.value = prop.name;
        opt.textContent = `${prop.displayName} (${prop.name})`;
        propertySelect.appendChild(opt);
      });

      propertySelect.disabled = false;
      loadBtn.disabled = true;
      setStatus('Select a property, then click Load GA4 data.');
    })
    .catch(err => {
      console.error(err);
      propertySelect.innerHTML = '<option value="">Error loading properties</option>';
      propertySelect.disabled = true;
      loadBtn.disabled = true;
      setStatus('Error loading GA4 properties.');
    });
}

function extractGa4Domain(rows) {
  if (!rows.length) return null;

  const path = rows[0].dimensionValues[0].value || '';

  try {
    if (path.startsWith('http')) {
      const url = new URL(path);
      return url.hostname;
    }
  } catch (e) {}

  return null;
}

function ga4Request(property, startDate, endDate, metricName = 'sessions') {
  return fetch(
    `https://analyticsdata.googleapis.com/v1beta/${property}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + gaAccessToken },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'landingPage' }],
        metrics: [{ name: metricName }],
        dimensionFilter: {
          filter: {
            fieldName: 'sessionMedium',
            stringFilter: { matchType: 'EXACT', value: 'organic' }
          }
        },
        limit: 1000
      })
    }
  ).then(r => r.json());
}

function calculateGrowthTop10(curRows, prevRows) {
  const prevMap = {};
  prevRows.forEach(r => {
    const path = r.dimensionValues[0].value;
    prevMap[path] = Number(r.metricValues[0].value);
  });

  const results = curRows.map(r => {
    const path = r.dimensionValues[0].value;
    const curVal = Number(r.metricValues[0].value);
    const prevVal = prevMap[path] || 0;
    const diff = curVal - prevVal;
    return { path, curVal, prevVal, diff };
  });

  const growing = results.filter(r => r.diff > 0);
  growing.sort((a, b) => b.diff - a.diff);

  return growing.slice(0, 10);
}

function renderTable(rows, tbody, emptyMessage) {
  tbody.innerHTML = '';

  if (!rows.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.className = 'empty-state';
    td.textContent = emptyMessage;
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      `<td>${r.path}</td>
       <td>${r.curVal.toLocaleString()}</td>
       <td>${r.prevVal.toLocaleString()}</td>
       <td>+${r.diff.toLocaleString()}</td>`;
    tbody.appendChild(tr);
  });
}

function loadReports(propertyId) {
  if (!gaAccessToken) {
    setStatus('Sign in to GA4 first.');
    return;
  }

  setStatus('Loading GA4 reports...');

  propertyDomainEl.textContent = 'Property: ' + propertyId + '   |   Domain: detecting...';
  propertyDomainEl.style.display = 'block';

  const today = new Date();
  const offset = (d) => {
    const dt = new Date();
    dt.setDate(today.getDate() - d);
    return dt.toISOString().split('T')[0];
  };

  const thisStart28 = offset(28);
  const thisEnd28 = offset(1);
  const prevStart28 = offset(56);
  const prevEnd28 = offset(29);

  Promise.all([
    ga4Request(propertyId, thisStart28, thisEnd28, 'sessions'),
    ga4Request(propertyId, prevStart28, prevEnd28, 'sessions')
  ])
    .then(([cur, prev]) => {
      const curRows = cur.rows || [];
      const prevRows = prev.rows || [];

      const detectedDomain = extractGa4Domain(curRows);
      if (detectedDomain) {
        propertyDomainEl.textContent =
          'Property: ' + propertyId + '   |   Domain: ' + detectedDomain;
      } else {
        propertyDomainEl.textContent =
          'Property: ' + propertyId + '   |   Domain: (GA4 data contains paths only)';
      }

      const top10 = calculateGrowthTop10(curRows, prevRows);
      tableData.momSessions = top10;
      renderTable(top10, tableBodyMoM, 'No pages found with month over month growth.');

      resultsEl.style.display = 'block';
      setStatus('MoM sessions loaded. Loading additional GA4 reports...');

      return Promise.all([
        loadWoW(propertyId),
        loadYoY(propertyId),
        loadAvgSessionMoM(propertyId),
        loadNewUsersMoM(propertyId)
      ]);
    })
    .then(() => {
      setStatus('All GA4 reports loaded.');

      if (gscAccessToken && gscPropertySelect.value) {
        loadGscReports(gscPropertySelect.value);
      }
    })
    .catch(err => {
      console.error(err);
      setStatus('Error loading GA4 data.');
    });
}

function loadWoW(propertyId) {
  if (!gaAccessToken) return Promise.resolve();

  const today = new Date();
  const offset = (d) => {
    const dt = new Date();
    dt.setDate(today.getDate() - d);
    return dt.toISOString().split('T')[0];
  };

  const thisStart = offset(7);
  const thisEnd = offset(1);
  const prevStart = offset(14);
  const prevEnd = offset(8);

  return Promise.all([
    ga4Request(propertyId, thisStart, thisEnd, 'sessions'),
    ga4Request(propertyId, prevStart, prevEnd, 'sessions')
  ])
    .then(([cur, prev]) => {
      const curRows = cur.rows || [];
      const prevRows = prev.rows || [];

      const top10 = calculateGrowthTop10(curRows, prevRows);
      tableData.wowSessions = top10;
      renderTable(top10, tableBodyWoW, 'No pages found with week on week growth.');
    })
    .catch(err => {
      console.error(err);
    });
}

function loadYoY(propertyId) {
  if (!gaAccessToken) return Promise.resolve();

  const today = new Date();
  const offset = (d) => {
    const dt = new Date();
    dt.setDate(today.getDate() - d);
    return dt.toISOString().split('T')[0];
  };

  const thisStart = offset(365);
  const thisEnd = offset(1);
  const prevStart = offset(730);
  const prevEnd = offset(366);

  return Promise.all([
    ga4Request(propertyId, thisStart, thisEnd, 'sessions'),
    ga4Request(propertyId, prevStart, prevEnd, 'sessions')
  ])
    .then(([cur, prev]) => {
      const curRows = cur.rows || [];
      const prevRows = prev.rows || [];

      const top10 = calculateGrowthTop10(curRows, prevRows);
      tableData.yoySessions = top10;
      renderTable(top10, tableBodyYoY, 'No pages found with year on year growth.');
    })
    .catch(err => {
      console.error(err);
    });
}

function loadAvgSessionMoM(propertyId) {
  if (!gaAccessToken) return Promise.resolve();

  const today = new Date();
  const offset = (d) => {
    const dt = new Date();
    dt.setDate(today.getDate() - d);
    return dt.toISOString().split('T')[0];
  };

  const thisStart = offset(28);
  const thisEnd = offset(1);
  const prevStart = offset(56);
  const prevEnd = offset(29);

  function requestAvg(property, start, end) {
    return fetch(`https://analyticsdata.googleapis.com/v1beta/${property}:runReport`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + gaAccessToken },
      body: JSON.stringify({
        dateRanges: [{ startDate: start, endDate: end }],
        dimensions: [{ name: 'landingPage' }],
        metrics: [
          { name: 'userEngagementDuration' },
          { name: 'sessions' }
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'sessionMedium',
            stringFilter: { matchType: 'EXACT', value: 'organic' }
          }
        },
        limit: 1000
      })
    }).then(r => r.json());
  }

  function formatMMSS(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return Promise.all([
    requestAvg(propertyId, thisStart, thisEnd),
    requestAvg(propertyId, prevStart, prevEnd)
  ])
    .then(([cur, prev]) => {
      const curRows = cur.rows || [];
      const prevRows = prev.rows || [];

      const prevMap = {};
      prevRows.forEach(r => {
        const path = r.dimensionValues[0].value;
        const totalEngPrev = Number(r.metricValues[0].value);
        const sessionsPrev = Number(r.metricValues[1].value);
        prevMap[path] = sessionsPrev > 0 ? totalEngPrev / sessionsPrev : 0;
      });

      const result = curRows.map(r => {
        const path = r.dimensionValues[0].value;

        const totalEng = Number(r.metricValues[0].value);
        const sessions = Number(r.metricValues[1].value);
        const avg = sessions > 0 ? totalEng / sessions : 0;

        const prevAvg = prevMap[path] || 0;
        const diff = avg - prevAvg;

        return {
          path,
          curRaw: avg,
          prevRaw: prevAvg,
          diffRaw: diff,
          curVal: formatMMSS(avg),
          prevVal: formatMMSS(prevAvg),
          diff: formatMMSS(Math.abs(diff))
        };
      });

      const growing = result.filter(r => r.diffRaw > 0);
      growing.sort((a, b) => b.diffRaw - a.diffRaw);

      const top10 = growing.slice(0, 10);

      tableData.avgSession = top10.map(r => ({
        path: r.path,
        curVal: r.curVal,
        prevVal: r.prevVal,
        diff: r.diff
      }));

      renderTable(
        top10.map(r => ({
          path: r.path,
          curVal: r.curVal,
          prevVal: r.prevVal,
          diff: '+' + r.diff
        })),
        tableBodyAvg,
        'No pages found with MoM increase in average session duration.'
      );
    })
    .catch(err => {
      console.error(err);
    });
}

function loadNewUsersMoM(propertyId) {
  if (!gaAccessToken) return Promise.resolve();

  const today = new Date();
  const offset = (d) => {
    const dt = new Date();
    dt.setDate(today.getDate() - d);
    return dt.toISOString().split('T')[0];
  };

  const thisStart = offset(28);
  const thisEnd = offset(1);
  const prevStart = offset(56);
  const prevEnd = offset(29);

  return Promise.all([
    ga4Request(propertyId, thisStart, thisEnd, 'newUsers'),
    ga4Request(propertyId, prevStart, prevEnd, 'newUsers')
  ])
    .then(([cur, prev]) => {
      const curRows = cur.rows || [];
      const prevRows = prev.rows || [];

      const top10 = calculateGrowthTop10(curRows, prevRows);
      tableData.newUsers = top10;
      renderTable(top10, tableBodyNew, 'No pages found with MoM growth in new users.');
    })
    .catch(err => {
      console.error(err);
    });
}

function copyTableToClipboard(type) {
  const data = tableData[type] || [];

  if (!data.length) {
    setStatus('No data to copy');
    return;
  }

  let label = 'Growth';
  if (type === 'momSessions') label = 'MoM Growth';
  else if (type === 'wowSessions') label = 'WoW Growth';
  else if (type === 'yoySessions') label = 'YoY Growth';
  else if (type === 'avgSession') label = 'MoM Change in Avg Session Duration';
  else if (type === 'newUsers') label = 'MoM Growth in New Users';

  let text = `Landing Page\tLast Period\tPrevious Period\t${label}\n`;

  data.forEach(r => {
    text += `${r.path}\t${r.curVal}\t${r.prevVal}\t+${r.diff}\n`;
  });

  const buttonMap = {
    momSessions: { btn: copyBtnMoM, textEl: copyTextMoM },
    wowSessions: { btn: copyBtnWoW, textEl: copyTextWoW },
    yoySessions: { btn: copyBtnYoY, textEl: copyTextYoY },
    avgSession: { btn: copyBtnAvg, textEl: copyTextAvg },
    newUsers: { btn: copyBtnNew, textEl: copyTextNew }
  };

  const mapItem = buttonMap[type];
  if (!mapItem) {
    return;
  }

  const { btn, textEl } = mapItem;

  navigator.clipboard.writeText(text).then(() => {
    textEl.textContent = 'Copied!';
    btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

    setTimeout(() => {
      textEl.textContent = 'Copy Table';
      btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }, 2000);
  }).catch(err => {
    console.error('Copy failed:', err);
    setStatus('Copy failed - please try again');
  });
}

/* -------------------------------------
   GSC QUERY GROWTH REPORT FUNCTIONS
   ------------------------------------- */

function loadGscSites() {
  if (!gscAccessToken) return;

  gscPropertySelect.disabled = true;
  gscPropertySelect.innerHTML = '<option value="">Loading GSC properties...</option>';

  fetch('https://www.googleapis.com/webmasters/v3/sites', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + gscAccessToken
    }
  })
    .then(r => r.json())
    .then(data => {
      const siteEntries = data.siteEntry || [];
      const allSites = siteEntries.filter(s => s.siteUrl);

      gscPropertySelect.innerHTML = '';

      if (!allSites.length) {
        gscPropertySelect.innerHTML =
          '<option value="">No GSC properties found</option>';
        gscPropertySelect.disabled = true;
        gscLoadBtn.disabled = true;
        setGscStatus('No GSC properties found.');
        return;
      }

      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Select a GSC property';
      placeholder.selected = true;
      gscPropertySelect.appendChild(placeholder);

      allSites.forEach(site => {
        const opt = document.createElement('option');
        opt.value = site.siteUrl;
        opt.textContent = site.siteUrl;
        gscPropertySelect.appendChild(opt);
      });

      gscPropertySelect.disabled = false;
      gscLoadBtn.disabled = true;
      setGscStatus('Select a property, then click Load GSC data.');
    })
    .catch(err => {
      console.error(err);
      gscPropertySelect.innerHTML = '<option value="">Error loading GSC properties</option>';
      gscPropertySelect.disabled = true;
      gscLoadBtn.disabled = true;
      setGscStatus('Error loading GSC properties.');
    });
}

function gscRequest(propertyUrl, startDate, endDate) {
  return fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + gscAccessToken },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 1000
      })
    }
  ).then(r => r.json());
}

function computeGscGrowth(cur, prev) {
  const prevMap = {};
  (prev.rows || []).forEach(r => {
    prevMap[r.keys[0]] = r.clicks || 0;
  });

  const results = (cur.rows || []).map(r => {
    const query = r.keys[0];
    const curClicks = r.clicks || 0;
    const prevClicks = prevMap[query] || 0;
    const diff = curClicks - prevClicks;
    return { query, curClicks, prevClicks, diff };
  });

  return results
    .filter(r => r.diff > 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 10);
}

function renderGscTable(rows, tbody) {
  tbody.innerHTML = '';
  if (!rows.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="4" class="empty-state">No queries found with growth</td>';
    tbody.appendChild(tr);
    return;
  }

  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.query}</td>
      <td>${r.curClicks}</td>
      <td>${r.prevClicks}</td>
      <td>+${r.diff}</td>
    `;
    tbody.appendChild(tr);
  });
}

function loadGscReports(gscPropertyUrl) {
  if (!gscAccessToken) {
    setGscStatus('Sign in to GSC first.');
    return;
  }

  setGscStatus('Loading GSC query reports...');

  const today = new Date();
  const offset = d => {
    const dt = new Date();
    dt.setDate(today.getDate() - d);
    return dt.toISOString().split('T')[0];
  };

  Promise.all([
    gscRequest(gscPropertyUrl, offset(7), offset(1)),
    gscRequest(gscPropertyUrl, offset(14), offset(8))
  ]).then(([cur, prev]) => {
    const rows = computeGscGrowth(cur, prev);
    gscTableData.wow = rows;
    renderGscTable(rows, gscWowBody);
  }).catch(err => {
    console.error(err);
  });

  Promise.all([
    gscRequest(gscPropertyUrl, offset(28), offset(1)),
    gscRequest(gscPropertyUrl, offset(56), offset(29))
  ]).then(([cur, prev]) => {
    const rows = computeGscGrowth(cur, prev);
    gscTableData.mom = rows;
    renderGscTable(rows, gscMomBody);
  }).catch(err => {
    console.error(err);
  });

  Promise.all([
    gscRequest(gscPropertyUrl, offset(365), offset(1)),
    gscRequest(gscPropertyUrl, offset(730), offset(366))
  ]).then(([cur, prev]) => {
    const rows = computeGscGrowth(cur, prev);
    gscTableData.yoy = rows;
    renderGscTable(rows, gscYoyBody);
    setGscStatus('All GSC query reports loaded.');
  }).catch(err => {
    console.error(err);
    setGscStatus('Error loading GSC query data.');
  });
}

function copyGscTableToClipboard(type) {
  const data = gscTableData[type] || [];

  if (!data.length) {
    setGscStatus('No GSC data to copy');
    return;
  }

  let label;
  if (type === 'wow') label = 'WoW Growth (Clicks)';
  else if (type === 'mom') label = 'MoM Growth (Clicks)';
  else if (type === 'yoy') label = 'YoY Growth (Clicks)';
  else label = 'Growth (Clicks)';

  let text = `Search Query\tLast Period Clicks\tPrevious Period Clicks\t${label}\n`;

  data.forEach(r => {
    text += `${r.query}\t${r.curClicks}\t${r.prevClicks}\t+${r.diff}\n`;
  });

  const buttonMap = {
    wow: { btn: copyBtnGscWow, textEl: copyTextGscWow },
    mom: { btn: copyBtnGscMom, textEl: copyTextGscMom },
    yoy: { btn: copyBtnGscYoy, textEl: copyTextGscYoy }
  };

  const mapItem = buttonMap[type];
  if (!mapItem) return;

  const { btn, textEl } = mapItem;

  navigator.clipboard.writeText(text).then(() => {
    textEl.textContent = 'Copied!';
    btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

    setTimeout(() => {
      textEl.textContent = 'Copy Table';
      btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }, 2000);
  }).catch(err => {
    console.error('Copy failed:', err);
    setGscStatus('Copy failed - please try again');
  });
}

window.initOAuth = initOAuth;

