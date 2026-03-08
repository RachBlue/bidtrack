import { useState, useEffect } from "react";

const STORAGE_KEY = "bidtrack_leads";

function loadLeads() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

const STAGE_CONFIG = {
  Prospect:  { color: "#94a3b8", bg: "#1e293b", dot: "#64748b" },
  Qualified: { color: "#f59e0b", bg: "#2d1f00", dot: "#f59e0b" },
  Bidding:   { color: "#3b82f6", bg: "#0f1f3d", dot: "#3b82f6" },
  Won:       { color: "#22c55e", bg: "#0d2218", dot: "#22c55e" },
  Lost:      { color: "#ef4444", bg: "#2d0f0f", dot: "#ef4444" },
};

const STAGES = ["Prospect", "Qualified", "Bidding", "Won", "Lost"];

function fmt(n) {
  if (n >= 1000000) return `$${(n/1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n/1000).toFixed(0)}K`;
  return `$${n}`;
}

function daysUntil(dateStr) {
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  return diff;
}

function Badge({ stage }) {
  const c = STAGE_CONFIG[stage] || STAGE_CONFIG.Prospect;
  return (
    <span style={{
      background: c.bg, color: c.color,
      border: `1px solid ${c.color}33`,
      borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600,
      letterSpacing: "0.05em", textTransform: "uppercase"
    }}>{stage}</span>
  );
}

