export function renderIndex() {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>OSMR - Ostrołęcki System Monitorowania Radiacyjnego</title>
<link rel="icon" type="image/png" href="https://icmt.cc/p/rad-the-local-radiaton-website/favicon_hu_dc0b661d74b90e4d.png" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
  :root {
    /* Modern Light Theme Palette */
    --bg: #f8fafc;
    --card: #ffffff;
    --accent: #2563eb;
    --accent-hover: #1d4ed8;
    --accent-light: #eff6ff;
    --text: #0f172a;
    --text-muted: #64748b;
    --border: #e2e8f0;
    
    /* Status Colors */
    --status-safe: #10b981;
    --status-safe-bg: #d1fae5;
    --status-caution: #f59e0b;
    --status-caution-bg: #fef3c7;
    --status-high: #f97316;
    --status-high-bg: #ffedd5;
    --status-danger: #ef4444;
    --status-danger-bg: #fee2e2;
  }

  /* Dark Theme Palette */
  html.dark {
    --bg: #0f172a;
    --card: #1e293b;
    --accent: #3b82f6;
    --accent-hover: #60a5fa;
    --accent-light: #1e3a8a;
    --text: #f8fafc;
    --text-muted: #94a3b8;
    --border: #334155;

    --status-safe-bg: #064e3b;
    --status-caution-bg: #78350f;
    --status-high-bg: #7c2d12;
    --status-danger-bg: #7f1d1d;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    margin: 0;
    padding: 2rem 1rem;
    line-height: 1.5;
  }

  .container {
    max-width: 768px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* Animations */
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade {
    opacity: 0;
    animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.2s; }
  .delay-3 { animation-delay: 0.3s; }
  .delay-4 { animation-delay: 0.4s; }

  /* Header */
  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid var(--border);
    padding-bottom: 1rem;
  }
  .header-left { display: flex; align-items: center; gap: 0.75rem; }
  .header-logo {
    width: 32px; height: 32px;
    background: var(--accent); color: white;
    border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold;
  }
  .app-header h1 {
    font-weight: 700;
    font-size: 1.25rem;
    color: var(--text);
    margin: 0;
    line-height: 1.2;
  }
  .app-header .subtitle {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Buttons */
  .btn-group { display: flex; gap: 0.5rem; }
  .btn {
    background: var(--card); border: 1px solid var(--border);
    color: var(--text-muted); padding: 0.4rem 0.75rem; border-radius: 8px;
    font-weight: 600; font-size: 0.85rem; font-family: inherit; cursor: pointer;
    transition: all 0.2s ease; box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
    display: flex; align-items: center; gap: 0.4rem;
  }
  .btn:hover { background: var(--bg); color: var(--text); border-color: var(--text-muted); }
  .btn.active { color: var(--accent); border-color: var(--accent); background: var(--accent-light); }

  /* Cards */
  .card {
    background: var(--card);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
    border: 1px solid var(--border);
  }

  /* KPI Grid */
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; }
  .kpi-card { display: flex; flex-direction: column; justify-content: center; }
  .kpi-label { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.5rem; }
  .kpi-value-wrap { display: flex; align-items: baseline; gap: 0.25rem; }
  .kpi-value { font-size: 2.75rem; font-weight: 800; color: var(--accent); letter-spacing: -0.02em; line-height: 1; transition: color 0.4s ease; }
  .kpi-unit { font-size: 1rem; font-weight: 600; color: var(--text-muted); }
  .kpi-meta { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem; display: flex; align-items: center; gap: 0.25rem;}

  /* Status Legend / Badges */
  .status-legend { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem; }
  .badge {
    padding: 0.35rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; 
    border: 1px solid var(--border); display: flex; align-items: center; gap: 0.35rem; color: var(--text-muted);
  }
  .badge-dot { width: 8px; height: 8px; border-radius: 50%; }

  .bg-safe { background: var(--status-safe); }
  .bg-caution { background: var(--status-caution); }
  .bg-high { background: var(--status-high); }
  .bg-danger { background: var(--status-danger); }

  /* Chart Layout */
  .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .chart-title { font-size: 1rem; font-weight: 600; margin: 0; }
  select {
    background: var(--card); border: 1px solid var(--border); padding: 0.4rem 2rem 0.4rem 1rem; 
    border-radius: 8px; font-weight: 500; font-size: 0.85rem; color: var(--text); cursor: pointer; appearance: none;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.05); font-family: inherit;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat; background-position: right 0.5rem center; background-size: 1em;
  }
  .chart-container { position: relative; height: 300px; width: 100%; }

  /* Info / Pitch Section */
  .info-content { font-size: 0.95rem; line-height: 1.6; color: var(--text-muted); }
  .info-content h2 { font-size: 1.15rem; color: var(--text); font-weight: 700; margin-top: 0; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
  .info-content h2::before { content: ""; display: block; width: 4px; height: 1.15rem; background: var(--accent); border-radius: 2px; }
  .info-content strong { color: var(--text); font-weight: 600; }
  
  .benefits-list { list-style: none; padding: 0; margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
  .benefits-list li { display: flex; align-items: flex-start; gap: 0.75rem; }
  .benefits-list li::before { content: "✓"; display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; background: var(--status-safe-bg); color: var(--status-safe); font-size: 0.75rem; font-weight: bold; flex-shrink: 0; margin-top: 0.15rem; }

  /* Partner Box */
  .partner-box {
    margin-top: 2rem; border: 2px dashed var(--border); border-radius: 12px; padding: 2rem;
    text-align: center; background: var(--bg); transition: all 0.3s ease;
  }
  .partner-box:hover { border-color: var(--accent); background: var(--accent-light); }
  .partner-box h3 { margin: 0 0 0.5rem; font-size: 1rem; color: var(--text); }
  .partner-box p { margin: 0; font-size: 0.85rem; color: var(--text-muted); }

  /* Footer & Disclaimers */
  .disclaimer { font-size: 0.8rem; color: var(--text-muted); padding-top: 1.5rem; border-top: 1px solid var(--border); margin-top: 1.5rem; }
  footer { margin-top: 1rem; font-size: 0.85rem; color: var(--text-muted); text-align: center; padding-bottom: 2rem;}
  footer a { color: var(--accent); text-decoration: none; font-weight: 500; }
  footer a:hover { text-decoration: underline; }

  /* Offline Alert */
  .offline-alert {
    background: var(--status-danger-bg); color: #991b1b; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #f87171;
    font-size: 0.85rem; font-weight: 600; display: none; align-items: center; gap: 0.5rem; margin-bottom: 1rem;
  }

</style>
</head>
<body>

<div class="container">
  
  <!-- Header -->
  <header class="app-header animate-fade">
    <div class="header-left">
      <div class="header-logo">OSMR</div>
      <div>
        <div class="subtitle">Smart City Dashboard &bull; Ostrołęka</div>
        <h1 id="mainTitle">Ostrołęcki System Monitorowania Radiacyjnego</h1>
      </div>
    </div>
    <div class="btn-group">
      <button id="themeToggle" class="btn">🌙</button>
      <button id="notifToggle" class="btn" data-i18n="notifyOff">🔔 Powiadomienia: Wył</button>
      <button id="langToggle" class="btn">🌐 PL</button>
    </div>
  </header>

  <div id="offline" class="offline-alert animate-fade"></div>

  <!-- Key Performance Indicators -->
  <div class="kpi-grid animate-fade delay-1">
    
    <div class="card kpi-card">
      <div class="kpi-label" data-i18n="instantLabel">Odczyt Bieżący</div>
      <div class="kpi-value-wrap">
        <div id="instant" class="kpi-value">--</div>
        <div class="kpi-unit">µSv/h</div>
      </div>
      <div class="kpi-meta">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <span data-i18n="cpmLabel">CPM:</span> <strong id="cpm">--</strong>
      </div>
    </div>

    <div class="card kpi-card">
      <div class="kpi-label" data-i18n="avgLabel">Średnia (1h)</div>
      <div class="kpi-value-wrap">
        <div id="avg" class="kpi-value" style="color: var(--text);">--</div>
        <div class="kpi-unit">µSv/h</div>
      </div>
      <div class="status-legend">
        <div class="badge"><div class="badge-dot bg-safe"></div> <span data-i18n="safe">Bezpiecznie (0-0.3)</span></div>
        <div class="badge"><div class="badge-dot bg-caution"></div> <span data-i18n="caution">Uwaga (0.3-1)</span></div>
        <div class="badge"><div class="badge-dot bg-high"></div> <span data-i18n="high">Wysokie (1-5)</span></div>
        <div class="badge"><div class="badge-dot bg-danger"></div> <span data-i18n="danger">Niebezp. (>5)</span></div>
      </div>
    </div>
  </div>

  <!-- Chart Configuration -->
  <div class="card animate-fade delay-2">
    <div class="chart-header">
      <h2 class="chart-title" data-i18n="trendLabel">Trend Zmian</h2>
      <select id="range">
        <option value="1hr" selected data-i18n="range1h">Ostatnia 1 godzina</option>
        <option value="10hr" data-i18n="range10h">Ostatnie 10 godzin</option>
        <option value="10day" data-i18n="range10d">Ostatnie 10 dni</option>
        <option value="50day" data-i18n="range50d">Ostatnie 50 dni</option>
      </select>
    </div>
    <div class="chart-container">
      <canvas id="chart"></canvas>
    </div>
  </div>

  <!-- Pitch / About Details -->
  <div class="card info-content animate-fade delay-3">
    <h2>O projekcie</h2>
    <p><strong>OSMR (Ostrołęcki System Monitorowania Radiacyjnego)</strong> to niezależna i w pełni funkcjonalna stacja pomiarowa działająca w Ostrołęce <strong>nieprzerwanie od ponad 3 lat</strong>. Jej celem jest całodobowe dostarczanie otwartych danych środowiskowych o poziomie promieniowania jonizującego w naszym mieście.</p>
    
    <h2 style="margin-top: 1.5rem;">Czym jest Promieniowanie Tła?</h2>
    <p>Naturalne promieniowanie przestrzeni w Ostrołęce i na całym Mazowszu zazwyczaj znajduje się w granicach <strong>0.10 - 0.25 µSv/h</strong> (mikrosiwertów na godzinę). Pochodzi ono bezpośrednio z kosmosu oraz naturalnych pierwiastków obecnych w środowisku. Granice te to <strong>część całkowicie zdrowej normy</strong>, stąd dorywcze wahania nawet w okolice 0.40 µSv nie powinny być powodem do niepokoju.</p>
    
    <h2 style="margin-top: 1.5rem;">Korzyści dla Inicjatywy Smart City</h2>
    <p>Inwestycja i zaangażowanie miasta w już istniejącą, solidną lokalną infrastrukturę otwiera szerokie pole korzyści społecznych dla Miasta i Obywateli:</p>
    <ul class="benefits-list">
      <li><strong>Pionierstwo Wizerunkowe:</strong> Bezkonkurencyjnie wznosi Ostrołękę w poczet projektów "Smart City" dzięki udostępnianiu danych na żywo.</li>
      <li><strong>Edukacja Ekologiczna:</strong> Łatwa i błyskawiczna weryfikacja danych z niezależnego źródła buduje spokój ducha (szczególnie istotne obok Elektrowni).</li>
      <li><strong>Narzędzie Sztabu Kryzysowego:</strong> Nasz nowoczesny framework pozwala na udostępnienie dedykowanego wpięcia (API) do wewnątrz miejskich systemów powiadamiań.</li>
      <li><strong>Edukacja W Szkole:</strong> Otwarty dostęp do archiwum wykresów to znakomite, realne narządzie analityczne dla uczniów lokalnych techników i liceów uczących się fizyki i matematyki.</li>
    </ul>

    <div class="partner-box">
      <h3>Możliwość Partnerstwa Regionalnego</h3>
      <p style="margin-bottom: 1.25rem;">Zaufanie i ciągłość wdrażania technologii to klucz sukcesu nowoczesnego miasta. Czekamy na kontakt z oficjalnymi wydziałami Urzędu Miasta.</p>
      
      <div style="padding: 1rem 1.5rem; border: 1px solid var(--border); border-radius: 8px; background: var(--card); font-weight: 600; color: var(--text); display: inline-flex; align-items: center; justify-content: center; gap: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); text-align: left; line-height: 1.2;">
        <div style="width: 40px; height: 48px; background: #fef08a; border: 2px solid #eab308; border-radius: 4px; display:flex; align-items:center; justify-content:center; color: #854d0e; font-size:10px; font-weight: bold; flex-shrink: 0;" title="Herb Ostrołęki">HERB</div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.2rem;">Wizualizacja Partnerstwa</div>
          <div style="font-size: 1rem;">Projekt wspierany przez Urząd Miasta Ostrołęki</div>
        </div>
      </div>
    </div>

    <div class="disclaimer">
      <strong>Kwestia Atestacji Metodologicznej:</strong> System korzysta z profesjonalnych tub Geigera-Müllera zdolnych monitorować promieniowanie na bieżąco, wykonując kalibracje do stałego CPM. Podkreślamy, że oficjalnym instytucjonalnym organem Państwowym do wysyłania ogólnokrajowych, ewakuacyjnych alertów kryzysowych prawnie pozostaje zawsze PAA.
    </div>
  </div>

</div>

<script>
(() => {
  "use strict";

  let notifOn = false;
  let currentLang = "pl";
  
  const ctx = document.getElementById("chart").getContext("2d");
  const offlineEl = document.getElementById("offline");

  // Init Theme
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }

  const updateChartTheme = () => {
    if (typeof chart === 'undefined') return;
    const isDark = document.documentElement.classList.contains("dark");
    chart.options.scales.y.grid.color = isDark ? "#334155" : "#f1f5f9";
    chart.options.plugins.tooltip.backgroundColor = isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.9)';
    chart.update();
  };

  // Create awesome gradient fill for the chart line
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)'); // var(--accent)
  gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');

  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "µSv/h",
          data: [],
          borderColor: "#2563eb",
          backgroundColor: gradient,
          borderWidth: 2,
          pointRadius: 0, // hide dots for cleaner look, show on hover
          pointHoverRadius: 4,
          tension: 0.4, // smooth bezier curves!
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { 
          grid: { display: false, drawBorder: false },
          ticks: { color: "#94a3b8", maxTicksLimit: 8 }
        },
        y: { 
          grid: { color: "#f1f5f9", drawBorder: false },
          ticks: { color: "#94a3b8" },
          beginAtZero: true 
        },
      },
      plugins: { 
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { family: 'Inter', size: 13 },
          bodyFont: { family: 'Inter', size: 13, weight: 'bold' },
          padding: 10,
          cornerRadius: 8,
          displayColors: false
        }
      },
    },
  });

  updateChartTheme();

  const translations = {
    pl: {
      title: "OSMR - Ostrołęcki System Monitorowania Radiacyjnego",
      instantLabel: "Odczyt Bieżący",
      avgLabel: "Średnia (1h)",
      cpmLabel: "CPM:",
      safe: "Bezpiecznie (0-0.3)",
      caution: "Uwaga (0.3-1)",
      high: "Wysokie (1-5)",
      danger: "Niebezp. (>5)",
      trendLabel: "Trend Zmian",
      range1h: "Ostatnia 1 godzina",
      range10h: "Ostatnie 10 godzin",
      range10d: "Ostatnie 10 dni",
      range50d: "Ostatnie 50 dni",
      more: "Szczegóły Inżynieryjne Tutaj",
      notifyOn: "🔔 Powiadomienia: Wł",
      notifyOff: "🔔 Powiadomienia: Wył",
      offline: "Brak łączności z bazą od",
      themeDark: "🌙 Ciemny",
      themeLight: "☀️ Jasny"
    },
    en: {
      title: "OSMR - Ostrołęka Radiation Monitoring System",
      instantLabel: "Current Reading",
      avgLabel: "Average (1h)",
      cpmLabel: "CPM:",
      safe: "Safe (0-0.3)",
      caution: "Caution (0.3-1)",
      high: "High (1-5)",
      danger: "Danger (>5)",
      trendLabel: "Data Trends",
      range1h: "Last 1 hour",
      range10h: "Last 10 hours",
      range10d: "Last 10 days",
      range50d: "Last 50 days",
      more: "Engineering Details Here",
      notifyOn: "🔔 Notify: On",
      notifyOff: "🔔 Notify: Off",
      offline: "Station offline for",
      themeDark: "🌙 Dark",
      themeLight: "☀️ Light"
    }
  };

  const formatAgo = (ms) => {
    const s = Math.floor(ms / 1000);
    if (s < 60) return s + "s";
    const m = Math.floor(s / 60);
    return m + "m " + (s % 60) + "s";
  };

  const getColor = (usv) => {
    if (usv <= 0.3) return "var(--status-safe)";
    if (usv <= 1) return "var(--status-caution)";
    if (usv <= 5) return "var(--status-high)";
    return "var(--status-danger)";
  };

  // Helper function to animate number counting up
  const animateValue = (obj, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // smooth ease out
      const easeOut = progress * (2 - progress);
      const current = (progress === 1) ? end : start + (end - start) * easeOut;
      
      // Keep integer format if max value is integer (like CPM), otherwise keep decimals
      obj.innerHTML = (end % 1 !== 0) ? current.toFixed(3) : Math.floor(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };
  
  let lastInstant = 0;
  let lastAvg = 0;
  let lastCpm = 0;

  const fetchLatest = async () => {
    try {
      const r = await fetch("/latest");
      const d = await r.json();
      
      const instantEl = document.getElementById("instant");
      const avgEl = document.getElementById("avg");
      const cpmEl = document.getElementById("cpm");
      
      // Color Logic
      const instantColor = getColor(d.instant_usv);
      instantEl.style.color = instantColor;

      // Animate Numbers beautifully
      animateValue(instantEl, lastInstant, d.instant_usv, 800);
      animateValue(avgEl, lastAvg, d.avg_usv, 800);
      animateValue(cpmEl, lastCpm, d.cpm, 800);
      
      lastInstant = d.instant_usv;
      lastAvg = d.avg_usv;
      lastCpm = d.cpm;

      // Chart line color matches danger level, defaults to accent blue if safe
      const isDark = document.documentElement.classList.contains("dark");
      chart.data.datasets[0].borderColor = (d.instant_usv <= 0.3) ? (isDark ? "#3b82f6" : "#2563eb") : instantColor;
      chart.update();

      if (d.offline) {
        offlineEl.style.display = "flex";
        offlineEl.innerHTML = "⚠️ " + translations[currentLang].offline + " " + formatAgo(d.lastSeenAgo);
      } else {
        offlineEl.style.display = "none";
      }

      if (notifOn && d.instant_usv > 0.5) {
        new Notification("Radiation Alert", {
          body: d.instant_usv.toFixed(3) + " µSv/h",
        });
      }
    } catch (e) {
      console.error("Failed to fetch latest:", e);
    }
  };

  const fetchHistory = async () => {
    try {
      const w = document.getElementById("range").value;
      const r = await fetch("/history?window=" + w);
      const d = await r.json();
      const points = d.data.map((row) => ({
        x: new Date(row.ts),
        y: row.usv,
      }));
      chart.data.labels = points.map((p) => p.x.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
      chart.data.datasets[0].data = points.map((p) => p.y);
      chart.update();
    } catch (e) {
      console.error("Failed to fetch history:", e);
    }
  };

  const applyLang = (lang) => {
    const t = translations[lang] || translations["pl"];
    document.title = t.title;
    document.getElementById("mainTitle").textContent = t.title;
    document.getElementById("langToggle").textContent = "🌐 " + lang.toUpperCase();
    
    // Auto-map translations to text nodes
    const attrFields = ["instantLabel", "avgLabel", "cpmLabel", "safe", "caution", "high", "danger", "trendLabel", "range1h", "range10h", "range10d", "range50d", "more"];
    attrFields.forEach(f => {
      const el = document.querySelector("[data-i18n='" + f + "']");
      if (el) el.textContent = t[f];
    });
    
    // Toggle active state styling on the language button
    document.getElementById("notifToggle").textContent = notifOn ? t.notifyOn : t.notifyOff;

    const isDark = document.documentElement.classList.contains('dark');
    document.getElementById("themeToggle").textContent = isDark ? t.themeLight : t.themeDark;
  };

  document.addEventListener("DOMContentLoaded", () => {
    applyLang(currentLang);
    
    document.getElementById("themeToggle").addEventListener("click", () => {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.theme = isDark ? 'dark' : 'light';
      applyLang(currentLang);
      updateChartTheme();
      fetchLatest(); // refresh line color
    });

    document.getElementById("langToggle").addEventListener("click", () => {
      const langs = Object.keys(translations);
      const i = langs.indexOf(currentLang);
      currentLang = langs[(i + 1) % langs.length];
      applyLang(currentLang);
    });

    document.getElementById("notifToggle").addEventListener("click", async (e) => {
      if (!notifOn) await Notification.requestPermission();
      notifOn = !notifOn;
      const t = translations[currentLang];
      e.target.textContent = notifOn ? t.notifyOn : t.notifyOff;
      e.target.classList.toggle("active", notifOn);
    });

    document.getElementById("range").addEventListener("change", fetchHistory);

    setInterval(fetchLatest, 2000);
    setInterval(fetchHistory, 300000);
    fetchLatest();
    fetchHistory();
  });
})();
</script>
</body>
</html>`;
}
