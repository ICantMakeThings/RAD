export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/ingest") {
      const auth = request.headers.get("Authorization") || "";
      if (auth !== `Bearer ${env.DEVICE_TOKEN}`) {
        return new Response("ayo hacker?", { status: 401 });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return new Response("Invalid JSON", { status: 400 });
      }

      const now = Date.now();
      const ts = body.ts || now;
      const ts = (typeof body.ts === "number" && body.ts > 1e12) ? body.ts : now;

      await env.RAD_KV.put("latest", JSON.stringify({ clicks, ts, receivedAt: now }));

      try {
        await env.RAD_D1.prepare(
          `INSERT INTO readings (ts, clicks) VALUES (?, ?);`
        ).bind(ts, clicks).run();
      } catch (e) {
        console.error("D1 insert error", e);
      }

      return new Response("OK");
    }

    if (request.method === "GET" && url.pathname === "/latest") {
      const latestRaw = await env.RAD_KV.get("latest");
      const latest = latestRaw ? JSON.parse(latestRaw) : null;

      let cpm = null;
      try {
        const since = Date.now() - 60_000;
        const res = await env.RAD_D1.prepare(
          "SELECT SUM(clicks) AS s FROM readings WHERE ts >= ?;"
        ).bind(since).all();
        cpm = res.results?.[0]?.s || 0;
      } catch {}

      const CPM_TO_USV = Number(env.CPM_TO_USV) || 0.008;
      const instant_usv = latest ? (latest.clicks * 60 * CPM_TO_USV) : 0;
      const avg_usv = cpm * CPM_TO_USV;

      const lastUpdate = latest?.receivedAt || 0;
      const diffMs = Date.now() - lastUpdate;
      const offline = diffMs > 120_000;

      return new Response(JSON.stringify({
        latest,
        cpm,
        instant_usv,
        avg_usv,
        unit: "µSv/h",
        offline,
        lastSeenAgo: diffMs
      }), { headers: { "Content-Type": "application/json" } });
    }

    if (request.method === "GET" && url.pathname === "/history") {
      const w = url.searchParams.get("window") || "10min";
      const windows = {
        "10min": 10 * 60e3,
        "10hr": 10 * 3600e3,
        "10day": 10 * 86400e3,
        "50day": 50 * 86400e3,
      };
      const ms = windows[w] || 10 * 60e3;
      const since = Date.now() - ms;

      try {
        const rows = await env.RAD_D1.prepare(
          "SELECT ts, clicks FROM readings WHERE ts >= ? ORDER BY ts ASC;"
        ).bind(since).all();
        const data = rows.results.map(r => ({ ts: r.ts, clicks: r.clicks }));
        return new Response(JSON.stringify({ data }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ data: [] }), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      return new Response(
`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Village Radiation Monitor</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
  :root {
    --bg: #0f1117;
    --card: #1b1f2a;
    --accent: #00c9a7;
    --warn: #ff4f4f;
    --text: #e6e6e6;
    --muted: #888;
  }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    margin: 0;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem;
  }
  h1 {
    font-weight: 600;
    font-size: 1.8rem;
    margin-bottom: 0.3em;
    color: var(--accent);
  }
  .offline {
    background: var(--warn);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    animation: blink 1.5s infinite alternate;
  }
  @keyframes blink {
    from { opacity: 0.6; }
    to { opacity: 1; }
  }
  .card {
    background: var(--card);
    border-radius: 16px;
    padding: 1.5rem 2rem;
    box-shadow: 0 0 15px rgba(0,0,0,0.4);
    margin-bottom: 1.5rem;
    width: 90%;
    max-width: 650px;
  }
  #instant {
    font-size: 2.2rem;
    font-weight: 700;
    color: var(--accent);
    text-shadow: 0 0 15px rgba(0,201,167,0.4);
  }
  .meta {
    color: var(--muted);
    margin-top: 0.3rem;
  }
  #notifToggle {
    position: fixed;
    top: 1rem;
    left: 1rem;
    background: var(--card);
    color: var(--accent);
    border: 1px solid var(--accent);
    border-radius: 8px;
    padding: 0.4rem 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 100;
  }
  #notifToggle:hover {
    background: var(--accent);
    color: var(--bg);
  }
  select {
    background: var(--card);
    color: var(--text);
    border: 1px solid var(--accent);
    border-radius: 8px;
    padding: 0.4rem 0.6rem;
    margin-top: 0.8rem;
  }
  canvas {
    width: 100%;
    max-width: 700px;
    height: 300px;
  }
  footer {
    margin-top: 1rem;
    font-size: 0.8rem;
    color: var(--muted);
  }
  footer a {
    color: var(--accent);
    text-decoration: none;
  }
  footer a:hover {
    text-decoration: underline;
  }
</style>
</head>
<body>

<button id="notifToggle">Notify: Off</button>
<h1>Village Radiation Monitor</h1>
<div id="offline" style="display:none;" class="offline"></div>

<div class="card">
  <div id="instant">-- µSv/h</div>
  <div class="meta">Average: <span id="avg">--</span> µSv/h | CPM: <span id="cpm">--</span></div>
  <select id="range">
    <option value="10min">Last 10 minutes</option>
    <option value="10hr">Last 10 hours</option>
    <option value="10day">Last 10 days</option>
    <option value="50day">Last 50 days</option>
  </select>
</div>

<div class="card">
  <canvas id="chart"></canvas>
</div>

<footer>
  Powered by an ESP8266 —
  <a href="https://icmt.cc" target="_blank">More here</a>
</footer>

<script>
let notifOn=false;
const ctx=document.getElementById("chart").getContext("2d");
const offlineEl=document.getElementById("offline");

const chart=new Chart(ctx,{
  type:"line",
  data:{labels:[],datasets:[{label:"µSv/h",data:[],borderColor:"#00c9a7",tension:0.25,fill:false}]},
  options:{scales:{x:{ticks:{color:"#aaa"}},y:{ticks:{color:"#aaa"},beginAtZero:true}},plugins:{legend:{labels:{color:"#ccc"}}}}
});

document.getElementById("notifToggle").onclick=async e=>{
  if(!notifOn) await Notification.requestPermission();
  notifOn=!notifOn;
  e.target.textContent=notifOn?"Notify: On":"Notify: Off";
};

function formatAgo(ms){
  const s=Math.floor(ms/1000);
  if(s<60)return s+"s";
  const m=Math.floor(s/60);
  const r=s%60;
  return m+"m "+r+"s";
}

async function fetchLatest(){
  try{
    const r=await fetch("/latest");
    const d=await r.json();
    document.getElementById("instant").textContent=d.instant_usv.toFixed(3)+" µSv/h";
    document.getElementById("avg").textContent=d.avg_usv.toFixed(3);
    document.getElementById("cpm").textContent=d.cpm;
    if(d.offline){
      offlineEl.style.display="block";
      offlineEl.textContent="⚠️⚠️⚠️ Geiger tube offline for "+formatAgo(d.lastSeenAgo);
    }else{
      offlineEl.style.display="none";
    }
    if(notifOn && d.instant_usv>0.5)
      new Notification("Radiation Alert",{body:d.instant_usv.toFixed(3)+" µSv/h"});
  }catch(e){console.error(e);}
}

async function fetchHistory(){
  const w=document.getElementById("range").value;
  const r=await fetch("/history?window="+w);
  const d=await r.json();
  const points=d.data.map(r=>({x:new Date(r.ts),y:r.clicks*60*0.008}));
  chart.data.labels=points.map(p=>p.x.toLocaleTimeString());
  chart.data.datasets[0].data=points.map(p=>p.y);
  chart.update();
}

setInterval(fetchLatest,2000);
setInterval(fetchHistory,60000);
fetchLatest();fetchHistory();
</script>
</body>
</html>`,
      { headers: { "Content-Type": "text/html" } }
      );
    }

    return new Response("Not found", { status: 404 });
  },
};