export default function BidPipeline() {
  const [leads, setLeads] = useState(() => loadLeads());
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState("pipeline"); // pipeline | kanban
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [newLead, setNewLead] = useState({ project: "", client: "", value: "", type: "Office", stage: "Prospect", dueDate: "", contact: "", winProb: 30 });

  // Save to localStorage whenever leads change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    } catch {}
  }, [leads]);

  const types = ["All", ...Array.from(new Set(leads.map(l => l.type)))];
  const filtered = filter === "All" ? leads : leads.filter(l => l.type === filter);

  const activeLeads = leads.filter(l => !["Won","Lost"].includes(l.stage));
  const pipeline = activeLeads.reduce((s, l) => s + l.value * l.winProb / 100, 0);
  const won = leads.filter(l => l.stage === "Won").reduce((s, l) => s + l.value, 0);
  const winRate = leads.filter(l => ["Won","Lost"].includes(l.stage)).length > 0
    ? Math.round(leads.filter(l => l.stage === "Won").length / leads.filter(l => ["Won","Lost"].includes(l.stage)).length * 100)
    : 0;

  function addLead() {
    if (!newLead.project || !newLead.client) return;
    setLeads(prev => [...prev, { ...newLead, id: Date.now(), value: parseFloat(newLead.value)||0, winProb: parseInt(newLead.winProb)||30, lastTouch: new Date().toISOString().slice(0,10) }]);
    setNewLead({ project: "", client: "", value: "", type: "Office", stage: "Prospect", dueDate: "", contact: "", winProb: 30 });
    setShowAdd(false);
  }

  function moveStage(id, stage) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage, winProb: stage === "Won" ? 100 : stage === "Lost" ? 0 : l.winProb } : l));
    setSelected(prev => prev?.id === id ? { ...prev, stage } : prev);
  }

  const styles = {
    app: { minHeight: "100vh", background: "#080c14", color: "#e2e8f0", fontFamily: "'DM Mono', 'Fira Code', monospace", fontSize: 13 },
    header: { background: "#0d1526", borderBottom: "1px solid #1e2d4a", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 },
    logo: { color: "#f8fafc", fontWeight: 700, fontSize: 15, letterSpacing: "0.12em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 10 },
    logoAccent: { width: 8, height: 8, background: "#f59e0b", borderRadius: 2, transform: "rotate(45deg)" },
    statsBar: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "#0d1526", borderBottom: "1px solid #1e2d4a" },
    stat: { padding: "16px 28px", borderRight: "1px solid #1e2d4a" },
    statLabel: { color: "#64748b", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 },
    statValue: { color: "#f8fafc", fontSize: 22, fontWeight: 700 },
    statSub: { color: "#64748b", fontSize: 11, marginTop: 2 },
    toolbar: { display: "flex", alignItems: "center", gap: 8, padding: "12px 28px", borderBottom: "1px solid #1e2d4a", background: "#080c14" },
    filterBtn: (active) => ({ background: active ? "#1e3a5f" : "transparent", color: active ? "#60a5fa" : "#64748b", border: `1px solid ${active ? "#3b82f6" : "#1e2d4a"}`, borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 11, letterSpacing: "0.05em" }),
    viewBtn: (active) => ({ background: active ? "#f59e0b22" : "transparent", color: active ? "#f59e0b" : "#64748b", border: `1px solid ${active ? "#f59e0b" : "#1e2d4a"}`, borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 11 }),
    addBtn: { marginLeft: "auto", background: "#f59e0b", color: "#080c14", border: "none", borderRadius: 4, padding: "5px 14px", cursor: "pointer", fontWeight: 700, fontSize: 11, letterSpacing: "0.05em" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", color: "#475569", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 28px", borderBottom: "1px solid #1e2d4a", fontWeight: 500 },
    row: (urgent) => ({ borderBottom: "1px solid #0f1726", cursor: "pointer", background: urgent ? "#1a0f00" : "transparent", transition: "background 0.15s" }),
    td: { padding: "11px 28px", verticalAlign: "middle" },
    proj: { color: "#e2e8f0", fontWeight: 600, fontSize: 13, marginBottom: 2 },
    client: { color: "#64748b", fontSize: 11 },
    kanban: { display: "flex", gap: 12, padding: "20px 28px", overflowX: "auto" },
    col: { minWidth: 220, flex: 1 },
    colHead: (stage) => ({ background: STAGE_CONFIG[stage]?.bg || "#1e293b", borderRadius: "6px 6px 0 0", padding: "8px 12px", borderBottom: `2px solid ${STAGE_CONFIG[stage]?.color || "#475569"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }),
    colTitle: (stage) => ({ color: STAGE_CONFIG[stage]?.color || "#e2e8f0", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }),
    card: { background: "#0d1526", border: "1px solid #1e2d4a", borderRadius: "0 0 6px 6px", marginBottom: 8, padding: 12, cursor: "pointer" },
    cardProj: { color: "#e2e8f0", fontWeight: 600, fontSize: 12, marginBottom: 4 },
    cardVal: { color: "#f59e0b", fontWeight: 700, fontSize: 14 },
    modal: { position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    modalBox: { background: "#0d1526", border: "1px solid #1e2d4a", borderRadius: 8, padding: 28, width: 480, maxWidth: "90vw" },
    modalTitle: { color: "#f8fafc", fontWeight: 700, fontSize: 16, marginBottom: 20 },
    label: { color: "#64748b", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4, display: "block" },
    input: { width: "100%", background: "#080c14", border: "1px solid #1e2d4a", borderRadius: 4, padding: "7px 10px", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" },
    row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    saveBtn: { background: "#f59e0b", color: "#080c14", border: "none", borderRadius: 4, padding: "8px 20px", fontWeight: 700, fontSize: 12, cursor: "pointer", marginTop: 16 },
    cancelBtn: { background: "transparent", color: "#64748b", border: "1px solid #1e2d4a", borderRadius: 4, padding: "8px 16px", fontSize: 12, cursor: "pointer", marginTop: 16, marginLeft: 8 },
  };

  const urgentDays = 5;

  return (
    <div style={styles.app}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoAccent} />
          BUILDTRACK
          <span style={{ color: "#334155", fontWeight: 400, fontSize: 11 }}>/ Commercial Bid Pipeline</span>
        </div>
        <span style={{ color: "#334155", fontSize: 11 }}>FY 2026</span>
      </div>

      {/* Stats */}
      <div style={styles.statsBar}>
        {[
          { label: "Weighted Pipeline", value: fmt(pipeline), sub: `${activeLeads.length} active bids` },
          { label: "Revenue Won", value: fmt(won), sub: "closed deals" },
          { label: "Win Rate", value: `${winRate}%`, sub: "closed bids" },
          { label: "Avg Deal Size", value: fmt(leads.reduce((s,l)=>s+l.value,0)/leads.length), sub: "across all stages" },
        ].map((s, i) => (
          <div key={i} style={styles.stat}>
            <div style={styles.statLabel}>{s.label}</div>
            <div style={styles.statValue}>{s.value}</div>
            <div style={styles.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={styles.toolbar}>
        {types.map(t => <button key={t} style={styles.filterBtn(filter===t)} onClick={() => setFilter(t)}>{t}</button>)}
        <div style={{ width: 1, height: 20, background: "#1e2d4a", margin: "0 4px" }} />
        <button style={styles.viewBtn(view==="pipeline")} onClick={() => setView("pipeline")}>List</button>
        <button style={styles.viewBtn(view==="kanban")} onClick={() => setView("kanban")}>Kanban</button>
        <button style={styles.addBtn} onClick={() => setShowAdd(true)}>+ Add Lead</button>
      </div>

      {/* Pipeline Table */}
      {view === "pipeline" && (
        <table style={styles.table}>
          <thead>
            <tr>
              {["Project / Client","Type","Stage","Value","Win %","Due Date","Contact","Last Touch"].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "60px 28px", textAlign: "center", color: "#334155" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                  <div style={{ color: "#475569", fontSize: 14, marginBottom: 6 }}>No leads yet</div>
                  <div style={{ color: "#334155", fontSize: 12 }}>Click "+ Add Lead" to add your first bid</div>
                </td>
              </tr>
            )}
            {filtered.map(lead => {
              const days = daysUntil(lead.dueDate);
              const urgent = days >= 0 && days <= urgentDays && !["Won","Lost"].includes(lead.stage);
              return (
                <tr key={lead.id} style={styles.row(urgent)} onClick={() => setSelected(lead)}
                  onMouseEnter={e => e.currentTarget.style.background = "#0d1526"}
                  onMouseLeave={e => e.currentTarget.style.background = urgent ? "#1a0f00" : "transparent"}>
                  <td style={styles.td}>
                    <div style={styles.proj}>{lead.project}</div>
                    <div style={styles.client}>{lead.client}</div>
                  </td>
                  <td style={styles.td}><span style={{ color: "#64748b", fontSize: 11 }}>{lead.type}</span></td>
                  <td style={styles.td}><Badge stage={lead.stage} /></td>
                  <td style={styles.td}><span style={{ color: "#f59e0b", fontWeight: 700 }}>{fmt(lead.value)}</span></td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 48, height: 4, background: "#1e2d4a", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${lead.winProb}%`, height: "100%", background: lead.winProb > 70 ? "#22c55e" : lead.winProb > 40 ? "#f59e0b" : "#ef4444", borderRadius: 2 }} />
                      </div>
                      <span style={{ color: "#94a3b8", fontSize: 11 }}>{lead.winProb}%</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{ color: urgent ? "#f59e0b" : "#64748b", fontSize: 11, fontWeight: urgent ? 700 : 400 }}>
                      {lead.dueDate} {urgent ? `(${days}d!)` : ""}
                    </span>
                  </td>
                  <td style={styles.td}><span style={{ color: "#94a3b8", fontSize: 11 }}>{lead.contact}</span></td>
                  <td style={styles.td}><span style={{ color: "#475569", fontSize: 11 }}>{lead.lastTouch}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Kanban */}
      {view === "kanban" && (
        <div style={styles.kanban}>
          {STAGES.map(stage => {
            const cards = filtered.filter(l => l.stage === stage);
            return (
              <div key={stage} style={styles.col}>
                <div style={styles.colHead(stage)}>
                  <span style={styles.colTitle(stage)}>{stage}</span>
                  <span style={{ color: "#475569", fontSize: 11 }}>{cards.length}</span>
                </div>
                {cards.map(lead => (
                  <div key={lead.id} style={styles.card} onClick={() => setSelected(lead)}>
                    <div style={styles.cardProj}>{lead.project}</div>
                    <div style={{ color: "#475569", fontSize: 11, marginBottom: 6 }}>{lead.client}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={styles.cardVal}>{fmt(lead.value)}</span>
                      <span style={{ color: "#475569", fontSize: 11 }}>{lead.winProb}%</span>
                    </div>
                  </div>
                ))}
                {cards.length === 0 && <div style={{ ...styles.card, color: "#334155", textAlign: "center", fontSize: 11 }}>No bids</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div style={styles.modal} onClick={() => setSelected(null)}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 16 }}>{selected.project}</div>
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{selected.client} · {selected.type}</div>
              </div>
              <Badge stage={selected.stage} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[
                ["Contract Value", fmt(selected.value)],
                ["Win Probability", `${selected.winProb}%`],
                ["Due Date", selected.dueDate],
                ["Key Contact", selected.contact],
              ].map(([l, v]) => (
                <div key={l} style={{ background: "#080c14", borderRadius: 6, padding: 12, border: "1px solid #1e2d4a" }}>
                  <div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{l}</div>
                  <div style={{ color: "#f59e0b", fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Move Stage</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {STAGES.map(s => (
                  <button key={s} onClick={() => moveStage(selected.id, s)}
                    style={{ background: selected.stage === s ? STAGE_CONFIG[s]?.bg : "transparent", color: STAGE_CONFIG[s]?.color, border: `1px solid ${STAGE_CONFIG[s]?.color}`, borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: selected.stage === s ? 700 : 400 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button style={styles.cancelBtn} onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAdd && (
        <div style={styles.modal} onClick={() => setShowAdd(false)}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>Add New Lead</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label style={styles.label}>Project Name</label><input style={styles.input} value={newLead.project} onChange={e => setNewLead(p => ({...p, project: e.target.value}))} placeholder="e.g. Downtown Office Complex" /></div>
              <div style={styles.row2}>
                <div><label style={styles.label}>Client</label><input style={styles.input} value={newLead.client} onChange={e => setNewLead(p => ({...p, client: e.target.value}))} placeholder="Company name" /></div>
                <div><label style={styles.label}>Contact</label><input style={styles.input} value={newLead.contact} onChange={e => setNewLead(p => ({...p, contact: e.target.value}))} placeholder="Name" /></div>
              </div>
              <div style={styles.row2}>
                <div><label style={styles.label}>Contract Value ($)</label><input style={styles.input} type="number" value={newLead.value} onChange={e => setNewLead(p => ({...p, value: e.target.value}))} placeholder="e.g. 1500000" /></div>
                <div><label style={styles.label}>Win Probability (%)</label><input style={styles.input} type="number" min="0" max="100" value={newLead.winProb} onChange={e => setNewLead(p => ({...p, winProb: e.target.value}))} /></div>
              </div>
              <div style={styles.row2}>
                <div>
                  <label style={styles.label}>Type</label>
                  <select style={styles.input} value={newLead.type} onChange={e => setNewLead(p => ({...p, type: e.target.value}))}>
                    {["Office","Retail","Medical","Municipal","Hospitality","Industrial","Mixed Use"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Stage</label>
                  <select style={styles.input} value={newLead.stage} onChange={e => setNewLead(p => ({...p, stage: e.target.value}))}>
                    {STAGES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={styles.label}>Bid Due Date</label><input style={styles.input} type="date" value={newLead.dueDate} onChange={e => setNewLead(p => ({...p, dueDate: e.target.value}))} /></div>
            </div>
            <div>
              <button style={styles.saveBtn} onClick={addLead}>Add Lead</button>
              <button style={styles.cancelBtn} onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}