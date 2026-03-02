import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../utils/supabase";

const fmt = (cents) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);

// ── Copy button ──────────────────────────────────────────
function CopyBtn({ text, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{
      background: copied ? "rgba(53,242,168,0.15)" : "rgba(255,255,255,0.08)",
      border: `1px solid ${copied ? "rgba(53,242,168,0.4)" : "rgba(255,255,255,0.12)"}`,
      borderRadius: 8, padding: "5px 14px",
      color: copied ? "#35f2a8" : "rgba(238,240,248,0.6)",
      fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", flexShrink: 0,
    }}>
      {copied ? "Copied" : (label || "Copy")}
    </button>
  );
}

function Row({ label, value, mono }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ color: "rgba(238,240,248,0.45)", fontSize: 13 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: "#eef0f8", fontSize: 14, fontWeight: 600, fontFamily: mono ? "DM Mono, monospace" : "inherit" }}>{value}</span>
        <CopyBtn text={value} />
      </div>
    </div>
  );
}

// Simple visual QR
function QRCode({ value, size = 180 }) {
  const GRID = 25;
  const seed = [...value].reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const abs = Math.abs(seed);

  const finder = new Set();
  const addFinder = (startR, startC) => {
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
      if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4))
        finder.add(`${startR + r},${startC + c}`);
    }
  };
  addFinder(0, 0); addFinder(0, GRID - 7); addFinder(GRID - 7, 0);

  const cells = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const key = `${r},${c}`;
      const isFinder = finder.has(key);
      const dark = isFinder || ((abs ^ (r * 37 + c * 19 + r * c * 3)) % 3 !== 0);
      cells.push({ r, c, dark });
    }
  }

  return (
    <div style={{ background: "#fff", padding: 10, borderRadius: 12, display: "inline-block" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID}, ${(size - 20) / GRID}px)`, gap: 0 }}>
        {cells.map(({ r, c, dark }) => (
          <div key={`${r}-${c}`} style={{ width: (size - 20) / GRID, height: (size - 20) / GRID, background: dark ? "#060810" : "#fff" }} />
        ))}
      </div>
    </div>
  );
}

// ── Card form ────────────────────────────────────────────
function CardForm({ amount, onSuccess }) {
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  const formatCard = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  };

  const cardType = () => {
    const n = card.replace(/\s/g, "");
    if (n.startsWith("4")) return { label: "Visa", logo: "VISA" };
    if (n.startsWith("5") || n.startsWith("2")) return { label: "Mastercard", logo: "MC" };
    return null;
  };

  const validate = () => {
    const e = {};
    if (card.replace(/\s/g, "").length < 16) e.card = "Enter a valid 16-digit card number";
    if (expiry.length < 5) e.expiry = "Enter valid expiry MM/YY";
    if (cvv.length < 3) e.cvv = "Enter valid CVV";
    if (!name.trim()) e.name = "Enter cardholder name";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = () => {
    if (!validate()) return;
    setProcessing(true);
    setTimeout(() => { setProcessing(false); onSuccess(); }, 2200);
  };

  const ct = cardType();

  return (
    <div>
      {/* Card preview */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        borderRadius: 18, padding: "22px 24px", marginBottom: 24,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ fontSize: 22 }}>✦</div>
          {ct && (
            <div style={{ display: "flex", alignItems: "center" }}>
              {ct.logo === "VISA" ? (
                <span style={{ color: "#fff", background: "#1a1f71", borderRadius: 4, padding: "2px 8px", fontWeight: 900, fontSize: 13, fontStyle: "italic", letterSpacing: 1 }}>VISA</span>
              ) : (
                <div style={{ display: "flex" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#eb001b", opacity: 0.9 }} />
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#f79e1b", marginLeft: -10, opacity: 0.9 }} />
                </div>
              )}
            </div>
          )}
        </div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 20, letterSpacing: "0.15em", fontFamily: "DM Mono, monospace", margin: "0 0 16px" }}>
          {card || "....  ....  ....  ...."}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Card Holder</p>
            <p style={{ color: "#fff", fontSize: 13, fontWeight: 600, margin: 0 }}>{name || "YOUR NAME"}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Expires</p>
            <p style={{ color: "#fff", fontSize: 13, fontWeight: 600, margin: 0 }}>{expiry || "MM/YY"}</p>
          </div>
        </div>
      </div>

      {/* Card Number */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ color: "rgba(238,240,248,0.5)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 7 }}>Card Number</label>
        <input
          type="tel"
          value={card}
          onChange={e => setCard(formatCard(e.target.value))}
          placeholder="1234 5678 9012 3456"
          style={{ width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${errors.card ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, color: "#eef0f8", fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "DM Mono, monospace" }}
          onFocus={e => e.target.style.borderColor = "rgba(53,242,168,0.5)"}
          onBlur={e => e.target.style.borderColor = errors.card ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}
        />
        {errors.card && <p style={{ color: "#f87171", fontSize: 12, margin: "4px 0 0" }}>{errors.card}</p>}
      </div>

      {/* Name */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ color: "rgba(238,240,248,0.5)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 7 }}>Cardholder Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="John Smith"
          style={{ width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${errors.name ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, color: "#eef0f8", fontSize: 15, outline: "none", boxSizing: "border-box" }}
          onFocus={e => e.target.style.borderColor = "rgba(53,242,168,0.5)"}
          onBlur={e => e.target.style.borderColor = errors.name ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}
        />
        {errors.name && <p style={{ color: "#f87171", fontSize: 12, margin: "4px 0 0" }}>{errors.name}</p>}
      </div>

      {/* Expiry + CVV */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        <div>
          <label style={{ color: "rgba(238,240,248,0.5)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 7 }}>Expiry</label>
          <input type="tel" value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY"
            style={{ width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${errors.expiry ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, color: "#eef0f8", fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "DM Mono, monospace" }}
            onFocus={e => e.target.style.borderColor = "rgba(53,242,168,0.5)"}
            onBlur={e => e.target.style.borderColor = errors.expiry ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}
          />
          {errors.expiry && <p style={{ color: "#f87171", fontSize: 12, margin: "4px 0 0" }}>{errors.expiry}</p>}
        </div>
        <div>
          <label style={{ color: "rgba(238,240,248,0.5)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 7 }}>CVV</label>
          <input type="tel" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123"
            style={{ width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${errors.cvv ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, color: "#eef0f8", fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "DM Mono, monospace" }}
            onFocus={e => e.target.style.borderColor = "rgba(53,242,168,0.5)"}
            onBlur={e => e.target.style.borderColor = errors.cvv ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}
          />
          {errors.cvv && <p style={{ color: "#f87171", fontSize: 12, margin: "4px 0 0" }}>{errors.cvv}</p>}
        </div>
      </div>

      {/* Security badges */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 20 }}>
        {["256-bit SSL", "3D Secure", "PCI DSS"].map(b => (
          <span key={b} style={{ color: "rgba(238,240,248,0.3)", fontSize: 11 }}>&#x1F512; {b}</span>
        ))}
      </div>

      <button
        onClick={handlePay}
        disabled={processing}
        style={{
          width: "100%", padding: "16px", borderRadius: 14, border: "none",
          background: processing ? "rgba(53,242,168,0.35)" : "linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)",
          color: "#050c18", fontSize: 16, fontWeight: 800,
          cursor: processing ? "not-allowed" : "pointer",
          boxShadow: processing ? "none" : "0 0 28px rgba(53,242,168,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        {processing ? (
          <>
            <div style={{ width: 18, height: 18, border: "2px solid rgba(5,12,24,0.3)", borderTopColor: "#050c18", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            Processing...
          </>
        ) : `Pay ${fmt(amount)} securely`}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────
export default function GuestPaymentPage() {
  const { requestId } = useParams();
  const [step, setStep] = useState("loading");
  const [method, setMethod] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [allCopied, setAllCopied] = useState(false);
  const [req, setReq] = useState(null);
  const [error, setError] = useState(null);

  // Load payment request from Supabase
  useEffect(() => {
    const loadRequest = async () => {
      if (!requestId) { setError("No payment request ID found."); setStep("error"); return; }

      const { data, error: fetchErr } = await supabase
        .from("payment_requests")
        .select(`
          id,
          amount,
          note,
          expires_at,
          status,
          profiles:requester_id (
            full_name,
            username,
            avatar_url
          ),
          bank_accounts:requester_id (
            bsb,
            account_number
          )
        `)
        .eq("id", requestId)
        .single();

      if (fetchErr || !data) {
        setError("Payment request not found or has expired.");
        setStep("error");
        return;
      }

      if (data.status === "paid") {
        setStep("already_paid");
        setReq(data);
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError("This payment request has expired.");
        setStep("error");
        return;
      }

      // Build a flat req object for easy use
      const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
      const bank = Array.isArray(data.bank_accounts) ? data.bank_accounts[0] : data.bank_accounts;

      setReq({
        id: data.id,
        amount: data.amount,
        note: data.note,
        expires_at: data.expires_at,
        requester: {
          full_name: profile?.full_name || "ShadowMint User",
          username: profile?.username || "user",
          avatar_url: profile?.avatar_url || null,
        },
        bsb: bank?.bsb || "062-000",
        account_number: bank?.account_number || "N/A",
        payid: `${profile?.username || "user"}@shadowmint.app`,
      });

      setStep("landing");
    };

    loadRequest();
  }, [requestId]);

  // Countdown timer
  useEffect(() => {
    if (!req?.expires_at) return;
    const tick = () => {
      const diff = new Date(req.expires_at) - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m remaining`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [req]);

  const copyAll = () => {
    if (!req) return;
    navigator.clipboard?.writeText(
      `Pay ${fmt(req.amount)} to ${req.requester.full_name}\nBSB: ${req.bsb}\nAccount: ${req.account_number}\nRef: ${req.id}`
    ).catch(() => {});
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2500);
  };

  const s = {
    page: { minHeight: "100vh", background: "#060810", fontFamily: "DM Sans, system-ui, sans-serif", color: "#eef0f8" },
    inner: { maxWidth: 480, margin: "0 auto", padding: "0 20px 60px" },
    brand: { textAlign: "center", paddingTop: 32, marginBottom: 24 },
    amberCard: { background: "linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%)", borderRadius: 24, padding: "28px 24px", textAlign: "center", boxShadow: "0 8px 40px rgba(246,166,35,0.25)", position: "relative", overflow: "hidden", marginBottom: 20 },
    card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden" },
    backBtn: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#eef0f8", fontSize: 18, marginBottom: 20 },
  };

  // ── Loading ────────────────────────────────────────────
  if (step === "loading") return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid rgba(53,242,168,0.2)", borderTopColor: "#35f2a8", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "rgba(238,240,248,0.4)", fontSize: 14 }}>Loading payment request...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Error ──────────────────────────────────────────────
  if (step === "error") return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#x26A0;&#xFE0F;</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>Request not found</h2>
        <p style={{ color: "rgba(238,240,248,0.4)", fontSize: 14, margin: "0 0 24px" }}>{error || "This payment link is invalid or has expired."}</p>
        <a href="/" style={{ color: "#35f2a8", fontSize: 14, fontWeight: 600 }}>Go to ShadowMint</a>
      </div>
    </div>
  );

  // ── Already paid ───────────────────────────────────────
  if (step === "already_paid") return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#x2705;</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>Already paid</h2>
        <p style={{ color: "rgba(238,240,248,0.4)", fontSize: 14 }}>This payment request has already been fulfilled.</p>
      </div>
    </div>
  );

  // ── Success ────────────────────────────────────────────
  if (step === "success") return (
    <div style={s.page}>
      <div style={{ ...s.inner, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", textAlign: "center" }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(135deg, rgba(53,242,168,0.2), rgba(24,200,122,0.2))", border: "2px solid rgba(53,242,168,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, marginBottom: 24, boxShadow: "0 0 40px rgba(53,242,168,0.2)", animation: "popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)" }}>&#x2713;</div>
        <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 800 }}>Payment sent!</h1>
        <p style={{ margin: "0 0 4px", color: "rgba(238,240,248,0.5)", fontSize: 15 }}>You paid</p>
        <p style={{ margin: "0 0 4px", fontSize: 38, fontWeight: 800, color: "#35f2a8" }}>{fmt(req.amount)}</p>
        <p style={{ margin: "0 0 32px", color: "rgba(238,240,248,0.4)", fontSize: 14 }}>to {req.requester.full_name}</p>
        {req.note && (
          <div style={{ background: "rgba(53,242,168,0.06)", border: "1px solid rgba(53,242,168,0.15)", borderRadius: 14, padding: "12px 20px", marginBottom: 32 }}>
            <p style={{ margin: 0, color: "rgba(238,240,248,0.5)", fontSize: 14 }}>{req.note}</p>
          </div>
        )}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "18px 20px", marginBottom: 28, width: "100%" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(238,240,248,0.5)" }}>Transaction reference</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, fontFamily: "DM Mono, monospace", color: "#35f2a8" }}>{req.id.toUpperCase()}</p>
        </div>
        <div style={{ background: "rgba(53,242,168,0.05)", border: "1px solid rgba(53,242,168,0.15)", borderRadius: 14, padding: "14px 18px", marginBottom: 28, width: "100%" }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#35f2a8" }}>Want to send money for free?</p>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(238,240,248,0.45)" }}>Join ShadowMint - instant transfers, no fees.</p>
        </div>
      </div>
      <style>{`@keyframes popIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );

  // ── Landing ────────────────────────────────────────────
  if (step === "landing") return (
    <div style={{ ...s.page, background: "radial-gradient(circle at 50% 0%, rgba(246,166,35,0.1), transparent 55%), #060810" }}>
      <div style={s.inner}>
        <div style={s.brand}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#35f2a8", letterSpacing: "0.12em", textTransform: "uppercase" }}>ShadowMint</div>
          <p style={{ color: "rgba(238,240,248,0.35)", fontSize: 12, margin: "4px 0 0" }}>Secure Payment Request</p>
        </div>

        {/* Avatar */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          {req.requester.avatar_url ? (
            <img src={req.requester.avatar_url} alt="" style={{ width: 76, height: 76, borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px", display: "block", boxShadow: "0 0 28px rgba(246,166,35,0.3)" }} />
          ) : (
            <div style={{ width: 76, height: 76, borderRadius: "50%", background: "linear-gradient(135deg, #92400e, #f6a623)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, color: "#fff", margin: "0 auto 12px", boxShadow: "0 0 28px rgba(246,166,35,0.3)" }}>
              {req.requester.full_name[0]}
            </div>
          )}
          <h2 style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 800 }}>{req.requester.full_name}</h2>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(238,240,248,0.4)" }}>@{req.requester.username} - ShadowMint</p>
        </div>

        {/* Amount card */}
        <div style={s.amberCard}>
          <div style={{ position: "absolute", top: -25, right: -25, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: "0 0 8px" }}>is requesting</p>
          <h1 style={{ color: "#fde68a", fontSize: 50, fontWeight: 900, margin: "0 0 8px", letterSpacing: "-2px" }}>{fmt(req.amount)}</h1>
          {req.note && (
            <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "8px 16px", display: "inline-block" }}>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 14 }}>{req.note}</p>
            </div>
          )}
        </div>

        {/* Expiry */}
        {timeLeft && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 28 }}>
            <p style={{ margin: 0, color: "rgba(238,240,248,0.4)", fontSize: 13 }}>Expires in <span style={{ color: "#f6a623", fontWeight: 700 }}>{timeLeft}</span></p>
          </div>
        )}

        <button onClick={() => setStep("method")} style={{ width: "100%", padding: "17px", background: "linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)", border: "none", borderRadius: 14, color: "#050c18", fontSize: 17, fontWeight: 800, cursor: "pointer", boxShadow: "0 0 28px rgba(53,242,168,0.35)", marginBottom: 14 }}>
          Pay {fmt(req.amount)}
        </button>

        <p style={{ textAlign: "center", color: "rgba(238,240,248,0.3)", fontSize: 12, margin: "0 0 28px" }}>
          Secured - Your card details are never stored
        </p>

        <div style={{ background: "rgba(53,242,168,0.04)", border: "1px solid rgba(53,242,168,0.12)", borderRadius: 16, padding: "16px 20px", textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600 }}>Send and receive money for free</p>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(238,240,248,0.4)" }}>Join ShadowMint - instant transfers, no fees</p>
          <a href="/signup" style={{ background: "rgba(53,242,168,0.12)", border: "1px solid rgba(53,242,168,0.3)", borderRadius: 8, padding: "8px 20px", color: "#35f2a8", fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "inline-block" }}>Create free account</a>
        </div>
      </div>
    </div>
  );

  // ── Choose method ──────────────────────────────────────
  if (step === "method") return (
    <div style={s.page}>
      <div style={s.inner}>
        <div style={{ paddingTop: 32, marginBottom: 24 }}>
          <button onClick={() => setStep("landing")} style={s.backBtn}>&#x2190;</button>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>How would you like to pay?</h1>
          <p style={{ margin: 0, color: "rgba(238,240,248,0.4)", fontSize: 14 }}>
            Paying <span style={{ color: "#f6a623", fontWeight: 600 }}>{fmt(req.amount)}</span> to {req.requester.full_name}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { key: "card", icon: "&#x1F4B3;", title: "Debit or Credit Card", sub: "Visa, Mastercard - Instant", badge: "Instant", badgeColor: "#35f2a8" },
            { key: "payid", icon: "&#x26A1;", title: "PayID", sub: "Via email or phone number - Instant", badge: "Free", badgeColor: "#60a5fa" },
            { key: "bank", icon: "&#x1F3E6;", title: "Bank Transfer (BSB)", sub: "Direct from your bank account", badge: "Free", badgeColor: "#60a5fa" },
          ].map(opt => (
            <div
              key={opt.key}
              onClick={() => { setMethod(opt.key); setStep("pay"); }}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(53,242,168,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(53,242,168,0.08)", border: "1px solid rgba(53,242,168,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}
                dangerouslySetInnerHTML={{ __html: opt.icon }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{opt.title}</p>
                  <span style={{ background: `${opt.badgeColor}20`, color: opt.badgeColor, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{opt.badge}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(238,240,248,0.45)" }}>{opt.sub}</p>
              </div>
              <span style={{ color: "rgba(238,240,248,0.25)", fontSize: 20 }}>&#x203A;</span>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", color: "rgba(238,240,248,0.25)", fontSize: 12, marginTop: 24 }}>
          All payments are encrypted and secure
        </p>
      </div>
    </div>
  );

  // ── Payment screen ─────────────────────────────────────
  if (step === "pay") return (
    <div style={s.page}>
      <div style={s.inner}>
        <div style={{ paddingTop: 32, marginBottom: 24 }}>
          <button onClick={() => setStep("method")} style={s.backBtn}>&#x2190;</button>
          <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800 }}>
            {method === "card" ? "Pay by Card" : method === "payid" ? "Pay via PayID" : "Bank Transfer"}
          </h1>
          <p style={{ margin: 0, color: "rgba(238,240,248,0.4)", fontSize: 13 }}>
            Paying <span style={{ color: "#f6a623", fontWeight: 700 }}>{fmt(req.amount)}</span> to {req.requester.full_name}
          </p>
        </div>

        {/* Card */}
        {method === "card" && <CardForm amount={req.amount} onSuccess={() => setStep("success")} />}

        {/* PayID */}
        {method === "payid" && (
          <div>
            <div style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 14, padding: "14px 16px", marginBottom: 20 }}>
              <p style={{ margin: 0, color: "rgba(238,240,248,0.5)", fontSize: 13, lineHeight: 1.6 }}>
                Open your banking app and send to this PayID. Funds arrive <strong style={{ color: "#eef0f8" }}>instantly</strong>, 24/7.
              </p>
            </div>

            <div style={{ ...s.card, marginBottom: 16 }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(238,240,248,0.35)" }}>PayID (Email)</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#35f2a8", fontFamily: "DM Mono, monospace" }}>{req.payid}</span>
                  <CopyBtn text={req.payid} />
                </div>
              </div>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(238,240,248,0.35)" }}>Amount</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{fmt(req.amount)}</span>
                  <CopyBtn text={String(req.amount / 100)} />
                </div>
              </div>
              <div style={{ padding: "16px 18px" }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(238,240,248,0.35)" }}>Reference</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "DM Mono, monospace", color: "#f6a623" }}>{req.id}</span>
                  <CopyBtn text={req.id} />
                </div>
              </div>
            </div>

            <div style={{ ...s.card, padding: "24px", textAlign: "center", marginBottom: 20 }}>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(238,240,248,0.4)" }}>Or scan with your banking app</p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <QRCode value={`payid:${req.payid}?amount=${req.amount / 100}&ref=${req.id}`} size={180} />
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 12, color: "rgba(238,240,248,0.3)" }}>Point your camera at the QR code</p>
            </div>

            <button onClick={() => setStep("success")} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)", color: "#050c18", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 0 24px rgba(53,242,168,0.3)" }}>
              I've completed the transfer
            </button>
          </div>
        )}

        {/* Bank Transfer */}
        {method === "bank" && (
          <div>
            <div style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 14, padding: "14px 16px", marginBottom: 20 }}>
              <p style={{ margin: 0, color: "rgba(238,240,248,0.5)", fontSize: 13, lineHeight: 1.6 }}>
                Use these details in your banking app. Include the <strong style={{ color: "#f6a623" }}>reference number</strong> so the payment is matched correctly.
              </p>
            </div>

            <div style={{ ...s.card, marginBottom: 16 }}>
              <Row label="Account Name" value={req.requester.full_name} />
              <Row label="BSB" value={req.bsb} mono />
              <Row label="Account Number" value={req.account_number} mono />
              <Row label="Amount" value={fmt(req.amount)} />
              <div style={{ padding: "13px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 13, color: "rgba(238,240,248,0.45)" }}>Reference</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, fontFamily: "DM Mono, monospace", color: "#f6a623" }}>{req.id}</p>
                  </div>
                  <CopyBtn text={req.id} label="Copy ref" />
                </div>
              </div>
            </div>

            <div style={{ ...s.card, padding: "24px", textAlign: "center", marginBottom: 16 }}>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(238,240,248,0.4)" }}>Scan with your banking app</p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <QRCode value={`bpay:bsb=${req.bsb}&acc=${req.account_number}&amount=${req.amount / 100}&ref=${req.id}`} size={180} />
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 12, color: "rgba(238,240,248,0.3)" }}>Most Australian banking apps support QR payments</p>
            </div>

            <button onClick={copyAll} style={{ width: "100%", padding: "13px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: allCopied ? "#35f2a8" : "rgba(238,240,248,0.6)", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>
              {allCopied ? "All details copied!" : "Copy all details"}
            </button>

            <button onClick={() => setStep("success")} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)", color: "#050c18", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 0 24px rgba(53,242,168,0.3)" }}>
              I've completed the transfer
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return null;
}
