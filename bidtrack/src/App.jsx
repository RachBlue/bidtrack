import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase ────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── Constants ───────────────────────────────────────────────
const STAGE_CONFIG = {
  Prospect:  { color: "#94a3b8", bg: "#1e293b" },
  Qualified: { color: "#f59e0b", bg: "#2d1f00" },
  Bidding:   { color: "#3b82f6", bg: "#0f1f3d" },
  Won:       { color: "#22c55e", bg: "#0d2218" },
  Lost:      { color: "#ef4444", bg: "#2d0f0f" },
};
const STAGES = ["Prospect", "Qualified", "Bidding", "Won", "Lost"];

// ─── Helpers ─────────────────────────────────────────────────
function fmt(n) {
  if (!n) return "$0";
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}
function daysUntil(d) { return Math.ceil((new Date(d) - new Date()) / 86400000); }

// ─── Global Styles ───────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@300;400;500;600&display=swap');
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body { margin: 0; padding: 0; background: #070b12; overscroll-behavior: none; font-family: 'Barlow', sans-serif; }
    input, select, textarea { font-size: 16px !important; font-family: 'Barlow', sans-serif; }
    ::-webkit-scrollbar { display: none; }
    @media print { .no-print { display: none !important; } }
  `}</style>
);

// ─── Badge ───────────────────────────────────────────────────
function Badge({ stage }) {
  const c = STAGE_CONFIG[stage] || STAGE_CONFIG.Prospect;
  return (
    <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}44`, borderRadius: 4, padding: "3px 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {stage}
    </span>
  );
}

// ─── Colors ──────────────────────────────────────────────────
const C = {
  bg: "#070b12", surface: "#0c1322", border: "#1a2a42",
  text: "#e2e8f0", muted: "#5a7090", dim: "#2a3a52",
  accent: "#f0921a", blue: "#2563eb", green: "#16a34a", red: "#ef4444",
};
const inputStyle = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 16, outline: "none" };
const labelStyle = { color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "block" };

