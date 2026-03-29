const INDEX_HTML = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://rad.icmt.cc https://cloudflareinsights.com; img-src 'self' data: https://icmt.cc;">
<title>OSMR - Ostrołęcki System Monitorowania Radiacyjnego</title>
<link rel="icon" type="image/png" href="https://icmt.cc/p/rad-the-local-radiaton-website/favicon_hu_dc0b661d74b90e4d.png" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" as="style">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"></noscript>
<link rel="preload" href="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js" as="script" crossorigin>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js" crossorigin defer><\/script>
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
    max-width: 860px;
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
    flex-direction: column;
    align-items: center;
    text-align: center;
    border-bottom: 2px solid var(--border);
    padding-bottom: 1.5rem;
    gap: 1.25rem;
  }
  .header-left { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
  .header-logo {
    height: 32px;
    width: auto;
    min-width: 48px;
    padding: 0 0.8rem;
    background: var(--accent); color: white;
    border-radius: 8px; display: flex; align-items: center; justify-content: center; 
    font-weight: 800;
    font-size: 0.85rem;
    letter-spacing: -0.01em;
  }
  .app-header h1 {
    font-weight: 700;
    font-size: 1.35rem;
    color: var(--text);
    margin: 0;
    line-height: 1.2;
    max-width: 600px;
  }
  .app-header .subtitle {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Buttons */
  .btn-group { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
  .btn {
    background: var(--card); border: 1px solid var(--border);
    color: var(--text-muted); padding: 0.4rem 0.75rem; border-radius: 8px;
    font-weight: 600; font-size: 0.85rem; font-family: inherit; cursor: pointer;
    transition: all 0.2s ease; box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
    display: flex; align-items: center; gap: 0.4rem;
    white-space: nowrap;
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
  
  .benefits-list { list-style: none; padding: 0; margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
  .benefits-list li { 
    display: flex; 
    gap: 1.25rem; 
    align-items: center;
    padding: 1rem;
    background: var(--bg);
    border-radius: 12px;
    border: 1px solid transparent;
    transition: all 0.3s ease;
  }
  .benefits-list li:hover {
    background: var(--card);
    border-color: var(--border);
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.05);
    transform: translateY(-2px);
  }
  .benefits-list li::before { 
    content: "✓"; 
    display: inline-flex; 
    align-items: center; 
    justify-content: center; 
    width: 32px; 
    height: 32px; 
    border-radius: 10px; 
    background: var(--status-safe-bg); 
    color: var(--status-safe); 
    font-size: 1rem; 
    font-weight: 800; 
    flex-shrink: 0; 
    box-shadow: 0 4px 6px -1px rgb(16 185 129 / 0.1);
  }
  .benefits-list li strong {
    display: block;
    font-size: 1.05rem;
    color: var(--text);
    margin-bottom: 0.25rem;
    line-height: 1.3;
  }
  .benefits-item-content {
    display: flex;
    flex-direction: column;
  }
  .benefits-list li .desc {
    font-size: 0.9rem;
    color: var(--text-muted);
    line-height: 1.5;
  }

  @media (min-width: 640px) {
    .benefits-list li {
      gap: 1.5rem;
    }
    .benefits-list li::before {
      width: 40px;
      height: 40px;
      font-size: 1.15rem;
    }
    .benefits-item-content {
      flex-direction: row;
      align-items: center;
      gap: 1.5rem;
      flex: 1;
    }
    .benefits-item-content strong {
      width: 150px;
      flex-shrink: 0;
      margin-bottom: 0;
    }
  }

  /* Partner Box */
  .partner-box {
    margin-top: 2rem; border: 2px dashed var(--border); border-radius: 12px; padding: 2rem;
    text-align: center; background: var(--bg); transition: all 0.3s ease;
  }
  .partner-box:hover { border-color: var(--accent); background: var(--accent-light); }
  .partner-box h3 { margin: 0 0 0.5rem; font-size: 1rem; color: var(--text); }
  .partner-box p { margin: 0; font-size: 0.85rem; color: var(--text-muted); }

  /* Footer Section */
  .disclaimer { font-size: 0.8rem; color: var(--text-muted); padding-top: 1.5rem; border-top: 1px solid var(--border); margin-top: 1.5rem; }
  .creator-footer {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2.5rem;
    padding-bottom: 4rem;
  }
  .creator-card {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .creator-name {
    font-weight: 800;
    color: var(--text);
    font-size: 1.05rem;
    letter-spacing: -0.01em;
  }
  .creator-contact {
    color: var(--accent);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    transition: color 0.2s ease;
  }
  .creator-contact:hover {
    color: var(--accent-hover);
    text-decoration: underline;
  }
  .creator-desc {
    font-size: 0.85rem;
    line-height: 1.6;
    color: var(--text-muted);
  }
  .nip-info {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-family: monospace;
    margin-top: 0.25rem;
    background: var(--bg);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    display: inline-block;
    width: fit-content;
  }

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
        <div class="subtitle" data-i18n="subtitle">Panel Inteligentnego Miasta &bull; Ostrołęka</div>
        <h1 id="mainTitle" data-i18n="title">Ostrołęcki System Monitorowania Radiacyjnego</h1>
      </div>
    </div>
    <div class="btn-group">
      <button id="themeToggle" class="btn">🌙</button>
      <button id="notifToggle" class="btn">🔔 Powiadomienia: Wył</button>
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
        <option value="12hr" data-i18n="range12h">Ostatnie 12 godzin</option>
        <option value="1day" data-i18n="range1d">Ostatnia 1 doba</option>
        <option value="3day" data-i18n="range3d">Ostatnie 3 dni</option>
        <option value="7day" data-i18n="range7d">Ostatnie 7 dni</option>
        <option value="15day" data-i18n="range15d">Ostatnie 15 dni</option>
        <option value="35day" data-i18n="range35d">Ostatnie 35 dni</option>
        <option value="70day" data-i18n="range70d">Ostatnie 70 dni</option>
        <option value="140day" data-i18n="range140d">Ostatnie 140 dni</option>
      </select>
    </div>
    <div class="chart-container">
      <canvas id="chart"></canvas>
    </div>
  </div>

  <!-- Pitch / About Details -->
  <div class="card info-content animate-fade delay-3">
    <h2 data-i18n="aboutTitle">O projekcie</h2>
    <p data-i18n="aboutDesc"><strong>OSMR (Ostrołęcki System Monitorowania Radiacyjnego)</strong> to niezależna i w pełni funkcjonalna stacja pomiarowa działająca w Ostrołęce <strong>nieprzerwanie od ponad 3 lat</strong>. Jej celem jest całodobowe dostarczanie otwartych danych środowiskowych o poziomie promieniowania jonizującego w naszym mieście.</p>
    
    <h2 style="margin-top: 1.5rem;" data-i18n="bgTitle">Czym jest Promieniowanie Tła?</h2>
    <p data-i18n="bgDesc">Naturalne promieniowanie przestrzeni w Ostrołęce i na całym Mazowszu zazwyczaj znajduje się w granicach <strong>0.10 - 0.25 µSv/h</strong> (mikrosiwertów na godzinę). Pochodzi ono bezpośrednio z kosmosu oraz naturalnych pierwiastków obecnych w środowisku. Granice te to <strong>część całkowicie zdrowej normy</strong>, stąd dorywcze wahania nawet w okolice 0.40 µSv nie powinny być powodem do niepokoju.</p>
    
    <h2 style="margin-top: 1.5rem;" data-i18n="benefitsTitle">Korzyści dla Inicjatywy Smart City</h2>
    <p data-i18n="benefitsIntro">Inwestycja i zaangażowanie miasta w już istniejącą, solidną lokalną infrastrukturę otwiera szerokie pole korzyści społecznych dla Miasta i Obywateli:</p>
    <ul class="benefits-list">
      <li><div class="benefits-item-content" data-i18n="benefit1"></div></li>
      <li><div class="benefits-item-content" data-i18n="benefit2"></div></li>
      <li><div class="benefits-item-content" data-i18n="benefit3"></div></li>
      <li><div class="benefits-item-content" data-i18n="benefit4"></div></li>
    </ul>

    <div class="partner-box">
      <h3 data-i18n="partnerTitle">Możliwość Partnerstwa Regionalnego</h3>
      <p style="margin-bottom: 1.25rem;" data-i18n="partnerDesc">Zaufanie i ciągłość wdrażania technologii to klucz sukcesu nowoczesnego miasta. Czekamy na kontakt z oficjalnymi wydziałami Urzędu Miasta.</p>
      
      <div style="padding: 1rem 1.5rem; border: 1px solid var(--border); border-radius: 8px; background: var(--card); font-weight: 600; color: var(--text); display: inline-flex; align-items: center; justify-content: center; gap: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); text-align: left; line-height: 1.2;">
        <div style="width: 40px; height: 48px; background: #fef08a; border: 2px solid #eab308; border-radius: 4px; display:flex; align-items:center; justify-content:center; color: #854d0e; font-size:10px; font-weight: bold; flex-shrink: 0;" title="Herb Ostrołęki" data-i18n="partnerHerb">HERB</div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.2rem;" data-i18n="partnerVis">Wizualizacja Partnerstwa</div>
          <div style="font-size: 1rem;" data-i18n="partnerSupport">Projekt wspierany przez Urząd Miasta Ostrołęki</div>
        </div>
      </div>
    </div>

    <div class="disclaimer">
      <strong data-i18n="disclaimerTitle">Kwestia Atestacji Metodologicznej:</strong> <span data-i18n="disclaimerText">System korzysta z profesjonalnych tub Geigera-Müllera zdolnych monitorować promieniowanie na bieżąco, wykonując kalibracje do stałego CPM. Podkreślamy, że oficjalnym instytucjonalnym organem Państwowym do wysyłania ogólnokrajowych, ewakuacyjnych alertów kryzysowych prawnie pozostaje zawsze PAA.</span>
    </div>

    <!-- Creator Footer -->
    <footer class="creator-footer animate-fade delay-4">
      <div class="creator-card">
        <div class="creator-name" data-i18n="creator1Name">Norbert</div>
        <a href="mailto:contact@icmt.cc" class="creator-contact">contact@icmt.cc</a>
        <div class="creator-desc" data-i18n="creator1Desc">Twórca. Specjalista hardware, embedded i IoT. 'Nie umiem robić rzeczy, ale jak już coś zrobię, to może się przydać'</div>
      </div>
      <div class="creator-card">
        <div class="creator-name" data-i18n="creator2Name">Mikołaj Lubiak</div>
        <a href="mailto:lubiak@proton.me" class="creator-contact">lubiak@proton.me</a>
        <div class="creator-desc" data-i18n="creator2Desc">Senior software engineering i cybersecurity specialist. Odświeżył branding z naciskiem na Ostrołękę, przebudował stronę oraz worker i usprawnił firmware.</div>
        <div class="nip-info">NIP: 5253065759</div>
      </div>
    </footer>
  </div>

</div>

<script>
(() => {
  "use strict";

  let notifOn = localStorage.getItem("notifications_enabled") === "true";
  let currentLang = "pl";
  
  // Declared here so fetchLatest/fetchHistory can reference them; initialised
  // inside DOMContentLoaded where layout is stable and deferred Chart.js has run.
  let ctx = null;
  let chart = null;
  const offlineEl = document.getElementById("offline");

  // Init theme ASAP (before DOMContentLoaded) to prevent flash of wrong theme.
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }

  const updateChartTheme = () => {
    if (!chart) return;
    // Batch reads before any writes.
    const isDark = document.documentElement.classList.contains("dark");
    const gridColor  = isDark ? "#334155" : "#f1f5f9";
    const tooltipBg  = isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.9)';
    // Defer the chart render to the next frame — no forced reflow after DOM writes.
    requestAnimationFrame(() => {
      chart.options.scales.y.grid.color = gridColor;
      chart.options.plugins.tooltip.backgroundColor = tooltipBg;
      chart.update('none');
    });
  };

  const translations = {
    pl: {
      title: "Ostrołęcki System Monitorowania Radiacyjnego",
      subtitle: "Panel Inteligentnego Miasta &bull; Ostrołęka",
      instantLabel: "Odczyt Bieżący",
      avgLabel: "Średnia (1h)",
      cpmLabel: "CPM:",
      safe: "Bezpiecznie (0-0.3)",
      caution: "Uwaga (0.3-1)",
      high: "Wysokie (1-5)",
      danger: "Niebezp. (>5)",
      trendLabel: "Przebieg Zmian",
      range1h: "Ostatnia 1 godzina",
      range12h: "Ostatnie 12 godzin",
      range1d: "Ostatnia 1 doba",
      range3d: "Ostatnie 3 dni",
      range7d: "Ostatnie 7 dni",
      range15d: "Ostatnie 15 dni",
      range35d: "Ostatnie 35 dni",
      range70d: "Ostatnie 70 dni",
      range140d: "Ostatnie 140 dni",
      notifyOn: "🔔 Powiadomienia: Wł",
      notifyOff: "🔔 Powiadomienia: Wył",
      offline: "Brak łączności z bazą od",
      themeDark: "🌙 Ciemny",
      themeLight: "☀️ Jasny",
      aboutTitle: "O projekcie",
      aboutDesc: "<strong>OSMR (Ostrołęcki System Monitorowania Radiacyjnego)</strong> to niezależna i w pełni funkcjonalna stacja pomiarowa działająca w Ostrołęce <strong>nieprzerwanie od ponad 3 lat</strong>. Jej celem jest całodobowe dostarczanie otwartych danych środowiskowych o poziomie promieniowania jonizującego w naszym mieście.",
      bgTitle: "Czym jest Promieniowanie Tła?",
      bgDesc: "Naturalne promieniowanie przestrzeni w Ostrołęce i na całym Mazowszu zazwyczaj znajduje się w granicach <strong>0.10 - 0.25 µSv/h</strong> (mikrosiwertów na godzinę). Pochodzi ono bezpośrednio z kosmosu oraz naturalnych pierwiastków obecnych w środowisku. Granice te to <strong>część całkowicie zdrowej normy</strong>, stąd dorywcze wahania nawet w okolice 0.40 µSv nie powinny być powodem do niepokoju.",
      benefitsTitle: "Korzyści dla Inicjatywy Inteligentnego Miasta",
      benefitsIntro: "Inwestycja i zaangażowanie miasta w już istniejącą, solidną lokalną infrastrukturę otwiera szerokie pole korzyści społecznych dla Miasta i Obywateli:",
      benefit1: "<strong>Pionierstwo Wizerunkowe:</strong> <span class='desc'>Bezkonkurencyjnie wznosi Ostrołękę w poczet projektów 'Inteligentnego Miasta' dzięki udostępnianiu danych na żywo.</span>",
      benefit2: "<strong>Edukacja Ekologiczna:</strong> <span class='desc'>Łatwa i błyskawiczna weryfikacja danych z niezależnego źródła buduje spokój ducha (szczególnie istotne obok Elektrowni).</span>",
      benefit3: "<strong>Narzędzie Sztabu Kryzysowego:</strong> <span class='desc'>Nasz nowoczesny system pozwala na udostępnienie dedykowanego interfejsu programistycznego (API) dla miejskich systemów powiadamiania.</span>",
      benefit4: "<strong>Edukacja W Szkole:</strong> <span class='desc'>Otwarty dostęp do archiwum wykresów to znakomite, realne narządzie analityczne dla uczniów lokalnych techników i liceów uczących się fizyki i matematyki.</span>",
      partnerTitle: "Możliwość Partnerstwa Regionalnego",
      partnerDesc: "Zaufanie i ciągłość wdrażania technologii to klucz sukcesu nowoczesnego miasta. Czekamy na kontakt z oficjalnymi wydziałami Urzędu Miasta.",
      partnerHerb: "HERB",
      partnerVis: "Wizualizacja Partnerstwa",
      partnerSupport: "Projekt wspierany przez Urząd Miasta Ostrołęki",
      disclaimerTitle: "Kwestia Atestacji Metodologicznej:",
      disclaimerText: "System korzysta z profesjonalnych tub Geigera-Müllera zdolnych monitorować promieniowanie na bieżąco, wykonując kalibracje do stałego CPM. Podkreślamy, że oficjalnym instytucjonalnym organem Państwowym do wysyłania ogólnokrajowych, ewakuacyjnych alertów kryzysowych prawnie pozostaje zawsze PAA.",
      creator1Name: "Norbert",
      creator1Desc: "Twórca. Specjalista od sprzętu, systemów wbudowanych i Internetu Rzeczy. 'Nie umiem robić rzeczy, ale jak już coś zrobię, to może się przydać'",
      creator2Name: "Mikołaj Lubiak",
      creator2Desc: "Starszy inżynier oprogramowania i specjalista ds. bezpieczeństwa cyfrowego. Odświeżył wizerunek z naciskiem na Ostrołękę, przebudował stronę oraz mechanizm przetwarzania i usprawnił oprogramowanie układowe."
    },
    en: {
      title: "Ostrołęka Radiation Monitoring System",
      subtitle: "Smart City Dashboard &bull; Ostrołęka",
      instantLabel: "Current Reading",
      avgLabel: "Average (1h)",
      cpmLabel: "CPM:",
      safe: "Safe (0-0.3)",
      caution: "Caution (0.3-1)",
      high: "High (1-5)",
      danger: "Danger (>5)",
      trendLabel: "Data Trends",
      range1h: "Last 1 hour",
      range12h: "Last 12 hours",
      range1d: "Last 24 hours",
      range3d: "Last 3 days",
      range7d: "Last 7 days",
      range15d: "Last 15 days",
      range35d: "Last 35 days",
      range70d: "Last 70 days",
      range140d: "Last 140 days",
      notifyOn: "🔔 Notify: On",
      notifyOff: "🔔 Notify: Off",
      offline: "Station offline for",
      themeDark: "🌙 Dark",
      themeLight: "☀️ Light",
      aboutTitle: "About the Project",
      aboutDesc: "<strong>OSMR (Ostrołęka Radiation Monitoring System)</strong> is an independent and fully functional measuring station operating in Ostrołęka <strong>continuously for over 3 years</strong>. Its goal is to provide 24/7 open environmental data on the level of ionizing radiation in our city.",
      bgTitle: "What is Background Radiation?",
      bgDesc: "Natural background radiation in Ostrołęka and the entire Mazovia region usually stays within <strong>0.10 - 0.25 µSv/h</strong> (microsieverts per hour). It comes directly from space and natural elements present in the environment. These levels are <strong>part of a completely healthy norm</strong>, so occasional fluctuations even around 0.40 µSv should not be a cause for concern.",
      benefitsTitle: "Benefits for the Smart City Initiative",
      benefitsIntro: "Investment and city engagement in existing, robust local infrastructure opens a wide field of social benefits for the City and its Citizens:",
      benefit1: "<strong>Image Pioneering:</strong> <span class='desc'>Unrivaled elevation of Ostrołęka into the ranks of 'Smart City' projects through the provision of live data.</span>",
      benefit2: "<strong>Ecological Education:</strong> <span class='desc'>Easy and instant verification of data from an independent source builds peace of mind (especially important near the Power Plant).</span>",
      benefit3: "<strong>Crisis Management Tool:</strong> <span class='desc'>Our modern framework allows for a dedicated integration (API) into city-wide notification systems.</span>",
      benefit4: "<strong>School Education:</strong> <span class='desc'>Open access to the chart archive is an excellent, real analytical tool for students of local technical and high schools learning physics and mathematics.</span>",
      partnerTitle: "Regional Partnership Opportunity",
      partnerDesc: "Trust and continuity in technology implementation are keys to the success of a modern city. We look forward to contacting official departments of the City Hall.",
      partnerHerb: "COAT OF ARMS",
      partnerVis: "Partnership Visualization",
      partnerSupport: "Project supported by the Ostrołęka City Hall",
      disclaimerTitle: "Methodological Attestation:",
      disclaimerText: "The system uses professional Geiger-Müller tubes capable of monitoring radiation in real-time, performing calibrations to a constant CPM. We emphasize that PAA remains the official state institutional body for issuing national crisis evacuation alerts.",
      creator1Name: "Norbert",
      creator1Desc: "The creator. Hardware, embedded and IoT specialist. 'I can't make stuff, if I do, it might be of use'",
      creator2Name: "Mikołaj Lubiak",
      creator2Desc: "Senior software engineering and cybersecurity specialist. Remade the branding focusing on Ostrołęka, remade the website and worker and improved the firmware."
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

      // --- Batch all DOM reads first (prevents forced reflow) ---
      const instantEl   = document.getElementById("instant");
      const avgEl       = document.getElementById("avg");
      const cpmEl       = document.getElementById("cpm");
      const isDark      = document.documentElement.classList.contains("dark");
      const instantColor = getColor(d.instant_usv);
      const borderColor  = (d.instant_usv <= 0.3) ? (isDark ? "#3b82f6" : "#2563eb") : instantColor;

      // --- Batch all DOM writes ---
      instantEl.style.color = instantColor;
      animateValue(instantEl, lastInstant, d.instant_usv, 800);
      animateValue(avgEl,     lastAvg,     d.avg_usv,     800);
      animateValue(cpmEl,     lastCpm,     d.cpm,         800);

      lastInstant = d.instant_usv;
      lastAvg     = d.avg_usv;
      lastCpm     = d.cpm;

      if (d.offline) {
        const t = translations[currentLang] || translations["pl"];
        offlineEl.style.display = "flex";
        offlineEl.innerHTML = "⚠️ " + t.offline + " " + formatAgo(d.lastSeenAgo);
      } else {
        offlineEl.style.display = "none";
      }

      // Defer chart update to next animation frame — avoids forced reflow
      // after the style writes above invalidated the layout.
      if (chart) {
        requestAnimationFrame(() => {
          chart.data.datasets[0].borderColor = borderColor;
          chart.update('none');
        });
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
    if (!chart) return;
    try {
      const w = document.getElementById("range").value;
      const r = await fetch("/history?window=" + w);
      const d = await r.json();

      // Pre-compute labels and data entirely in JS — no DOM reads involved.
      const isMultiDay = w.includes('day');
      const labels = d.data.map((row) => {
        const t = new Date(row.ts);
        if (w === '70day' || w === '140day') {
          return t.toLocaleDateString([], {year: 'numeric', month: 'short', day: 'numeric'});
        }
        if (isMultiDay) {
          return t.toLocaleString([], {month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'});
        }
        return t.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
      });
      const chartData = d.data.map((row) => row.usv);

      // Write to chart + update atomically inside a single RAF — no interleaved
      // layout reads between a DOM write and chart.update().
      requestAnimationFrame(() => {
        chart.data.labels = labels;
        chart.data.datasets[0].data = chartData;
        chart.update();
      });
    } catch (e) {
      console.error("Failed to fetch history:", e);
    }
  };

  const applyLang = (lang) => {
    const t = translations[lang] || translations["pl"];
    document.title = "OSMR - " + t.title;
    document.documentElement.lang = lang;
    document.getElementById("langToggle").textContent = "🌐 " + lang.toUpperCase();
    
    // Auto-map translations to elements
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const val = t[key] || translations["pl"][key];
      if (val) {
        // Use innerHTML for keys that contain HTML tags or entities
        if (val.includes("<") || val.includes("&")) {
          el.innerHTML = val;
        } else {
          el.textContent = val;
        }
      }
    });
    
    // Toggle active state styling on the language button
    document.getElementById("notifToggle").textContent = notifOn ? (t.notifyOn || translations["pl"].notifyOn) : (t.notifyOff || translations["pl"].notifyOff);

    const isDark = document.documentElement.classList.contains('dark');
    document.getElementById("themeToggle").textContent = isDark ? (t.themeLight || translations["pl"].themeLight) : (t.themeDark || translations["pl"].themeDark);
  };

  document.addEventListener("DOMContentLoaded", () => {
    // Initialise chart here: layout is stable and deferred Chart.js has run.
    ctx = document.getElementById("chart").getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');

    chart = new Chart(ctx, {
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
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.4,
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

    // Detect & Apply language
    const savedLang = localStorage.getItem("preferred_lang");
    if (savedLang && translations[savedLang]) {
      currentLang = savedLang;
    } else {
      const browserLangs = navigator.languages || [navigator.language];
      for (const l of browserLangs) {
        const short = l.split("-")[0].toLowerCase();
        if (translations[short]) {
          currentLang = short;
          break;
        }
      }
    }
    applyLang(currentLang);
    document.getElementById("notifToggle").classList.toggle("active", notifOn);
    
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
      localStorage.setItem("preferred_lang", currentLang);
      applyLang(currentLang);
    });

    document.getElementById("notifToggle").addEventListener("click", async (e) => {
      if (!notifOn) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
      }
      notifOn = !notifOn;
      localStorage.setItem("notifications_enabled", notifOn);
      const t = translations[currentLang];
      e.target.textContent = notifOn ? t.notifyOn : t.notifyOff;
      e.target.classList.toggle("active", notifOn);
    });

    document.getElementById("range").addEventListener("change", fetchHistory);

    setInterval(fetchLatest, 30000);
    setInterval(fetchHistory, 300000);
    fetchLatest();
    fetchHistory();
  });
})();
</script>
</body>
</html>`;

export function renderIndex() {
  return INDEX_HTML;
}
