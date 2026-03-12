let attempts = 0;
const maxSearchesPerDay = 1;        // 1 search per day
const maxSearchesPerMonth = 15;     // 15 searches per month (free plan)

window.addEventListener("load", () => {
  const startup = document.getElementById("startupSound");
  if (startup) startup.play().catch(e => console.log("Startup sound blocked:", e));
});

// DISCLAIMER
function acceptDisclaimer() {
  document.getElementById("disclaimerScreen").style.display = "none";
  document.getElementById("loginScreen").style.display = "flex";
}

/* LOGIN */
function checkPassword() {
  const password = document.getElementById("passwordInput").value;
  if (password === "Avneue-11") {
    document.getElementById("loginScreen").style.display = "none";
    startBoot();
  } else {
    attempts++;
    document.getElementById("loginError").innerText = "🚫 ACCESS DENIED - Attempt " + attempts + " / 3";
    if (attempts >= 3) document.getElementById("loginError").innerText = "🔒 SYSTEM LOCKED";
  }
}

/* BOOT */
function startBoot() {
  const boot = document.getElementById("bootScreen");
  boot.style.display = "flex";
  const logs = [
    "🔐 Authenticating user...",
    "🛰 Connecting to phone intelligence network...",
    "📡 Syncing national phone database...",
    "⚙ Loading radar modules...",
    "📞 Initializing phone lookup engine...",
    "✅ Access granted"
  ];
  let line = 0;
  const logBox = document.getElementById("bootLog");
  function typeLine() {
    if (line < logs.length) {
      let text = logs[line]; let char = 0;
      const typing = setInterval(() => {
        logBox.innerHTML += text.charAt(char);
        char++;
        if (char >= text.length) {
          clearInterval(typing);
          logBox.innerHTML += "\n";
          line++;
          setTimeout(typeLine, 500);
        }
      }, 30);
    } else {
      setTimeout(() => { boot.style.display = "none"; document.getElementById("app").style.display = "flex"; }, 1000);
    }
  }
  typeLine();
}

/* PHONE LOOKUP WITH DAILY + MONTHLY LIMIT */
async function fetchPhone() {
  const now = new Date();
  const todayKey = now.toDateString();            // Daily key
  const monthKey = now.getFullYear() + "-" + (now.getMonth() + 1); // YYYY-MM for monthly

  let searches = JSON.parse(localStorage.getItem("phoneSearches")) || {};
  
  // Reset daily count if new day
  if (searches.day !== todayKey) { searches.dayCount = 0; searches.day = todayKey; }
  // Reset monthly count if new month
  if (searches.month !== monthKey) { searches.monthCount = 0; searches.month = monthKey; }

  // Check daily limit
  if (searches.dayCount >= maxSearchesPerDay) {
    alert("❌ You can only search **1 phone number per day**. Come back tomorrow!");
    return;
  }

  // Check monthly limit
  if (searches.monthCount >= maxSearchesPerMonth) {
    alert("❌ You have reached the 15 searches/month limit. Come back next month!");
    return;
  }

  searches.dayCount++;
  searches.monthCount++;
  localStorage.setItem("phoneSearches", JSON.stringify(searches));

  const phone = document.getElementById("phoneInput").value.trim();
  if (!phone) { alert("Enter phone number!"); return; }

  const radar = document.getElementById("radarScan");
  const result = document.getElementById("result");
  radar.style.display = "block";

  // PLAY SCAN SOUND
  const scanSound = document.getElementById("scanSound");
  if (scanSound) scanSound.play().catch(e => console.log("Scan sound blocked:", e));

  setTimeout(async () => {
    try {
      const response = await fetch(`https://caller-id-social-search-eyecon.p.rapidapi.com/image?phone=${encodeURIComponent(phone)}`, {
        method: "GET",
        headers: {
          "x-rapidapi-host": "caller-id-social-search-eyecon.p.rapidapi.com",
          "x-rapidapi-key": "aec6b3fb2cmsh990d6909cde5bb3p197f14jsn0239d9256cce" // your token
        }
      });
      const data = await response.json();
      radar.style.display = "none";

      let html = `Phone : ${phone}\n`;
      if (data.name) html += `Name : ${data.name}\n`;
      if (data.country) html += `Country : ${data.country}\n`;
      if (data.carrier) html += `Carrier : ${data.carrier}\n`;
      if (data.address) html += `Address : ${data.address}\n`;
      if (data.image) html += `<img src="${data.image}" alt="Caller Image">`;
      result.innerHTML = html;

      // HISTORY
      const history = JSON.parse(localStorage.getItem("phoneHistory")) || [];
      history.unshift(`${phone} - ${data.name || "Unknown"}`);
      localStorage.setItem("phoneHistory", JSON.stringify(history));
      renderHistory();

    } catch {
      radar.style.display = "none";
      result.innerText = "Error fetching phone data!";
    }
  }, 2500);
}

/* RENDER HISTORY */
function renderHistory() {
  const historyUl = document.getElementById("history");
  historyUl.innerHTML = "";
  const history = JSON.parse(localStorage.getItem("phoneHistory")) || [];
  history.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    historyUl.appendChild(li);
  });
}

// Initialize history on load
window.onload = function () {
  const history = JSON.parse(localStorage.getItem("phoneHistory")) || [];
  if (history.length > 0) renderHistory();
};
