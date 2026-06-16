import { useState } from "react";
import Navbar from "../../components/navbar/Navbar";
import LoginModal from "../../components/auth/LoginModal";
import SignupModal from "../../components/auth/SignupModal";

// ── small reusable bits ──────────────────────────────────────────────
function SectionEyebrow({ children }) {
  return (
    <p className="text-xs font-bold tracking-widest uppercase text-blue-600 mb-3">
      {children}
    </p>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 leading-tight mb-4"
      style={{ fontFamily: "'Syne', sans-serif" }}>
      {children}
    </h2>
  );
}

function SectionSub({ children }) {
  return <p className="text-base text-gray-500 leading-relaxed max-w-xl">{children}</p>;
}

// ── HERO FINANCE CARD ────────────────────────────────────────────────
function HeroCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
      <div className="bg-gray-900 px-5 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-white">Mumbai T20 Open 2025 — Finance</span>
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white/20" />
          <span className="w-2 h-2 rounded-full bg-white/20" />
          <span className="w-2 h-2 rounded-full bg-white/20" />
        </div>
      </div>
      <div className="p-5">
        {[
          { label: "Entry fees collected", val: "₹32,000", color: "text-emerald-600" },
          { label: "Sponsorship received", val: "₹17,000", color: "text-emerald-600" },
          { label: "Total expenses", val: "−₹28,900", color: "text-orange-500" },
          { label: "Net surplus", val: "₹20,100", color: "text-blue-600" },
        ].map((r) => (
          <div key={r.label} className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
            <span className="text-xs text-gray-500">{r.label}</span>
            <span className={`text-sm font-bold ${r.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{r.val}</span>
          </div>
        ))}

        {/* Prize pool bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Prize pool (60%)</span>
            <span className="font-semibold text-gray-700">₹19,200</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-[62%] bg-blue-600 rounded-full" />
          </div>
        </div>

        {/* Teams badge */}
        <div className="mt-3 flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
          <span className="text-xs text-gray-500">Teams registered · 14 / 16</span>
          <span className="text-xs font-semibold text-white bg-emerald-600 rounded-full px-3 py-0.5">2 slots left</span>
        </div>
      </div>
    </div>
  );
}

// ── ROLES ────────────────────────────────────────────────────────────
const roles = [
  {
    icon: "🏆", name: "Organiser", tagline: "Runs the entire tournament", bg: "bg-purple-50",
    perks: ["Creates tournament with full wizard", "Views live financial dashboard", "Approves teams, manages brackets", "Sends broadcast messages to all", "Generates 5 post-tournament PDFs"],
  },
  {
    icon: "🧢", name: "Team Captain", tagline: "Registers and tracks their team", bg: "bg-blue-50",
    perks: ["Registers team + player roster", "Pays entry fee via Razorpay", "Sees live prize pool update", "Gets SMS for match timings", "Views team stats and results"],
  },
  {
    icon: "💼", name: "Sponsor", tagline: "Local business investing in sport", bg: "bg-amber-50",
    perks: ["Browses Platinum / Gold / Silver / Bronze tiers", "Pays sponsorship amount online", "Gets Sponsor Certificate with logo", "Receives post-tournament Impact Report", "Logo on public tournament page"],
  },
  {
    icon: "👁️", name: "Public / Spectator", tagline: "Anyone with the link", bg: "bg-gray-50",
    perks: ["No login required", "Live scores and bracket", "See prize pool amount", "Share individual match results", "Sponsor logos displayed prominently"],
  },
];

function RolesSection() {
  return (
    <section id="roles" className="bg-white border-y border-gray-200 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionEyebrow>Who it's for</SectionEyebrow>
        <SectionTitle>Four roles. One platform.</SectionTitle>
        <SectionSub>Every stakeholder gets their own tailored experience — no one sees more than they need to.</SectionSub>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200 rounded-2xl overflow-hidden mt-12">
          {roles.map((r) => (
            <div key={r.name} className="bg-white p-7 hover:bg-gray-50 transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4 ${r.bg}`}>
                {r.icon}
              </div>
              <h3 className="font-black text-base mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{r.name}</h3>
              <p className="text-xs text-gray-400 font-medium mb-4">{r.tagline}</p>
              <ul className="flex flex-col gap-2">
                {r.perks.map((p) => (
                  <li key={p} className="flex gap-2 items-start text-xs text-gray-500">
                    <span className="text-blue-600 font-bold mt-0.5 flex-shrink-0">→</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FEATURES ─────────────────────────────────────────────────────────
const features = [
  { num: "01", title: "Tournament creation", desc: "Setup wizard with sport, format, venue, dates, entry fee, prize structure, and sponsorship tiers. Generates a unique 6-character tournament code instantly.", tag: "Organiser" },
  { num: "02", title: "Team registration + payments", desc: "Captains register with player rosters and pay via Razorpay (UPI / card / netbanking). Waitlist kicks in if registrations exceed max teams.", tag: "Captain" },
  { num: "03", title: "Auto bracket generator", desc: "Knockout, league, or combined formats. Match fixtures auto-generated with date, time, and ground slots. Drag-and-drop adjustment for the organiser.", tag: "Core", featured: true },
  { num: "04", title: "Live scoring", desc: "Ball-by-ball or over-by-over scoring from any phone. Player stats tracked cumulatively — runs, wickets, catches, goals, assists — adapts per sport.", tag: "Real-time" },
  { num: "05 + 06", title: "Finance dashboard", desc: "Live revenue, expenses, prize pool, and surplus — all updating the moment a team pays or an expense is logged. 8-category expense tracker with receipt upload.", tag: "Finance core" },
  { num: "07", title: "Sponsorship management", desc: "Platinum, Gold, Silver, Bronze tiers with estimated reach metrics. Auto-generated Sponsor Package PDF and post-tournament Impact Report.", tag: "Sponsor" },
  { num: "08", title: "Communications hub", desc: "Broadcast SMS and WhatsApp to all captains, specific teams, or all players. Pre-built templates for match reminders, prize ceremony alerts, and more.", tag: "Automated" },
  { num: "09", title: "Post-tournament reports", desc: "Five PDFs auto-generated on tournament close — Financial Summary, Tournament Report, Player Stats, Sponsor Impact, and Team Performance Cards.", tag: "PDF · Auto" },
  { num: "", title: "Live public tournament page", desc: "Shareable link with full bracket, live scores, prize pool, and sponsor logos. No login for spectators. Sponsors get the visibility they paid for.", tag: "Public", plain: true },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionEyebrow>9 Modules</SectionEyebrow>
        <SectionTitle>Every organiser pain point, solved.</SectionTitle>
        <SectionSub>From the first team registering to the final prize payout — everything in one place.</SectionSub>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
          {features.map((f) => (
            <div
              key={f.title}
              className={`rounded-xl p-7 border transition-all duration-200 hover:-translate-y-1
                ${f.featured ? "bg-gray-900 border-gray-900 text-white" : f.plain ? "bg-gray-50 border-transparent" : "bg-white border-gray-200 hover:shadow-md"}`}
            >
              {f.num && (
                <p className={`text-xs font-bold tracking-widest uppercase mb-3 ${f.featured ? "text-white/40" : "text-gray-300"}`}>
                  Module {f.num}
                </p>
              )}
              <h3 className={`font-black text-lg mb-2 leading-snug tracking-tight ${f.featured ? "text-white" : "text-gray-900"}`}
                style={{ fontFamily: "'Syne', sans-serif" }}>
                {f.title}
              </h3>
              <p className={`text-sm leading-relaxed mb-4 ${f.featured ? "text-white/60" : "text-gray-500"}`}>
                {f.desc}
              </p>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full
                ${f.featured ? "bg-white/15 text-white/80" : "bg-gray-100 text-gray-400"}`}>
                {f.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FINANCE ──────────────────────────────────────────────────────────
function FinanceSection() {
  return (
    <section id="finance" className="bg-gray-900 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-bold tracking-widest uppercase text-blue-400 mb-3">Finance engine</p>
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-tight mb-4"
          style={{ fontFamily: "'Syne', sans-serif" }}>
          Every rupee tracked.<br />Automatically.
        </h2>
        <p className="text-base text-white/50 leading-relaxed max-w-xl mb-12">
          The financial dashboard updates live — no spreadsheets, no manual calculation. Prize pool recalculates the moment a new team pays.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-7">
            {[
              { icon: "💰", title: "Real-time revenue tracking", desc: "Entry fees, sponsorships, late fees, and cash payments all flow into one live income statement. Every payment updates the dashboard instantly." },
              { icon: "📊", title: "Auto-calculated prize pool", desc: "Prize pool = (Entry Revenue × Prize %) + Sponsor contribution. Recalculates with every registration. Team captains see the live amount." },
              { icon: "🧾", title: "8-category expense tracker", desc: "Venue, Officials, Equipment, Marketing, Hospitality, Awards, Transport, Miscellaneous. Log expenses with receipt photo. Pie chart updates live." },
              { icon: "⚠️", title: "Deficit alert system", desc: "If projected expenses exceed total revenue, an alert fires before you're in the red. Budget guardrails built in from day one." },
            ].map((p) => (
              <div key={p.title} className="flex gap-4">
                <div className="w-9 h-9 flex-shrink-0 bg-white/8 rounded-lg flex items-center justify-center text-base">{p.icon}</div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">{p.title}</h4>
                  <p className="text-sm text-white/50 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-5">Income statement · Live</p>
            {[
              { label: "Entry fees (16 × ₹2,000)", val: "+₹32,000", color: "text-emerald-400" },
              { label: "Sponsorship (1P + 1G + 2S)", val: "+₹17,000", color: "text-emerald-400" },
              { label: "Total income", val: "₹49,000", color: "text-emerald-400" },
            ].map((r) => (
              <div key={r.label} className="flex justify-between py-2.5 border-b border-white/8">
                <span className="text-xs text-white/50">{r.label}</span>
                <span className={`text-sm font-bold ${r.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{r.val}</span>
              </div>
            ))}
            <div className="h-px bg-white/15 my-1" />
            {[
              { label: "Venue rent", val: "−₹8,000", color: "text-red-400" },
              { label: "Umpire fees", val: "−₹6,000", color: "text-red-400" },
              { label: "Equipment + printing", val: "−₹5,800", color: "text-red-400" },
              { label: "Trophies + refreshments", val: "−₹9,100", color: "text-red-400" },
              { label: "Total expenses", val: "−₹28,900", color: "text-red-400" },
            ].map((r) => (
              <div key={r.label} className="flex justify-between py-2.5 border-b border-white/8">
                <span className="text-xs text-white/50">{r.label}</span>
                <span className={`text-sm font-bold ${r.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{r.val}</span>
              </div>
            ))}
            <div className="h-px bg-white/15 my-1" />
            <div className="flex justify-between py-2.5 border-b border-white/8">
              <span className="text-xs text-white/50">Prize pool (60%)</span>
              <span className="text-sm font-bold text-yellow-400" style={{ fontFamily: "'Syne', sans-serif" }}>₹24,200</span>
            </div>
            <div className="mt-4 flex justify-between items-center bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3">
              <span className="text-sm text-white/70">Net surplus</span>
              <span className="text-lg font-black text-emerald-400" style={{ fontFamily: "'Syne', sans-serif" }}>+₹20,100</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── SPORTS ───────────────────────────────────────────────────────────
const sports = [
  { icon: "🏏", name: "Cricket" },
  { icon: "⚽", name: "Football" },
  { icon: "🏸", name: "Badminton" },
  { icon: "🤼", name: "Kabaddi" },
  { icon: "🏀", name: "Basketball" },
  { icon: "🏐", name: "Volleyball" },
];

function SportsSection() {
  return (
    <section id="sports" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionEyebrow>Multi-sport</SectionEyebrow>
        <SectionTitle>One platform. Every sport.</SectionTitle>
        <SectionSub>Player stats adapt to the sport. Cricket tracks runs and wickets. Football tracks goals and assists. The finance engine stays the same across all of them.</SectionSub>

        <div className="flex flex-wrap gap-3 mt-10">
          {sports.map((s) => (
            <div key={s.name} className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-default">
              <span className="text-lg">{s.icon}</span> {s.name}
            </div>
          ))}
        </div>

        <div className="mt-8">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-3">Tournament formats supported</p>
          <div className="flex flex-wrap gap-2">
            {["Knockout", "Round Robin (League)", "League + Knockout", "Group Stage + Finals"].map((f) => (
              <span key={f} className="px-4 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-sm text-gray-500">{f}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── ML ───────────────────────────────────────────────────────────────
const mlModels = [
  {
    badge: "XGBoost Regressor", badgeColor: "bg-blue-100 text-blue-700",
    title: "Optimal entry fee predictor",
    desc: "Tell us your sport, city tier, venue cost, and expected teams. We predict the entry fee that maximises registrations without running a deficit.",
    chips: ["sport_type", "city_tier", "venue_cost", "max_teams", "has_sponsor"],
  },
  {
    badge: "XGBoost Classifier", badgeColor: "bg-emerald-100 text-emerald-700",
    title: "Registration volume forecaster",
    desc: "After 3 days of registration opening, predicts whether you'll hit target, fall short, or get oversubscribed — before it's too late to act.",
    chips: ["day1_registrations", "day3_registrations", "prize_pool", "deadline_days"],
  },
  {
    badge: "XGBoost Regressor", badgeColor: "bg-amber-100 text-amber-700",
    title: "Sponsor ROI estimator",
    desc: "Converts your tournament profile into an estimated audience reach and cost-per-person metric — gives sponsors a data-backed reason to say yes.",
    chips: ["num_teams", "num_matches", "venue_capacity", "sponsorship_tier"],
  },
];

function MLSection() {
  return (
    <section id="ml" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionEyebrow>AI / ML layer</SectionEyebrow>
        <SectionTitle>Data-backed decisions.<br />Not guesswork.</SectionTitle>
        <SectionSub>Three XGBoost models trained on 50,000 synthetic tournament records give organisers and sponsors an edge before the first match is played.</SectionSub>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
          {mlModels.map((m) => (
            <div key={m.title} className="bg-white border border-gray-200 rounded-xl p-7 hover:-translate-y-1 transition-all duration-200 hover:shadow-md">
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${m.badgeColor}`}>{m.badge}</span>
              <h3 className="font-black text-lg mt-4 mb-2 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>{m.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">{m.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {m.chips.map((c) => (
                  <span key={c} className="text-xs bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-gray-400">{c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── SPONSORS ─────────────────────────────────────────────────────────
const tiers = [
  {
    name: "Platinum", price: "₹50,000", sub: "Ultimate visibility",
    border: "border-purple-400", bg: "bg-purple-50",
    badgeBg: "bg-purple-500", badgeText: "text-white",
    perks: ["Logo on all match banners", "Hero placement on public page", "Logo in every match result share", "Social media mention commitment", "Post-tournament Impact Report PDF", "Sponsor Certificate with logo proof", "Exclusive naming rights to one match"],
  },
  {
    name: "Gold", price: "₹25,000", sub: "Maximum visibility",
    border: "border-yellow-400", bg: "bg-yellow-50",
    badgeBg: "bg-yellow-400", badgeText: "text-white",
    perks: ["Logo on all match banners", "Hero placement on public page", "Logo in every match result share", "Social media mention commitment", "Post-tournament Impact Report PDF", "Sponsor Certificate with logo proof"],
  },
  {
    name: "Silver", price: "₹15,000", sub: "Strong placement",
    border: "border-gray-300", bg: "bg-gray-50",
    badgeBg: "bg-gray-400", badgeText: "text-white",
    perks: ["Logo on public tournament page", "Mentioned in closing ceremony", "Logo in select match shares", "Post-tournament Impact Report PDF", "Sponsor Certificate with logo proof"],
  },
  {
    name: "Bronze", price: "₹7,000", sub: "Entry-level exposure",
    border: "border-orange-300", bg: "bg-orange-50",
    badgeBg: "bg-orange-400", badgeText: "text-white",
    perks: ["Name mention in final ceremony", "Listed on public tournament page", "Post-tournament Impact Report PDF", "Sponsor Certificate"],
  },
];

function SponsorsSection() {
  return (
    <section id="sponsors" className="bg-white border-y border-gray-200 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionEyebrow>Sponsorship tiers</SectionEyebrow>
        <SectionTitle>Give sponsors real ROI data.</SectionTitle>
        <SectionSub>Every tier includes a Sponsor Certificate on payment and an auto-generated Impact Report after the tournament closes.</SectionSub>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {tiers.map((t) => (
            <div key={t.name} className={`rounded-2xl border-2 p-7 ${t.border} ${t.bg}`}>
              <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${t.badgeBg} ${t.badgeText}`}>{t.name}</span>
              <div className="mt-4 mb-1 text-3xl font-black tracking-tighter text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>{t.price}</div>
              <p className="text-xs text-gray-400 mb-6">{t.sub}</p>
              <ul className="flex flex-col gap-3">
                {t.perks.map((p) => (
                  <li key={p} className="flex gap-2 items-start text-sm text-gray-600">
                    <span className="text-emerald-500 font-bold flex-shrink-0">✓</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA ──────────────────────────────────────────────────────────────
function CTASection({ onSignup, onLogin }) {
  return (
    <section className="bg-blue-600 py-24 px-6 text-center">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-tight mb-4"
          style={{ fontFamily: "'Syne', sans-serif" }}>
          Ready to run your<br />first tournament?
        </h2>
        <p className="text-base text-white/70 leading-relaxed mb-10">
          Join organisers who've moved from WhatsApp chaos to a system that tracks every team, every match, and every rupee.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={onSignup}
            className="px-7 py-3.5 rounded-xl bg-white text-blue-600 font-semibold text-base hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            Create your tournament
          </button>
          <button
            onClick={onLogin}
            className="px-7 py-3.5 rounded-xl border-2 border-white/40 text-white font-medium text-base hover:border-white hover:-translate-y-0.5 transition-all"
          >
            Log in to dashboard
          </button>
        </div>
      </div>
    </section>
  );
}

// ── FOOTER ───────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-gray-900 text-white/40 py-12 px-6 text-center">
      <div className="font-black text-lg text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
        Sport<span className="text-blue-500">folio</span>
      </div>
      <p className="text-sm mb-6">Sports meets Finance. Every tournament, fully managed.</p>
      <div className="flex gap-6 justify-center flex-wrap text-sm mb-8">
        {["Features", "Finance engine", "ML models", "Sponsors", "Privacy", "Terms"].map((l) => (
          <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
        ))}
      </div>
      <p className="text-xs">© 2025 Sportfolio. Built for local sport.</p>
    </footer>
  );
}

// ── HERO ─────────────────────────────────────────────────────────────
function Hero({ onSignup }) {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <div>
        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Sports meets Finance</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none mb-5"
          style={{ fontFamily: "'Syne', sans-serif" }}>
          Run tournaments.<br />
          <span className="text-blue-600">Track every</span><br />
          <span className="text-orange-500">rupee.</span>
        </h1>

        <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-md">
          Sportfolio is the complete platform for local tournament organisers — from registration and brackets to live scoring, sponsorships, and auto-generated financial reports.
        </p>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={onSignup}
            className="px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-200 transition-all"
          >
            Create tournament
          </button>
          <a href="#features"
            className="px-6 py-3.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium text-base hover:border-gray-400 hover:-translate-y-0.5 transition-all"
          >
            See how it works
          </a>
        </div>

        {/* Stats row */}
        <div className="flex gap-8 mt-10 pt-8 border-t border-gray-200">
          {[
            { num: "4", label: "User roles" },
            { num: "9", label: "Feature modules" },
            { num: "3", label: "ML models" },
            { num: "₹0", label: "Hidden fees" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>{s.num}</div>
              <div className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hero card */}
      <div className="hidden lg:block">
        <HeroCard />
      </div>
    </section>
  );
}

// ── PAGE ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div className="bg-[#f7f6f2] min-h-screen">
      <Navbar
        onLogin={() => setShowLogin(true)}
        onSignup={() => setShowSignup(true)}
      />
      <Hero onSignup={() => setShowSignup(true)} />
      <div className="border-t border-gray-200" />
      <RolesSection />
      <FeaturesSection />
      <FinanceSection />
      <SportsSection />
      <div className="border-t border-gray-200" />
      <MLSection />
      <SponsorsSection />
      <CTASection
        onSignup={() => setShowSignup(true)}
        onLogin={() => setShowLogin(true)}
      />
      <Footer />

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSwitchToSignup={() => { setShowLogin(false); setShowSignup(true); }}
        />
      )}
      {showSignup && (
        <SignupModal
          onClose={() => setShowSignup(false)}
          onSwitchToLogin={() => { setShowSignup(false); setShowLogin(true); }}
        />
      )}
    </div>
  );
}