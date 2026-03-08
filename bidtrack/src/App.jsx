import { useState, useEffect } from "react";

const STORAGE_KEY = "bidtrack_leads";

function loadLeads() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

const STAGE_CONFIG = {
  Prospect:  { color: "#94a3b8", bg: "#1e293b" },
  Qualified: { color: "#f59e0b", bg: "#2d1f00" },
  Bidding:   { color: "#3b82f6", bg: "#0f1f3d" },
  Won:       { color: "#22c55e", bg: "#0d2218" },
  Lost:      { color: "#ef4444", bg: "#2d0f0f" },
};

const STAGES = ["Prospect", "Qualified", "Bidding", "Won", "Lost"];

function fmt(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function Badge({ stage }) {
  const c = STAGE_CONFIG[stage] || STAGE_CONFIG.Prospect;
  return (
    <span style={{
      background: c.bg, color: c.color,
      border: `1px solid ${c.color}44`,
      borderRadius: 4, padding: "3px 8px", fontSize: 10, fontWeight: 700,
      letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap"
    }}>{stage}</span>
  );
}

const GlobalStyle = () => (
  <style>{`
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body { margin: 0; padding: 0; background: #080c14; overscroll-behavior: none; }
    input, select { font-size: 16px !important; }
    ::-webkit-scrollbar { display: none; }
  `}</style>
);

export default function BidPipeline() {
  const [leads, setLeads] = useState(() => loadLeads());
  const [tab, setTab] = useState("leads");
  const [stageFilter, setStageFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newLead, setNewLead] = useState({ project: "", client: "", value: "", type: "Office", stage: "Prospect", dueDate: "", contact: "", winProb: 30 });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(leads)); } catch {}
  }, [leads]);

  const activeLeads = leads.filter(l => !["Won", "Lost"].includes(l.stage));
  const pipeline = activeLeads.reduce((s, l) => s + l.value * l.winProb / 100, 0);
  const won = leads.filter(l => l.stage === "Won").reduce((s, l) => s + l.value, 0);
  const closedCount = leads.filter(l => ["Won", "Lost"].includes(l.stage)).length;
  const winRate = closedCount > 0 ? Math.round(leads.filter(l => l.stage === "Won").length / closedCount * 100) : 0;
  const filtered = stageFilter === "All" ? leads : leads.filter(l => l.stage === stageFilter);

  function addLead() {
    if (!newLead.project || !newLead.client) return;
    setLeads(prev => [...prev, {
      ...newLead, id: Date.now(),
      value: parseFloat(newLead.value) || 0,
      winProb: parseInt(newLead.winProb) || 30,
      lastTouch: new Date().toISOString().slice(0, 10)
    }]);
    setNewLead({ project: "", client: "", value: "", type: "Office", stage: "Prospect", dueDate: "", contact: "", winProb: 30 });
    setShowAdd(false);
    setTab("leads");
  }

  function moveStage(id, stage) {
    setLeads(prev => prev.map(l => l.id === id
      ? { ...l, stage, winProb: stage === "Won" ? 100 : stage === "Lost" ? 0 : l.winProb }
      : l));
    setSelected(prev => prev?.id === id ? { ...prev, stage } : prev);
  }

  function deleteLead(id) {
    setLeads(prev => prev.filter(l => l.id !== id));
    setSelected(null);
  }

  const C = {
    bg: "#080c14", surface: "#0d1526", border: "#1e2d4a",
    text: "#e2e8f0", muted: "#64748b", dim: "#334155",
    accent: "#f59e0b", blue: "#3b82f6", green: "#22c55e", red: "#ef4444",
  };

  const inputStyle = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 16, outline: "none" };
  const labelStyle = { color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "block" };

  return (
    <>
      <GlobalStyle />
      <div style={{ minHeight: "100dvh", background: C.bg, color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif", display: "flex", flexDirection: "column", maxWidth: 600, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, background: C.accent, borderRadius: 2, transform: "rotate(45deg)" }} />
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "0.08em", color: "#f8fafc" }}>BUILDTRACK</span>
          </div>
          <button onClick={() => setShowAdd(true)} style={{ background: C.accent, color: "#080c14", border: "none", borderRadius: 20, padding: "7px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            + Add Bid
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 72 }}>

          {/* LEADS TAB */}
          {tab === "leads" && (
            <div>
              <div style={{ display: "flex", gap: 8, padding: "12px 16px", overflowX: "auto", borderBottom: `1px solid ${C.border}` }}>
                {["All", ...STAGES].map(s => {
                  const active = stageFilter === s;
                  const col = s === "All" ? C.blue : STAGE_CONFIG[s]?.color;
                  return (
                    <button key={s} onClick={() => setStageFilter(s)} style={{
                      background: active ? `${col}22` : "transparent",
                      color: active ? col : C.muted,
                      border: `1px solid ${active ? col : C.border}`,
                      borderRadius: 20, padding: "5px 12px", fontSize: 12,
                      fontWeight: active ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0
                    }}>{s}</button>
                  );
                })}
              </div>

              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.length === 0 && (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                    <div style={{ fontSize: 15, marginBottom: 6, color: C.text }}>No bids yet</div>
                    <div style={{ fontSize: 13 }}>Tap "+ Add Bid" to get started</div>
                  </div>
                )}
                {filtered.map(lead => {
                  const days = daysUntil(lead.dueDate);
                  const urgent = days >= 0 && days <= 5 && !["Won", "Lost"].includes(lead.stage);
                  return (
                    <div key={lead.id} onClick={() => setSelected(lead)} style={{
                      background: C.surface, border: `1px solid ${urgent ? C.accent + "66" : C.border}`,
                      borderRadius: 12, padding: 16, cursor: "pointer",
                      borderLeft: `3px solid ${STAGE_CONFIG[lead.stage]?.color || C.muted}`
                    }}>
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
                          {lead.dueDate && (
                            <span style={{ color: urgent ? C.accent : C.muted, fontSize: 12, fontWeight: urgent ? 700 : 400 }}>
                              {urgent ? `⚠️ ${days}d left` : lead.dueDate}
                            </span>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <div style={{ width: 32, height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ width: `${lead.winProb}%`, height: "100%", background: lead.winProb > 70 ? C.green : lead.winProb > 40 ? C.accent : C.red, borderRadius: 2 }} />
                            </div>
                            <span style={{ color: C.muted, fontSize: 11 }}>{lead.winProb}%</span>
                          </div>
                        </div>
                      </div>
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

              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>By Stage</div>
                {STAGES.map(stage => {
                  const count = leads.filter(l => l.stage === stage).length;
                  const val = leads.filter(l => l.stage === stage).reduce((s, l) => s + l.value, 0);
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
            </div>
          )}
        </div>

        {/* Bottom Nav */}
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 600, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 50, paddingBottom: "env(safe-area-inset-bottom)" }}>
          {[{ id: "leads", icon: "📋", label: "Bids" }, { id: "stats", icon: "📊", label: "Stats" }].map(t => (
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
                {[["Value", fmt(selected.value)], ["Win %", `${selected.winProb}%`], ["Due", selected.dueDate || "—"], ["Contact", selected.contact || "—"]].map(([l, v]) => (
                  <div key={l} style={{ background: C.bg, borderRadius: 10, padding: 12, border: `1px solid ${C.border}` }}>
                    <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{l}</div>
                    <div style={{ color: C.accent, fontWeight: 700, fontSize: 15 }}>{v}</div>
                  </div>
                ))}
              </div>
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
                  <div><label style={labelStyle}>Win %</label><input type="number" min="0" max="100" value={newLead.winProb} onChange={e => setNewLead(p => ({ ...p, winProb: e.target.value }))} style={inputStyle} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Type</label>
                    <select value={newLead.type} onChange={e => setNewLead(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
                      {["Office", "Retail", "Medical", "Municipal", "Hospitality", "Industrial", "Mixed Use"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Stage</label>
                    <select value={newLead.stage} onChange={e => setNewLead(p => ({ ...p, stage: e.target.value }))} style={inputStyle}>
                      {STAGES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div><label style={labelStyle}>Bid Due Date</label><input type="date" value={newLead.dueDate} onChange={e => setNewLead(p => ({ ...p, dueDate: e.target.value }))} style={inputStyle} /></div>
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