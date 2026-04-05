const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://*.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://rad.icmt.cc https://*.cloudflareinsights.com; img-src 'self' data: https://icmt.cc;">
<title>Local Radiation Monitoring</title>
<meta name="description" content="EU radiation monitoring dashboard with live readings and cached fallback notices.">
<meta name="author" content="icantmakethings">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%231d4ed8'/%3E%3Ctext x='32' y='42' text-anchor='middle' font-size='34' font-family='Arial' fill='%23f8fafc'%3ER%3C/text%3E%3C/svg%3E" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="dns-prefetch" href="https://static.cloudflareinsights.com">
<link rel="preload" href="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" as="script">
<link rel="preload" href="https://cdn.jsdelivr.net/npm/lucide@0.470.0/dist/umd/lucide.min.js" as="script">
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" as="style">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"></noscript>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/lucide@0.470.0/dist/umd/lucide.min.js" defer></script>

<style>
  :root {
    --bg: #f8fafc;
    --card: #ffffff;
    --accent: #2563eb;
    --accent-hover: #1d4ed8;
    --accent-light: #eff6ff;
    --text: #0f172a;
    --text-muted: #475569;
    --border: #e2e8f0;
    
    --status-safe: #10b981;
    --status-safe-bg: #d1fae5;
    --status-caution: #f59e0b;
    --status-caution-bg: #fef3c7;
    --status-high: #f97316;
    --status-high-bg: #ffedd5;
    --status-danger: #ef4444;
    --status-danger-bg: #fee2e2;
  }

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

  .btn-group {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.6rem;
    width: 100%;
    max-width: 760px;
  }
  .btn {
    background: var(--card); border: 1px solid var(--border);
    color: var(--text-muted); padding: 0.65rem 0.7rem; border-radius: 8px;
    font-weight: 600; font-size: 0.95rem; font-family: inherit; cursor: pointer;
    transition: all 0.2s ease; box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
    display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    height: 48px;
    line-height: 1;
  }
  .btn:hover { background: var(--bg); color: var(--text); border-color: var(--text-muted); }
  .btn.active { color: var(--accent); border-color: var(--accent); background: var(--accent-light); }
  .btn .icon {
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .select-button {
    width: 100%;
    min-width: 0;
  }
  .footer-note {
    text-align: center;
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0 auto 1.5rem;
    max-width: 760px;
  }
  .footer-note a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 600;
  }
  .footer-note a:hover {
    text-decoration: underline;
  }

  .card {
    background: var(--card);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
    border: 1px solid var(--border);
  }

  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; }
  .kpi-card { display: flex; flex-direction: column; justify-content: center; }
  .kpi-label { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.5rem; }
  .kpi-value-wrap { display: flex; align-items: baseline; gap: 0.25rem; }
  .kpi-value { font-size: 2.75rem; font-weight: 800; color: var(--accent); letter-spacing: -0.02em; line-height: 1; transition: color 0.4s ease; }
  .kpi-unit { font-size: 1rem; font-weight: 600; color: var(--text-muted); }
  .kpi-meta { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem; display: flex; align-items: center; gap: 0.25rem;}
  .radiation-icon {
    width: 1.05rem;
    height: 1.05rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    background: #facc15;
    color: #0f172a;
    font-size: 0.75rem;
    line-height: 1;
    font-weight: 700;
    transition: background-color 0.35s ease, color 0.35s ease;
  }

  .status-legend { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-top: 1rem; }
  .badge {
    padding: 0.35rem 0.5rem; border-radius: 9999px; font-size: 0.72rem; font-weight: 600; 
    border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; gap: 0.35rem; color: var(--text-muted);
    white-space: nowrap;
  }
  .badge-dot { width: 8px; height: 8px; border-radius: 50%; }

  .bg-safe { background: var(--status-safe); }
  .bg-caution { background: var(--status-caution); }
  .bg-high { background: var(--status-high); }
  .bg-danger { background: var(--status-danger); }

  .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .chart-title { font-size: 1rem; font-weight: 600; margin: 0; }
  select {
    background: var(--card); border: 1px solid var(--border); padding: 0.4rem 2rem 0.4rem 1rem; 
    border-radius: 8px; font-weight: 500; font-size: 0.85rem; color: var(--text); cursor: pointer; appearance: none;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.05); font-family: inherit; text-align: center;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat; background-position: right 0.5rem center; background-size: 1em;
  }
  .chart-container { position: relative; height: 300px; width: 100%; }

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

  .partner-box {
    margin-top: 2rem; border: 2px dashed var(--border); border-radius: 12px; padding: 2rem;
    text-align: center; background: var(--bg); transition: all 0.3s ease;
  }
  .partner-box:hover { border-color: var(--accent); background: var(--accent-light); }
  .partner-box h3 { margin: 0 0 0.5rem; font-size: 1rem; color: var(--text); }
  .partner-box p { margin: 0; font-size: 0.85rem; color: var(--text-muted); }

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

  .offline-alert {
    background: var(--status-danger-bg); color: #991b1b; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #f87171;
    font-size: 0.85rem; font-weight: 600; display: none; align-items: center; gap: 0.5rem; margin-bottom: 1rem;
  }

