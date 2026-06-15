import { useLocation } from "wouter";
import { useSessionManager } from "@/hooks/use-session-manager";

const TAGLINES = [
  "Crafted by chaos. Eaten by legends.",
  "Because boring snacks are a crime.",
  "Every legend has an origin snack.",
  "You're one mix away from greatness.",
  "No recipe. No rules. Just vibes.",
];

const tagline = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];

export default function Landing() {
  const [, navigate] = useLocation();
  const { session, isLoading } = useSessionManager();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border">
        <span className="text-lg font-black tracking-tight text-primary uppercase">SnacksUp</span>
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/wall")}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            The Wall
          </button>
          <button
            onClick={() => navigate("/stats")}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Stats
          </button>
          {session && (
            <div className="flex items-center gap-2 bg-accent/20 border border-accent/40 rounded-full px-3 py-1">
              <span className="text-xs font-bold text-foreground/70">Credits</span>
              <span className="text-sm font-black text-primary">{session.credits}</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl w-full">
          <div className="mb-4">
            <span className="inline-block bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
              Build Your Own Bag
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mt-4 mb-8">
            <span className="text-primary">Your Mix.</span>
            <br />
            <span className="text-foreground">Your Rules.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground font-medium mb-12 italic">
            {tagline}
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 mb-12">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12 max-w-lg mx-auto">
              <button
                onClick={() => navigate("/create/bag")}
                className="group relative bg-primary text-primary-foreground rounded-2xl p-8 text-left overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-100"
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <div className="text-4xl mb-3 font-black">BAG</div>
                <div className="text-sm font-semibold opacity-80">1 chip pack</div>
                <div className="text-xs opacity-60 mt-1">Classic single-serve chaos</div>
              </button>

              <button
                onClick={() => navigate("/create/bowl")}
                className="group relative bg-foreground text-background rounded-2xl p-8 text-left overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-100"
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                <div className="text-4xl mb-3 font-black">BOWL</div>
                <div className="text-sm font-semibold opacity-80">Up to 5 chip types</div>
                <div className="text-xs opacity-60 mt-1">For the truly unhinged</div>
              </button>
            </div>
          )}

          {session && session.byobCount < 3 && (
            <p className="text-sm text-muted-foreground">
              {3 - session.byobCount} more {3 - session.byobCount === 1 ? "mix" : "mixes"} to unlock imported chips
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
