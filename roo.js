// ------------------------------
// 1. TAB SWITCHING
// ------------------------------
document.querySelectorAll(".tab-button").forEach(button => {
  button.addEventListener("click", () => {
    const target = button.getAttribute("data-tab-target");

    document.querySelectorAll(".tab-button").forEach(btn =>
      btn.classList.remove("active")
    );
    button.classList.add("active");

    document.querySelectorAll(".tab-panel").forEach(panel => {
      panel.classList.remove("active");
    });
    document.getElementById(target).classList.add("active");
  });
});

// ------------------------------
// 2. HELP BOX TOGGLE
// ------------------------------
const helpTrigger = document.getElementById("ga4-help-trigger");
const helpBox = document.getElementById("ga4-help-box");
if (helpTrigger) {
  helpTrigger.addEventListener("click", () => {
    helpBox.style.display =
      helpBox.style.display === "block" ? "none" : "block";
  });
}

// ------------------------------
// 3. GOOGLE OAUTH INITIALISATION
// ------------------------------
let accessTokenGA = null;
let accessTokenGSC = null;

function initOAuth() {
  google.accounts.oauth2.initTokenClient({
    client_id: "YOUR_GOOGLE_CLIENT_ID",
    scope: "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly",
    callback: tokenResponse => {
      console.log("OAuth success", tokenResponse);
    }
  });
}

// GA4 sign in
document.getElementById("ga-signin").addEventListener("click", () => {
  google.accounts.oauth2
    .initTokenClient({
      client_id: "YOUR_GOOGLE_CLIENT_ID",
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      callback: response => {
        accessTokenGA = response.access_token;
        document.getElementById("ga-status").style.display = "inline-flex";
        document.getElementById("ga-status").textContent = "Connected";
        document.getElementById("ga-signout").style.display = "inline-flex";
        loadGAAccounts();
      }
    })
    .requestAccessToken();
});

// GSC sign in
document.getElementById("gsc-signin").addEventListener("click", () => {
  google.accounts.oauth2
    .initTokenClient({
      client_id: "YOUR_GOOGLE_CLIENT_ID",
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      callback: response => {
        accessTokenGSC = response.access_token;
        document.getElementById("gsc-status").style.display = "inline-flex";
        document.getElementById("gsc-status").textContent = "Connected";
        document.getElementById("gsc-signout").style.display = "inline-flex";
        loadGSCProperties();
      }
    })
    .requestAccessToken();
});

// ------------------------------
// 4. LOAD GA4 ACCOUNTS
// ------------------------------
async function loadGAAccounts() {
  const select = document.getElementById("ga-account-select");
  select.innerHTML = `<option>Loading…</option>`;

  const res = await fetch("https://analyticsadmin.googleapis.com/v1beta/accounts", {
    headers: { Authorization: `Bearer ${accessTokenGA}` }
  });
  const data = await res.json();

  select.innerHTML = "";
  if (!data.accounts) return;

  data.accounts.forEach(acc => {
    const opt = document.createElement("option");
    opt.value = acc.name;
    opt.textContent = acc.displayName;
    select.appendChild(opt);
  });

  document.getElementById("ga-property-select").disabled = false;
}

// ------------------------------
// 5. LOAD GA4 PROPERTIES
// ------------------------------
document.getElementById("ga-account-select").addEventListener("change", async e => {
  const parent = e.target.value;
  const select = document.getElementById("ga-property-select");

  select.innerHTML = `<option>Loading properties…</option>`;

  const res = await fetch(
    `https://analyticsadmin.googleapis.com/v1beta/${parent}/properties`,
    {
      headers: { Authorization: `Bearer ${accessTokenGA}` }
    }
  );
  const data = await res.json();

  select.innerHTML = "";
  if (!data.properties) return;

  data.properties.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.name;
    opt.textContent = p.displayName;
    select.appendChild(opt);
  });

  document.getElementById("ga-load").disabled = false;
});

// ------------------------------
// 6. LOAD GSC PROPERTIES
// ------------------------------
async function loadGSCProperties() {
  const select = document.getElementById("gsc-property-select");
  select.innerHTML = `<option>Loading…</option>`;

  const res = await fetch(
    "https://www.googleapis.com/webmasters/v3/sites",
    {
      headers: { Authorization: `Bearer ${accessTokenGSC}` }
    }
  );
  const data = await res.json();

  select.innerHTML = "";
  if (!data.siteEntry) return;

  data.siteEntry.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.siteUrl;
    opt.textContent = s.siteUrl;
    select.appendChild(opt);
  });

  select.disabled = false;
  document.getElementById("gsc-load").disabled = false;
}

// ------------------------------
// 7. COPY TABLE BUTTONS
// ------------------------------
function copyTable(tableId, btnTextId) {
  const table = document.getElementById(tableId).outerHTML;
  navigator.clipboard.writeText(table);
  const btn = document.getElementById(btnTextId);
  btn.textContent = "Copied";
  setTimeout(() => (btn.textContent = "Copy table"), 1500);
}

document.getElementById("copy-btn-mom").onclick = () =>
  copyTable("ga-table-mom", "copy-text-mom");
document.getElementById("copy-btn-wow").onclick = () =>
  copyTable("ga-table-wow", "copy-text-wow");
document.getElementById("copy-btn-yoy").onclick = () =>
  copyTable("ga-table-yoy", "copy-text-yoy");

document.getElementById("copy-btn-avg").onclick = () =>
  copyTable("ga-table-avg", "copy-text-avg");
document.getElementById("copy-btn-new").onclick = () =>
  copyTable("ga-table-new", "copy-text-new");

document.getElementById("copy-btn-gsc-wow").onclick = () =>
  copyTable("gsc-wow-table", "copy-text-gsc-wow");
document.getElementById("copy-btn-gsc-mom").onclick = () =>
  copyTable("gsc-mom-table", "copy-text-gsc-mom");
document.getElementById("copy-btn-gsc-yoy").onclick = () =>
  copyTable("gsc-yoy-table", "copy-text-gsc-yoy");