</style>
</head>
<body>

<div class="container" role="main">
  
  <header class="app-header animate-fade">
    <div class="header-left">
      <div>
        <div class="subtitle" data-i18n="subtitle">Local radiation readings</div>
        <h1 id="mainTitle" data-i18n="title">Village Radiation Monitoring</h1>
      </div>
    </div>
    <div class="btn-group">
      <button id="themeToggle" class="btn"><span class="icon" data-lucide="moon"></span><span id="themeText">Dark</span></button>
      <button id="notifToggle" class="btn"><span class="icon" data-lucide="bell"></span><span id="notifText">Off</span></button>
      <select id="langSelect" class="btn select-button" aria-label="Language selector">
        <option value="en">English</option>
        <option value="pl">Polski</option>
        <option value="de">Deutsch</option>
        <option value="ru">Русский</option>
        <option value="uk">Українська</option>
      </select>
      <button id="exportBtn" class="btn"><span class="icon" data-lucide="download-cloud"></span><span data-i18n="export">Export</span></button>
    </div>
  </header>

  <div id="offline" class="offline-alert animate-fade"></div>

  <div class="kpi-grid animate-fade delay-1">
    
    <div class="card kpi-card">
      <div class="kpi-label" data-i18n="instantLabel">Current Reading</div>
      <div class="kpi-value-wrap">
        <div id="instant" class="kpi-value">--</div>
        <div class="kpi-unit">µSv/h</div>
      </div>
      <div class="kpi-meta">
        <span id="radiationIcon" class="radiation-icon" aria-hidden="true"><i data-lucide="radioactive"></i></span>
        <span data-i18n="cpmLabel">CPM:</span> <strong id="cpm">--</strong>
      </div>
    </div>

    <div class="card kpi-card">
      <div class="kpi-label" data-i18n="avgLabel">Average (1h)</div>
      <div class="kpi-value-wrap">
        <div id="avg" class="kpi-value" style="color: var(--text);">--</div>
        <div class="kpi-unit">µSv/h</div>
      </div>
      <div class="status-legend">
        <div class="badge"><div class="badge-dot bg-safe"></div> <span data-i18n="safe">Safe (0-0.3)</span></div>
        <div class="badge"><div class="badge-dot bg-caution"></div> <span data-i18n="caution">Caution (0.3-1)</span></div>
        <div class="badge"><div class="badge-dot bg-high"></div> <span data-i18n="high">High (1-5)</span></div>
        <div class="badge"><div class="badge-dot bg-danger"></div> <span data-i18n="danger">Danger (>5)</span></div>
      </div>
    </div>
  </div>

  <div class="card animate-fade delay-2">
    <div class="chart-header">
      <h2 class="chart-title" data-i18n="trendLabel">Data Trends</h2>
      <select id="range" aria-label="Time range">
        <option value="1hr" selected data-i18n="range1h">Last 1 hour</option>
        <option value="12hr" data-i18n="range12h">Last 12 hours</option>
        <option value="1day" data-i18n="range1d">Last 24 hours</option>
        <option value="3day" data-i18n="range3d">Last 3 days</option>
        <option value="7day" data-i18n="range7d">Last 7 days</option>
        <option value="15day" data-i18n="range15d">Last 15 days</option>
        <option value="35day" data-i18n="range35d">Last 35 days</option>
        <option value="70day" data-i18n="range70d">Last 70 days</option>
        <option value="140day" data-i18n="range140d">Last 140 days</option>
      </select>
    </div>
    <div class="chart-container">
      <canvas id="chart"></canvas>
    </div>
  </div>

<div class="footer-note">
  <a href="https://icmt.cc/p/rad-the-local-radiaton-website/" target="_blank" rel="noopener noreferrer">Ran on a €1~ controller!</a>
</div>

