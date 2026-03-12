let attempts = 0;
const maxSearchesPerDay = 1; // Daily limit

window.addEventListener("load", () => {
  const startup = document.getElementById("startupSound");
  if (startup) startup.play().catch(e => console.log("Startup sound blocked:", e));
});

// ---------------- DISCLAIMER ----------------
function acceptDisclaimer() {
  document.getElementById("disclaimerScreen").style.display = "none";
  document.getElementById("loginScreen").style.display = "flex";
}

// ---------------- LOGIN ----------------
function checkPassword() {
  const password = document.getElementById("passwordInput").value;
  if (password === "Avenue-11") { // Your password
    document.getElementById("loginScreen").style.display = "none";
    startBoot();
  } else {
    attempts++;
    document.getElementById("loginError").innerText = "🚫 ACCESS DENIED - Attempt " + attempts + " / 3";
    if (attempts >= 3) document.getElementById("loginError").innerText = "🔒 SYSTEM LOCKED";
  }
}

// ---------------- BOOT SCREEN ----------------
function startBoot() {
  const boot = document.getElementById("bootScreen");
  boot.style.display = "flex";
  const logs = [
    "🔐 Authenticating user...",
    "🛰 Connecting to phone intelligence network...",
    "📡 Syncing national phone database...",
    "⚙ Loading radar modules...",
    "📱 Initializing phone lookup engine...",
    "✅ Access granted"
  ];
  let line = 0;
  const logBox = document.getElementById("bootLog");

  function typeLine() {
    if (line < logs.length) {
      let text = logs[line];
      let char = 0;
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
      setTimeout(() => {
        boot.style.display = "none";
        document.getElementById("app").style.display = "flex";
      }, 1000);
    }
  }
  typeLine();
}

// ---------------- PHONE LOOKUP ----------------
async function fetchPhone() {
  const today = new Date().toDateString();
  let searches = JSON.parse(localStorage.getItem("phoneSearches")) || {};
  if (searches.date !== today) {
    searches = { date: today, count: 0 };
  }
  if (searches.count >= maxSearchesPerDay) {
    alert("❌ You have reached the maximum of 1 search today.");
    return;
  }

  const phone = document.getElementById("phoneInput").value.trim();
  if (!phone) return alert("⚠ Please enter a phone number.");

  searches.count++;
  searches.date = today;
  localStorage.setItem("phoneSearches", JSON.stringify(searches));

  const radar = document.getElementById("radarScan");
  const result = document.getElementById("result");
  radar.style.display = "block";

  // Play scan sound
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

      if (!response.ok) throw new Error("API error");

      const data = await response.json();
      radar.style.display = "none";

      let riskLevel = "LOW";
      let riskClass = "low";

      // Simple risk indicator example
      if (data.type && data.type.toLowerCase().includes("spam")) {
        riskLevel = "HIGH";
        riskClass = "high";
      } else if (data.type && data.type.toLowerCase().includes("unknown")) {
        riskLevel = "MEDIUM";
        riskClass = "medium";
      }

      document.getElementById("riskIndicator").innerHTML = `<h4 class="${riskClass}">⚠ RISK LEVEL : ${riskLevel}</h4>`;

      result.innerText =
`Phone : ${phone}
Name : ${data.name || "Not Found"}
Carrier : ${data.carrier || "Unknown"}
Location : ${data.location || "Unknown"}
Type : ${data.type || "Unknown"}`;

    } catch (err) {
      radar.style.display = "none";
      result.innerText = "❌ Phone Data Error or API Limit Reached";
    }
  }, 2500);
}