// ─── PDF Export ──────────────────────────────────────────────
function exportPDF(leads) {
  const won = leads.filter(l => l.stage === "Won").reduce((s, l) => s + (l.value || 0), 0);
  const active = leads.filter(l => !["Won", "Lost"].includes(l.stage));
  const pipeline = active.reduce((s, l) => s + (l.value || 0) * (l.win_prob || 0) / 100, 0);
  const closed = leads.filter(l => ["Won", "Lost"].includes(l.stage)).length;
  const winRate = closed > 0 ? Math.round(leads.filter(l => l.stage === "Won").length / closed * 100) : 0;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>BidTrack Pipeline Report</title>
  <style>
    body { font-family: Arial, sans-serif; color: #1a1a2e; padding: 40px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 28px; color: #0a1628; margin-bottom: 4px; }
    .sub { color: #64748b; font-size: 13px; margin-bottom: 32px; }
    .stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 32px; }
    .stat { background: #f4f7fb; border-radius: 10px; padding: 16px; }
    .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
    .stat-value { font-size: 22px; font-weight: 800; color: #0a1628; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #0a1628; color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f9fafb; }
    .badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .footer { margin-top: 40px; color: #94a3b8; font-size: 11px; text-align: center; }
  </style></head><body>
  <h1>⬧ BIDTRACK</h1>
  <div class="sub">Pipeline Report · Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
  <div class="stats">
    <div class="stat"><div class="stat-label">Weighted Pipeline</div><div class="stat-value">${fmt(pipeline)}</div></div>
    <div class="stat"><div class="stat-label">Revenue Won</div><div class="stat-value">${fmt(won)}</div></div>
    <div class="stat"><div class="stat-label">Win Rate</div><div class="stat-value">${winRate}%</div></div>
    <div class="stat"><div class="stat-label">Total Bids</div><div class="stat-value">${leads.length}</div></div>
  </div>
  <table>
    <thead><tr><th>Project</th><th>Client</th><th>Stage</th><th>Value</th><th>Win %</th><th>Due Date</th><th>Contact</th></tr></thead>
    <tbody>${leads.map(l => `<tr>
      <td><strong>${l.project}</strong></td>
      <td>${l.client}</td>
      <td><span class="badge">${l.stage}</span></td>
      <td><strong>${fmt(l.value)}</strong></td>
      <td>${l.win_prob}%</td>
      <td>${l.due_date || "—"}</td>
      <td>${l.contact || "—"}</td>
    </tr>`).join("")}</tbody>
  </table>
  <div class="footer">Generated by BidTrack · Confidential</div>
  </body></html>`;

  const blob = new Blob([html], { type: "text/html" });
const url = URL.createObjectURL(blob);
const win = window.open(url, "_blank");
win.onload = () => {
  win.print();
  URL.revokeObjectURL(url);
};
}

// ─── AI Cost Estimator ───────────────────────────────────────
function CostEstimator() {
  const [form, setForm] = useState({ type: "Office", size: "", zip: "", quality: "Standard" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function estimate() {
    if (!form.size || !form.zip) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const prompt = `You are a commercial construction cost estimator with deep knowledge of current US market rates.

A contractor needs a bid estimate for this project:
- Project Type: ${form.type}
- Size: ${form.size} sq ft
- ZIP Code: ${form.zip}
- Quality Level: ${form.quality}

Using your knowledge of current construction costs in that region, provide a detailed estimate. Respond ONLY with a valid JSON object, no markdown, no backticks, exactly this structure:
{
  "location": "City, State name for that ZIP",
  "low": <number: low total cost estimate in dollars>,
  "mid": <number: mid total cost estimate in dollars>,
  "high": <number: high total cost estimate in dollars>,
  "costPerSqft": { "low": <number>, "mid": <number>, "high": <number> },
  "materials": <number: estimated materials cost>,
  "labor": <number: estimated labor cost>,
  "overhead": <number: estimated overhead and profit>,
  "competitorRange": "<string: e.g. '$X - $Y per sqft based on regional market'>",
  "warnings": ["<any risk factors or notes for this bid>"],
  "recommendation": "<one sentence on what to bid to win without underbidding>"
}`;

      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult({ ...parsed, form: { ...form } });
    } catch (e) {
      setError("Estimation failed. Check your connection and try again.");
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Form */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ color: C.accent, fontSize: 13, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          🤖 AI Cost Estimator
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Project Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
                {["Office", "Retail", "Medical", "Municipal", "Hospitality", "Industrial", "Mixed Use", "Warehouse", "School", "Parking Garage"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Quality Level</label>
              <select value={form.quality} onChange={e => setForm(p => ({ ...p, quality: e.target.value }))} style={inputStyle}>
                {["Economy", "Standard", "Premium", "Luxury"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Square Footage</label>
              <input type="number" placeholder="e.g. 15000" value={form.size} onChange={e => setForm(p => ({ ...p, size: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>ZIP Code</label>
              <input type="text" placeholder="e.g. 33410" maxLength={5} value={form.zip} onChange={e => setForm(p => ({ ...p, zip: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          <button onClick={estimate} disabled={loading || !form.size || !form.zip} style={{ background: loading ? C.dim : C.accent, color: "#080c14", border: "none", borderRadius: 10, padding: 14, fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s" }}>
            {loading ? "⏳ Estimating..." : "Get AI Estimate →"}
          </button>
        </div>
      </div>

      {error && <div style={{ background: "#2d0f0f", border: `1px solid ${C.red}44`, borderRadius: 12, padding: 16, color: C.red, fontSize: 13 }}>{error}</div>}

      {/* Results */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Header */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              {result.form.type} · {result.form.size} sqft · {result.location}
            </div>
            <div style={{ color: C.text, fontSize: 13, marginBottom: 14 }}>Bid Range</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[["Low", result.low, C.red], ["Mid", result.mid, C.accent], ["High", result.high, C.green]].map(([l, v, col]) => (
                <div key={l} style={{ background: C.bg, borderRadius: 10, padding: 12, border: `1px solid ${C.border}`, textAlign: "center" }}>
                  <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{l}</div>
                  <div style={{ color: col, fontWeight: 800, fontSize: 16 }}>{fmt(v)}</div>
                  <div style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>${result.costPerSqft[l.toLowerCase()]}/sqft</div>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Cost Breakdown</div>
            {[["🧱 Materials", result.materials], ["👷 Labor", result.labor], ["📋 Overhead & Profit", result.overhead]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ color: C.text, fontSize: 13 }}>{l}</span>
                <span style={{ color: C.accent, fontWeight: 700, fontSize: 15 }}>{fmt(v)}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 4 }}>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Competitor Range</div>
              <div style={{ color: C.blue, fontSize: 13, fontWeight: 600 }}>{result.competitorRange}</div>
            </div>
          </div>

          {/* Recommendation */}
          <div style={{ background: "#0d2218", border: `1px solid ${C.green}44`, borderRadius: 12, padding: 16 }}>
            <div style={{ color: C.green, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>💡 Bid Recommendation</div>
            <div style={{ color: C.text, fontSize: 14, lineHeight: 1.5 }}>{result.recommendation}</div>
          </div>

          {/* Warnings */}
          {result.warnings?.length > 0 && (
            <div style={{ background: "#2d1f00", border: `1px solid ${C.accent}44`, borderRadius: 12, padding: 16 }}>
              <div style={{ color: C.accent, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>⚠️ Risk Factors</div>
              {result.warnings.map((w, i) => (
                <div key={i} style={{ color: C.text, fontSize: 13, marginBottom: 6, paddingLeft: 12, borderLeft: `2px solid ${C.accent}` }}>{w}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Auth Screen ─────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleAuth() {
    setLoading(true); setError(null); setSuccess(null);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Check your email to confirm your account, then log in.");
        setMode("login");
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, background: C.accent, borderRadius: 2, transform: "rotate(45deg)", flexShrink: 0 }} />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 28, letterSpacing: "0.12em", color: "#f8fafc", textTransform: "uppercase" }}>BIDTRACK</span>
          </div>
          <div style={{ color: C.muted, fontSize: 13, fontWeight: 300, letterSpacing: "0.04em" }}>Commercial Bid Pipeline</div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", marginBottom: 24, background: C.bg, borderRadius: 8, padding: 3 }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, background: mode === m ? C.surface : "transparent", color: mode === m ? C.text : C.muted, border: "none", borderRadius: 6, padding: "8px", fontWeight: mode === m ? 700 : 400, fontSize: 13, cursor: "pointer", fontFamily: "'Barlow', sans-serif" }}>
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><label style={labelStyle}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" style={inputStyle} /></div>
            <div><label style={labelStyle}>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} /></div>
          </div>
          {error && <div style={{ color: C.red, fontSize: 12, marginTop: 10 }}>{error}</div>}
          {success && <div style={{ color: C.green, fontSize: 12, marginTop: 10 }}>{success}</div>}
          <button onClick={handleAuth} disabled={loading} style={{ width: "100%", background: C.accent, color: "#070b12", border: "none", borderRadius: 10, padding: 14, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", marginTop: 16 }}>
            {loading ? "..." : mode === "login" ? "Log In →" : "Create Account →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────
export default function BidPipeline() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [tab, setTab] = useState("leads");
  const [stageFilter, setStageFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newLead, setNewLead] = useState({ project: "", client: "", value: "", type: "Office", stage: "Prospect", due_date: "", contact: "", win_prob: 30, notes: "" });

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load leads when logged in
  useEffect(() => {
    if (session) fetchLeads();
  }, [session]);

  async function fetchLeads() {
    setDbLoading(true);
    const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (!error) setLeads(data || []);
    setDbLoading(false);
  }

  async function addLead() {
    if (!newLead.project || !newLead.client) return;
    const { data, error } = await supabase.from("leads").insert([{
      ...newLead,
      value: parseFloat(newLead.value) || 0,
      win_prob: parseInt(newLead.win_prob) || 30,
      last_touch: new Date().toISOString().slice(0, 10),
      user_id: session.user.id
    }]).select();
    if (!error && data) {
      setLeads(prev => [data[0], ...prev]);
      setNewLead({ project: "", client: "", value: "", type: "Office", stage: "Prospect", due_date: "", contact: "", win_prob: 30, notes: "" });
      setShowAdd(false);
      setTab("leads");
    }
  }

  async function moveStage(id, stage) {
    const win_prob = stage === "Won" ? 100 : stage === "Lost" ? 0 : leads.find(l => l.id === id)?.win_prob;
    await supabase.from("leads").update({ stage, win_prob }).eq("id", id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage, win_prob } : l));
    setSelected(prev => prev?.id === id ? { ...prev, stage, win_prob } : prev);
  }

  async function deleteLead(id) {
    await supabase.from("leads").delete().eq("id", id);
    setLeads(prev => prev.filter(l => l.id !== id));
    setSelected(null);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setLeads([]);
  }

  if (authLoading) return (
    <>
      <GlobalStyle />
      <div style={{ minHeight: "100dvh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 10, height: 10, background: C.accent, borderRadius: 2, transform: "rotate(45deg)" }} />
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 24, letterSpacing: "0.12em", color: "#f8fafc", textTransform: "uppercase" }}>BIDTRACK</span>
        </div>
        <div style={{ color: C.muted, fontSize: 13, fontWeight: 300 }}>Loading...</div>
      </div>
    </>
  );

  if (!session) return <><GlobalStyle /><AuthScreen onAuth={setSession} /></>;

  const activeLeads = leads.filter(l => !["Won", "Lost"].includes(l.stage));
  const pipeline = activeLeads.reduce((s, l) => s + (l.value || 0) * (l.win_prob || 0) / 100, 0);
  const won = leads.filter(l => l.stage === "Won").reduce((s, l) => s + (l.value || 0), 0);
  const closedCount = leads.filter(l => ["Won", "Lost"].includes(l.stage)).length;
  const winRate = closedCount > 0 ? Math.round(leads.filter(l => l.stage === "Won").length / closedCount * 100) : 0;
  const filtered = stageFilter === "All" ? leads : leads.filter(l => l.stage === stageFilter);

  return (
    <>
      <GlobalStyle />
      <div style={{ minHeight: "100dvh", background: C.bg, color: C.text, fontFamily: "'Barlow', sans-serif", display: "flex", flexDirection: "column", maxWidth: 600, margin: "0 auto" }}>

        {/* Header */}
        <div className="no-print" style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, background: C.accent, borderRadius: 2, transform: "rotate(45deg)", flexShrink: 0 }} />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 18, letterSpacing: "0.12em", color: "#f8fafc", textTransform: "uppercase" }}>BIDTRACK</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => exportPDF(leads)} style={{ background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 20, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              📄 Export
            </button>
            <button onClick={() => setShowAdd(true)} style={{ background: C.accent, color: "#070b12", border: "none", borderRadius: 20, padding: "7px 14px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 13, letterSpacing: "0.06em", cursor: "pointer" }}>
              + Add Bid
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>

          {/* LEADS TAB */}
          {tab === "leads" && (
            <div>
              <div style={{ display: "flex", gap: 8, padding: "12px 16px", overflowX: "auto", borderBottom: `1px solid ${C.border}` }}>
                {["All", ...STAGES].map(s => {
                  const active = stageFilter === s;
                  const col = s === "All" ? C.blue : STAGE_CONFIG[s]?.color;
                  return (
                    <button key={s} onClick={() => setStageFilter(s)} style={{ background: active ? `${col}22` : "transparent", color: active ? col : C.muted, border: `1px solid ${active ? col : C.border}`, borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: active ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {s}
                    </button>
                  );
                })}
              </div>
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {dbLoading && <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Loading bids...</div>}
                {!dbLoading && filtered.length === 0 && (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                    <div style={{ fontSize: 15, marginBottom: 6, color: C.text }}>No bids yet</div>
                    <div style={{ fontSize: 13 }}>Tap "+ Add Bid" to get started</div>
                  </div>
                )}
                {filtered.map(lead => {
                  const days = lead.due_date ? daysUntil(lead.due_date) : null;
                  const urgent = days !== null && days >= 0 && days <= 5 && !["Won", "Lost"].includes(lead.stage);
                  return (
                    <div key={lead.id} onClick={() => setSelected(lead)} style={{ background: C.surface, border: `1px solid ${urgent ? C.accent + "66" : C.border}`, borderRadius: 12, padding: 16, cursor: "pointer", borderLeft: `3px solid ${STAGE_CONFIG[lead.stage]?.color || C.muted}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div style={{ flex: 1, marginRight: 10 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3, lineHeight: 1.3 }}>{lead.project}</div>
                          <div style={{ color: C.muted, fontSize: 12 }}>{lead.client}</div>
                        </div>
                        <Badge stage={lead.stage} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: C.accent, fontWeight: 800, fontSize: 20 }}>{fmt(lead.value)}</span>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          {lead.due_date && <span style={{ color: urgent ? C.accent : C.muted, fontSize: 12, fontWeight: urgent ? 700 : 400 }}>{urgent ? `⚠️ ${days}d left` : lead.due_date}</span>}
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <div style={{ width: 32, height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ width: `${lead.win_prob}%`, height: "100%", background: lead.win_prob > 70 ? C.green : lead.win_prob > 40 ? C.accent : C.red, borderRadius: 2 }} />
                            </div>
                            <span style={{ color: C.muted, fontSize: 11 }}>{lead.win_prob}%</span>
                          </div>
                        </div>
                      </div>
                      {lead.notes && <div style={{ color: C.muted, fontSize: 12, marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>{lead.notes}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STATS TAB */}
          {tab === "stats" && (
            <div style={{ padding: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "Pipeline", value: fmt(pipeline), sub: `${activeLeads.length} active`, color: C.blue },
                  { label: "Won", value: fmt(won), sub: `${leads.filter(l => l.stage === "Won").length} deals`, color: C.green },
                  { label: "Win Rate", value: `${winRate}%`, sub: `${closedCount} closed`, color: C.accent },
                  { label: "Total Bids", value: leads.length, sub: "all time", color: C.muted },
                ].map((s, i) => (
                  <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                    <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ color: s.color, fontSize: 26, fontWeight: 800, marginBottom: 2 }}>{s.value}</div>
                    <div style={{ color: C.dim, fontSize: 12 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>By Stage</div>
                {STAGES.map(stage => {
                  const count = leads.filter(l => l.stage === stage).length;
                  const val = leads.filter(l => l.stage === stage).reduce((s, l) => s + (l.value || 0), 0);
                  const pct = leads.length > 0 ? count / leads.length : 0;
                  const col = STAGE_CONFIG[stage].color;
                  return (
                    <div key={stage} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ color: col, fontSize: 13, fontWeight: 600 }}>{stage}</span>
                        <span style={{ color: C.muted, fontSize: 12 }}>{count} · {fmt(val)}</span>
                      </div>
                      <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${pct * 100}%`, height: "100%", background: col, borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={signOut} style={{ width: "100%", background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, fontSize: 13, cursor: "pointer" }}>
                Sign Out ({session.user.email})
              </button>
            </div>
          )}

          {/* ESTIMATOR TAB */}
          {tab === "estimate" && <CostEstimator />}
        </div>

        {/* Bottom Nav */}
        <div className="no-print" style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 600, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 50, paddingBottom: "env(safe-area-inset-bottom)" }}>
          {[{ id: "leads", icon: "📋", label: "Bids" }, { id: "stats", icon: "📊", label: "Stats" }, { id: "estimate", icon: "🤖", label: "Estimator" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: "transparent", border: "none", padding: "10px 0", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <span style={{ fontSize: 11, color: tab === t.id ? C.accent : C.muted, fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Detail Bottom Sheet */}
        {selected && (
          <div style={{ position: "fixed", inset: 0, background: "#000000bb", zIndex: 100, display: "flex", alignItems: "flex-end" }} onClick={() => setSelected(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 600, margin: "0 auto", maxHeight: "85vh", overflowY: "auto", paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}>
              <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 20px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ flex: 1, marginRight: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.3, marginBottom: 4 }}>{selected.project}</div>
                  <div style={{ color: C.muted, fontSize: 13 }}>{selected.client} · {selected.type}</div>
                </div>
                <Badge stage={selected.stage} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[["Value", fmt(selected.value)], ["Win %", `${selected.win_prob}%`], ["Due", selected.due_date || "—"], ["Contact", selected.contact || "—"]].map(([l, v]) => (
                  <div key={l} style={{ background: C.bg, borderRadius: 10, padding: 12, border: `1px solid ${C.border}` }}>
                    <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{l}</div>
                    <div style={{ color: C.accent, fontWeight: 700, fontSize: 15 }}>{v}</div>
                  </div>
                ))}
              </div>
              {selected.notes && (
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 20 }}>
                  <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Notes</div>
                  <div style={{ color: C.text, fontSize: 13 }}>{selected.notes}</div>
                </div>
              )}
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Move Stage</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {STAGES.map(s => {
                    const col = STAGE_CONFIG[s].color;
                    const active = selected.stage === s;
                    return (
                      <button key={s} onClick={() => moveStage(selected.id, s)} style={{ background: active ? STAGE_CONFIG[s].bg : "transparent", color: col, border: `1px solid ${col}`, borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: active ? 700 : 400, cursor: "pointer" }}>{s}</button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setSelected(null)} style={{ flex: 1, background: C.border, color: C.text, border: "none", borderRadius: 10, padding: 14, fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Close</button>
                <button onClick={() => deleteLead(selected.id)} style={{ background: "#2d0f0f", color: C.red, border: `1px solid ${C.red}44`, borderRadius: 10, padding: "14px 16px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Lead Bottom Sheet */}
        {showAdd && (
          <div style={{ position: "fixed", inset: 0, background: "#000000bb", zIndex: 100, display: "flex", alignItems: "flex-end" }} onClick={() => setShowAdd(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 600, margin: "0 auto", maxHeight: "92vh", overflowY: "auto", paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}>
              <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 20px" }} />
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>New Bid</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[{ label: "Project Name *", key: "project", placeholder: "e.g. Downtown Office Complex" }, { label: "Client / Company *", key: "client", placeholder: "Company name" }, { label: "Key Contact", key: "contact", placeholder: "Contact name" }].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <input value={newLead[key]} onChange={e => setNewLead(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={inputStyle} />
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Value ($)</label><input type="number" value={newLead.value} onChange={e => setNewLead(p => ({ ...p, value: e.target.value }))} placeholder="1500000" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Win %</label><input type="number" min="0" max="100" value={newLead.win_prob} onChange={e => setNewLead(p => ({ ...p, win_prob: e.target.value }))} style={inputStyle} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Type</label>
                    <select value={newLead.type} onChange={e => setNewLead(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
                      {["Office", "Retail", "Medical", "Municipal", "Hospitality", "Industrial", "Mixed Use", "Warehouse", "School", "Parking Garage"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Stage</label>
                    <select value={newLead.stage} onChange={e => setNewLead(p => ({ ...p, stage: e.target.value }))} style={inputStyle}>
                      {STAGES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div><label style={labelStyle}>Bid Due Date</label><input type="date" value={newLead.due_date} onChange={e => setNewLead(p => ({ ...p, due_date: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Notes</label><input value={newLead.notes} onChange={e => setNewLead(p => ({ ...p, notes: e.target.value }))} placeholder="Any details, follow-ups, reminders..." style={inputStyle} /></div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, background: C.border, color: C.text, border: "none", borderRadius: 10, padding: 14, fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Cancel</button>
                <button onClick={addLead} style={{ flex: 2, background: C.accent, color: "#080c14", border: "none", borderRadius: 10, padding: 14, fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Save Bid</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}