<script>
(() => {
  "use strict";

  let notifOn = localStorage.getItem("notifications_enabled") === "true";
  let currentLang = "en";
  const notificationsSupported = (typeof Notification !== "undefined");
  let lastLiveFetch = 0;
  
  let ctx = null;
  let chart = null;
  const offlineEl = document.getElementById("offline");

  if (localStorage.theme !== 'light') {
    document.documentElement.classList.add('dark');
  }

  const updateChartTheme = () => {
    if (!chart) return;
    const isDark = document.documentElement.classList.contains("dark");
    const gridColor  = isDark ? "#334155" : "#f1f5f9";
    const tooltipBg  = isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.9)';
    requestAnimationFrame(() => {
      chart.options.scales.y.grid.color = gridColor;
      chart.options.plugins.tooltip.backgroundColor = tooltipBg;
      chart.update('none');
    });
  };

  const translations = {
    pl: {
      title: "Miejski monitoring promieniowania",
      subtitle: "Lokalne dane z czujnika promieniowania",
      instantLabel: "Odczyt bieżący",
      avgLabel: "Średnia (1h)",
      cpmLabel: "CPM:",
      safe: "Bezpiecznie (0-0.3)",
      caution: "Uwaga (0.3-1)",
      high: "Wysokie (1-5)",
      danger: "Niebezp. (>5)",
      trendLabel: "Przebieg zmian",
      range1h: "Ostatnia 1 godzina",
      range12h: "Ostatnie 12 godzin",
      range1d: "Ostatnia 1 doba",
      range3d: "Ostatnie 3 dni",
      range7d: "Ostatnie 7 dni",
      range15d: "Ostatnie 15 dni",
      range35d: "Ostatnie 35 dni",
      range70d: "Ostatnie 70 dni",
      range140d: "Ostatnie 140 dni",
      rangePeriodLabel: "Zakres czasowy",
      notifyOn: "Wł",
      notifyOff: "Wył",
      themeDark: "Ciemny",
      themeLight: "Jasny",
      export: "Eksport"
    },
    en: {
      title: "Village Radiation Monitoring",
      subtitle: "Local radiation readings",
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
      rangePeriodLabel: "Time range",
      notifyOn: "On",
      notifyOff: "Off",
      themeDark: "Dark",
      themeLight: "Light",
      export: "Export"
    },
    de: {
      title: "Dorfstrahlungsüberwachung",
      subtitle: "Lokale Strahlungswerte",
      instantLabel: "Aktueller Wert",
      avgLabel: "Durchschnitt (1h)",
      cpmLabel: "CPM:",
      safe: "Sicher (0-0.3)",
      caution: "Achtung (0.3-1)",
      high: "Hoch (1-5)",
      danger: "Gefahr (>5)",
      trendLabel: "Verlauf",
      range1h: "Letzte 1 Stunde",
      range12h: "Letzte 12 Stunden",
      range1d: "Letzte 24 Stunden",
      range3d: "Letzte 3 Tage",
      range7d: "Letzte 7 Tage",
      range15d: "Letzte 15 Tage",
      range35d: "Letzte 35 Tage",
      range70d: "Letzte 70 Tage",
      range140d: "Letzte 140 Tage",
      rangePeriodLabel: "Zeitraum",
      notifyOn: "Ein",
      notifyOff: "Aus",
      themeDark: "Dunkel",
      themeLight: "Hell",
      export: "Export"
    },
    ru: {
      title: "Деревенский радиационный мониторинг",
      subtitle: "Локальные данные радиации",
      instantLabel: "Текущее значение",
      avgLabel: "Среднее (1ч)",
      cpmLabel: "CPM:",
      safe: "Безопасно (0-0.3)",
      caution: "Внимание (0.3-1)",
      high: "Высокое (1-5)",
      danger: "Опасно (>5)",
      trendLabel: "График",
      range1h: "Последний час",
      range12h: "Последние 12 часов",
      range1d: "Последние 24 часа",
      range3d: "Последние 3 дня",
      range7d: "Последние 7 дней",
      range15d: "Последние 15 дней",
      range35d: "Последние 35 дней",
      range70d: "Последние 70 дней",
      range140d: "Последние 140 дней",
      rangePeriodLabel: "Период",
      notifyOn: "Вкл",
      notifyOff: "Выкл",
      themeDark: "Тёмная",
      themeLight: "Светлая",
      export: "Экспорт"
    },
    uk: {
      title: "Сільський радіаційний моніторинг",
      subtitle: "Локальні дані радіації",
      instantLabel: "Поточне значення",
      avgLabel: "Середнє (1г)",
      cpmLabel: "CPM:",
      safe: "Безпечно (0-0.3)",
      caution: "Увага (0.3-1)",
      high: "Високий (1-5)",
      danger: "Небезпечно (>5)",
      trendLabel: "Динаміка",
      range1h: "Остання година",
      range12h: "Останні 12 годин",
      range1d: "Останні 24 години",
      range3d: "Останні 3 дні",
      range7d: "Останні 7 днів",
      range15d: "Останні 15 днів",
      range35d: "Останні 35 днів",
      range70d: "Останні 70 днів",
      range140d: "Останні 140 днів",
      rangePeriodLabel: "Період",
      notifyOn: "Увімк",
      notifyOff: "Вимк",
      themeDark: "Темна",
      themeLight: "Світла",
      export: "Експорт"
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

  const getRadiationIconTextColor = (usv) => {
    if (usv <= 1) return "#0f172a";
    return "#ffffff";
  };

  const animateValue = (obj, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = progress * (2 - progress);
      const current = (progress === 1) ? end : start + (end - start) * easeOut;
      
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

  const fetchJsonWithTimeout = async (url, options = {}, timeoutMs = 10000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  };

  const fetchLatest = async (retryCount = 0) => {
    try {
      const d = await fetchJsonWithTimeout("/latest?_=" + Date.now(), {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache"
        }
      }, 8000);

      if (!Number.isFinite(Number(d.instant_usv)) || !Number.isFinite(Number(d.avg_usv)) || !Number.isFinite(Number(d.cpm))) {
        throw new Error("Invalid latest payload");
      }

      lastLiveFetch = Date.now();
      const t = translations[currentLang] || translations["en"];
      const instantEl   = document.getElementById("instant");
      const avgEl       = document.getElementById("avg");
      const cpmEl       = document.getElementById("cpm");
      const isDark      = document.documentElement.classList.contains("dark");
      const instantColor = getColor(d.instant_usv);
      const borderColor  = (d.instant_usv <= 0.3) ? (isDark ? "#3b82f6" : "#2563eb") : instantColor;
      const iconEl = document.getElementById("radiationIcon");

      instantEl.style.color = instantColor;
      if (iconEl) {
        iconEl.style.backgroundColor = instantColor;
        iconEl.style.color = getRadiationIconTextColor(d.instant_usv);
      }
      animateValue(instantEl, lastInstant, d.instant_usv, 800);
      lastInstant = d.instant_usv;

      const currentRange = document.getElementById("range").value;
      if (currentRange === "1hr") {
        animateValue(avgEl, lastAvg, d.avg_usv, 800);
        lastAvg = d.avg_usv;
      }
      animateValue(cpmEl, lastCpm, d.cpm, 800);
      lastCpm     = d.cpm;

      offlineEl.style.display = "none";

      if (chart) {
        requestAnimationFrame(() => {
          chart.data.datasets[0].borderColor = borderColor;
          chart.update('none');
        });
      }

      if (notifOn && notificationsSupported && Notification.permission === "granted" && d.instant_usv > 0.5) {
        new Notification("Radiation Alert", {
          body: d.instant_usv.toFixed(3) + " µSv/h",
        });
      }
    } catch (e) {
      console.error("Failed to fetch latest:", e);
      const t = translations[currentLang] || translations["en"];
      if (retryCount < 3) {
        const delay = 2000 * (retryCount + 1);
        console.warn('Retrying fetchLatest in ' + delay + 'ms...');
        setTimeout(() => fetchLatest(retryCount + 1), delay);
      } else {
        offlineEl.style.display = "none";
      }
    }
  };

  const fetchHistory = async (retryCount = 0) => {
    if (!chart) return;
    try {
      const w = document.getElementById("range").value;
      const d = await fetchJsonWithTimeout("/history?window=" + w, {
        cache: "force-cache"
      }, 12000);

      if (!d || !Array.isArray(d.data)) {
        throw new Error("Invalid history payload");
      }

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
      
      const avgUsv = chartData.length > 0 ? chartData.reduce((a, b) => a + b, 0) / chartData.length : 0;
      const avgEl = document.getElementById("avg");
      const t = translations[currentLang] || translations["en"];
      
      animateValue(avgEl, lastAvg, avgUsv, 800);
      lastAvg = avgUsv;

      const labelEl = document.querySelector('[data-i18n="avgLabel"]');
      if (labelEl) {
        const base = t.avgLabel.split('(')[0].trim();
        const suffix = w === "1hr" ? "1h" : w.replace("hr", "h").replace("day", "d");
        labelEl.textContent = base + " (" + suffix + ")";
      }

      requestAnimationFrame(() => {
        chart.data.labels = labels;
        chart.data.datasets[0].data = chartData;
        chart.update();
      });
    } catch (e) {
      console.error("Failed to fetch history:", e);
      if (retryCount < 3) {
        const delay = 2000 * (retryCount + 1);
        console.warn('Retrying fetchHistory in ' + delay + 'ms...');
        setTimeout(() => fetchHistory(retryCount + 1), delay);
      }
    }
  };

  document.getElementById("exportBtn").addEventListener("click", async () => {
  try {
    const res = await fetch("/export");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "radiation_data_rad.icmt.cc.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Export failed:", e);
  }
});

  const applyLang = (lang) => {
    const t = translations[lang] || translations["en"];
    currentLang = translations[lang] ? lang : "en";
    document.title = t.title;
    document.documentElement.lang = currentLang;
    document.getElementById("langSelect").value = currentLang;

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const val = t[key] || translations["en"][key] || "";
      if (val) {
        if (key === "avgLabel") {
          const w = document.getElementById("range").value;
          const suffix = w === "1hr" ? "1h" : w.replace("hr", "h").replace("day", "d");
          el.textContent = val.split('(')[0].trim() + " (" + suffix + ")";
        } else if (val.includes("<") || val.includes("&")) {
          el.innerHTML = val;
        } else {
          el.textContent = val;
        }
      }
    });

    document.getElementById("notifText").textContent = notifOn ? (t.notifyOn || translations["en"].notifyOn) : (t.notifyOff || translations["en"].notifyOff);
    document.getElementById("themeText").textContent = document.documentElement.classList.contains('dark') ? (t.themeLight || translations["en"].themeLight) : (t.themeDark || translations["en"].themeDark);
    document.getElementById("range").setAttribute("aria-label", t.rangePeriodLabel || translations["en"].rangePeriodLabel);
  };

  document.addEventListener("DOMContentLoaded", async () => {
    const savedLang = localStorage.getItem("preferred_lang");
    if (savedLang && translations[savedLang]) {
      currentLang = savedLang;
    } else {
      const browserLangs = navigator.languages || [navigator.language];
      for (const l of browserLangs) {
        const short = l.split("-")[0].toLowerCase();
        if (translations[short]) { currentLang = short; break; }
      }
    }
    applyLang(currentLang);
    if (!notificationsSupported) {
      notifOn = false;
      localStorage.setItem("notifications_enabled", "false");
    }
    document.getElementById("notifToggle").classList.toggle("active", notifOn);

    document.getElementById("themeToggle").addEventListener("click", () => {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.theme = isDark ? 'dark' : 'light';
      applyLang(currentLang);
      updateChartTheme();
      fetchLatest();
    });

    document.getElementById("langSelect").addEventListener("change", (e) => {
      const selected = e.target.value;
      if (translations[selected]) {
        currentLang = selected;
        localStorage.setItem("preferred_lang", currentLang);
        applyLang(currentLang);
      }
    });

    document.getElementById("notifToggle").addEventListener("click", async (e) => {
      if (!notificationsSupported) {
        return;
      }
      if (!notifOn) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
      }
      notifOn = !notifOn;
      localStorage.setItem("notifications_enabled", notifOn);
      const t = translations[currentLang] || translations["en"];
      document.getElementById("notifText").textContent = notifOn ? t.notifyOn : t.notifyOff;
      e.target.classList.toggle("active", notifOn);
    });

    document.getElementById("range").addEventListener("change", fetchHistory);

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    fetchLatest();
    setInterval(fetchLatest, 120000);

    if (typeof Chart === 'undefined') {
      console.error("Chart.js not loaded. Verify CDN connectivity.");
      return;
    }

    ctx = document.getElementById("chart").getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');

    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [{
          label: "µSv/h",
          data: [],
          borderColor: "#2563eb",
          backgroundColor: gradient,
          borderWidth: 2,
          pointRadius: 1,
          pointHoverRadius: 4,
          tension: 0.12,
          cubicInterpolationMode: 'monotone',
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { display: false, drawBorder: false }, ticks: { color: "#94a3b8", maxTicksLimit: 8 } },
          y: { grid: { color: "#f1f5f9", drawBorder: false }, ticks: { color: "#94a3b8" }, beginAtZero: true },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { family: 'Inter', size: 13 },
            bodyFont: { family: 'Inter', size: 13, weight: 'bold' },
            padding: 10, cornerRadius: 8, displayColors: false
          }
        },
      },
    });
    updateChartTheme();

    fetchHistory();
    setInterval(fetchHistory, 300000);
  });
})();
</script>
</body>
</html>`;

export function renderIndex() {
  return INDEX_HTML;
}
