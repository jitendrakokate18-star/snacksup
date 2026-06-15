import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

type Overview = { totalMixes: number; totalMessages: number; totalSessions: number; totalLikes: number };
type Mix = {
  id: number; sessionToken: string; name: string; type: string;
  mainChips: string[]; secondaryItems: any[]; spices: any[]; veggies: any[];
  sauces: any[]; toppings: any; likesCount: number; createdAt: string;
};
type Message = { id: number; content: string; createdAt: string };
type Session = { token: string; byobCount: number; credits: number; createdAt: string };

type Tab = "overview" | "mixes" | "messages" | "sessions";

async function apiFetch(path: string, password: string) {
  const res = await fetch(`${API}${path}`, { headers: { "x-admin-password": password } });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(false);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expandedMix, setExpandedMix] = useState<number | null>(null);

  const storedPw = () => sessionStorage.getItem("admin_pw") ?? password;

  const login = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/admin/overview", password);
      setOverview(data);
      sessionStorage.setItem("admin_pw", password);
      setAuthed(true);
      setAuthError(false);
    } catch {
      setAuthError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadTab = async (t: Tab) => {
    setTab(t);
    const pw = storedPw();
    setLoading(true);
    try {
      if (t === "overview") {
        const data = await apiFetch("/admin/overview", pw);
        setOverview(data);
      } else if (t === "mixes") {
        const data = await apiFetch("/admin/mixes", pw);
        setMixes(data);
      } else if (t === "messages") {
        const data = await apiFetch("/admin/messages", pw);
        setMessages(data);
      } else if (t === "sessions") {
        const data = await apiFetch("/admin/sessions", pw);
        setSessions(data);
      }
    } catch {
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const shortToken = (tok: string) => tok.slice(0, 8) + "…";

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <span className="text-xs font-black uppercase tracking-widest text-primary">SnacksUp</span>
            <h1 className="text-3xl font-black mt-2">Owner Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your admin password to continue.</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <Input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setAuthError(false); }}
              onKeyDown={(e) => e.key === "Enter" && login()}
              className={authError ? "border-destructive" : ""}
            />
            {authError && <p className="text-xs text-destructive font-semibold">Wrong password. Try again.</p>}
            <Button className="w-full font-black" onClick={login} disabled={!password || loading}>
              {loading ? "Checking..." : "Enter"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "mixes", label: "All Mixes" },
    { key: "messages", label: "Anonymous Notes" },
    { key: "sessions", label: "Sessions" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-primary">SnacksUp</span>
          <span className="ml-2 text-xs font-bold text-muted-foreground">Owner Dashboard</span>
        </div>
        <button
          onClick={() => { setAuthed(false); sessionStorage.removeItem("admin_pw"); }}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Lock
        </button>
      </header>

      <div className="flex border-b border-border px-6 gap-1 sticky top-0 bg-background/95 backdrop-blur z-10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => loadTab(t.key)}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}

        {!loading && tab === "overview" && overview && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase">Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Mixes", value: overview.totalMixes, color: "text-primary" },
                { label: "Total Likes", value: overview.totalLikes, color: "text-foreground" },
                { label: "Anon Notes", value: overview.totalMessages, color: "text-foreground" },
                { label: "Sessions", value: overview.totalSessions, color: "text-muted-foreground" },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
                  <div className={`text-4xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <button onClick={() => loadTab("mixes")} className="bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/40 transition-colors group">
                <div className="text-lg font-black group-hover:text-primary transition-colors">View All Mixes →</div>
                <div className="text-sm text-muted-foreground mt-1">Names, chips, ingredients, likes</div>
              </button>
              <button onClick={() => loadTab("messages")} className="bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/40 transition-colors group">
                <div className="text-lg font-black group-hover:text-primary transition-colors">Anonymous Notes →</div>
                <div className="text-sm text-muted-foreground mt-1">All messages sent by users</div>
              </button>
              <button onClick={() => loadTab("sessions")} className="bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/40 transition-colors group">
                <div className="text-lg font-black group-hover:text-primary transition-colors">Sessions →</div>
                <div className="text-sm text-muted-foreground mt-1">Anonymous user activity</div>
              </button>
            </div>
          </div>
        )}

        {!loading && tab === "mixes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase">All Mixes</h2>
              <span className="text-sm text-muted-foreground font-semibold">{mixes.length} total</span>
            </div>
            {mixes.length === 0 && <p className="text-muted-foreground py-8 text-center">No mixes yet.</p>}
            {mixes.map((mix) => {
              const isOpen = expandedMix === mix.id;
              return (
                <div key={mix.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <button
                    className="w-full px-5 py-4 text-left flex items-start justify-between gap-4 hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedMix(isOpen ? null : mix.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-full ${mix.type === "bowl" ? "bg-foreground text-background" : "bg-primary text-primary-foreground"}`}>
                          {mix.type}
                        </span>
                        <span className="font-black text-base">{mix.name}</span>
                        <span className="text-xs font-bold text-muted-foreground">❤️ {mix.likesCount}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(mix.mainChips as string[]).map((c) => (
                          <span key={c} className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">{c}</span>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1.5">
                        Session: <code className="font-mono">{shortToken(mix.sessionToken)}</code> · {fmt(mix.createdAt)}
                      </div>
                    </div>
                    <span className="text-muted-foreground text-sm mt-1">{isOpen ? "▲" : "▼"}</span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 border-t border-border space-y-3 text-sm">
                      {(mix.secondaryItems as any[]).filter((i) => i.amount > 0).length > 0 && (
                        <div>
                          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Secondaries: </span>
                          {(mix.secondaryItems as any[]).filter((i) => i.amount > 0).map((i) => `${i.name} (${i.amount} ${i.unit})`).join(", ")}
                        </div>
                      )}
                      {(mix.veggies as any[]).filter((i) => i.amount > 0).length > 0 && (
                        <div>
                          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Veggies: </span>
                          {(mix.veggies as any[]).filter((i) => i.amount > 0).map((i) => `${i.name} (${i.amount}${i.unit})`).join(", ")}
                        </div>
                      )}
                      {(mix.spices as any[]).filter((i) => i.amount > 0).length > 0 && (
                        <div>
                          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Spices: </span>
                          {(mix.spices as any[]).filter((i) => i.amount > 0).map((i) => `${i.name} (${i.amount} ${i.unit})`).join(", ")}
                        </div>
                      )}
                      {(mix.sauces as any[]).filter((i) => i.amount > 0).length > 0 && (
                        <div>
                          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sauces: </span>
                          {(mix.sauces as any[]).filter((i) => i.amount > 0).map((i) => `${i.name} (${i.amount} ${i.unit})`).join(", ")}
                        </div>
                      )}
                      {mix.toppings && (
                        <div>
                          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Toppings: </span>
                          {[
                            mix.toppings.cheese !== "none" && `${mix.toppings.cheese.replace("_", " ")} cheese`,
                            mix.toppings.butter && "butter",
                            mix.toppings.coriander && "coriander",
                          ].filter(Boolean).join(", ") || "none"}
                        </div>
                      )}
                      <div className="font-mono text-xs text-muted-foreground pt-1 break-all">
                        Full session token: {mix.sessionToken}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && tab === "messages" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase">Anonymous Notes</h2>
              <span className="text-sm text-muted-foreground font-semibold">{messages.length} total</span>
            </div>
            {messages.length === 0 && <p className="text-muted-foreground py-8 text-center">No notes yet.</p>}
            {messages.map((msg) => (
              <div key={msg.id} className="bg-card border border-border rounded-2xl px-5 py-4">
                <p className="text-base font-medium leading-relaxed">"{msg.content}"</p>
                <p className="text-xs text-muted-foreground mt-2">#{msg.id} · {fmt(msg.createdAt)}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "sessions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase">Sessions</h2>
              <span className="text-sm text-muted-foreground font-semibold">{sessions.length} users</span>
            </div>
            {sessions.length === 0 && <p className="text-muted-foreground py-8 text-center">No sessions yet.</p>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-black uppercase tracking-widest text-muted-foreground">
                    <th className="pb-3 pr-4">Token</th>
                    <th className="pb-3 pr-4">Mixes</th>
                    <th className="pb-3 pr-4">Credits</th>
                    <th className="pb-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.token} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{shortToken(s.token)}</td>
                      <td className="py-3 pr-4 font-black">{s.byobCount}</td>
                      <td className="py-3 pr-4 font-bold text-primary">{s.credits}</td>
                      <td className="py-3 text-muted-foreground">{fmt(s.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
