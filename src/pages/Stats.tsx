import { useLocation } from "wouter";
import { useSessionManager } from "@/hooks/use-session-manager";
import { Button } from "@/components/ui/button";

export default function Stats() {
  const [, navigate] = useLocation();
  const { session } = useSessionManager();

  // Mock data replacing Replit's @workspace/api-client-react hook
  const isLoading = false;
  const stats = {
    totalMixes: 1420,
    totalLikes: 8432,
    topChip: "Flamin' Hot Cheetos"
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border">
        <button
          onClick={() => navigate("/")}
          className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Back
        </button>
        <span className="text-lg font-black tracking-tight text-primary uppercase">Stats</span>
        <div />
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Community Stats</h1>
        <p className="text-muted-foreground text-sm mb-10">What everyone's been building. Anonymously.</p>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse h-28" />
            ))}
          </div>
        ) : stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="text-4xl font-black text-primary mb-1">{stats.totalMixes}</div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mixes Created</div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="text-4xl font-black text-foreground mb-1">{stats.totalLikes}</div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Likes</div>
              </div>
            </div>

            {stats.topChip && (
              <div className="bg-primary rounded-2xl p-6 text-primary-foreground">
                <div className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">Most Used Chip</div>
                <div className="text-3xl font-black">{stats.topChip}</div>
              </div>
            )}

            {session && (
              <div className="bg-card border-2 border-border rounded-2xl p-6">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Your Stats</p>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-4xl font-black text-foreground">{session.byobCount}</div>
                    <div className="text-sm text-muted-foreground mt-1">BYOBs made</div>
                  </div>
                  <div>
                    {/* Fallback to 0 if credits properties aren't calculated yet */}
                    <div className="text-4xl font-black text-primary">{(session as any).credits || 0}</div>
                    <div className="text-sm text-muted-foreground mt-1">Credits earned</div>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Imported chips</span>
                      <span className={session.byobCount >= 3 ? "text-primary" : "text-muted-foreground"}>
                        {session.byobCount >= 3 ? "Unlocked ✓" : `${session.byobCount}/3 mixes`}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min((session.byobCount / 3) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Extra cheese</span>
                      <span className={session.byobCount >= 6 ? "text-primary" : "text-muted-foreground"}>
                        {session.byobCount >= 6 ? "Unlocked ✓" : `${session.byobCount}/6 mixes`}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min((session.byobCount / 6) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center pt-4">
              <Button onClick={() => navigate("/create/bag")} className="font-black px-10">
                Build a mix
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}