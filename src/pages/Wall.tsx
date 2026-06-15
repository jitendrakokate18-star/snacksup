import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListMixes,
  useToggleLike,
  useToggleReaction,
  getListMixesQueryKey,
  type Mix,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSessionManager } from "@/hooks/use-session-manager";
import { Button } from "@/components/ui/button";
import { calculateChaosScore, getChaosLabel } from "@/lib/chaos";

const REACTION_EMOJIS = ["🔥", "😱", "🤢", "🤩"];

type SortBy = "newest" | "mostLiked";
type FilterType = "all" | "bag" | "bowl";

type SliderItem = { name: string; amount: number; unit: string };
type Toppings = { cheese: string; butter: boolean; coriander: boolean };

export default function Wall() {
  const [, navigate] = useLocation();
  const { token } = useSessionManager();
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [filterType, setFilterType] = useState<FilterType>("all");

  const queryParams = { limit: 100, offset: 0, sortBy, filterType, sessionToken: token ?? undefined };
  const { data: mixes, isLoading } = useListMixes(queryParams, {
    query: { queryKey: getListMixesQueryKey(queryParams) },
  });
  const toggleLike = useToggleLike();
  const toggleReaction = useToggleReaction();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListMixesQueryKey(queryParams) });

  const handleLike = (mixId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    toggleLike.mutate({ id: mixId, data: { sessionToken: token } }, { onSuccess: invalidate });
  };

  const handleReact = (mixId: number, emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    toggleReaction.mutate({ id: mixId, data: { sessionToken: token, emoji } }, { onSuccess: invalidate });
  };

  const handleRemix = (mix: Mix, e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(
      "snacksup_remix",
      JSON.stringify({
        mainChips: mix.mainChips,
        secondaryItems: mix.secondaryItems,
        spices: mix.spices,
        veggies: mix.veggies,
        sauces: mix.sauces,
        toppings: mix.toppings,
        type: mix.type,
      })
    );
    navigate(`/create/${mix.type}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <button
          onClick={() => navigate("/")}
          className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Back
        </button>
        <span className="text-lg font-black tracking-tight text-primary uppercase">The Wall</span>
        <Button size="sm" onClick={() => navigate("/create/bag")} className="text-xs">
          Mix something
        </Button>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Community Mixes</h1>
          <p className="text-muted-foreground mt-1 text-sm">Everyone's anonymous. Only the mix matters.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {(["newest", "mostLiked"] as SortBy[]).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${
                  sortBy === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "newest" ? "Newest" : "Most Liked"}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {(["all", "bag", "bowl"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${
                  filterType === f ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse h-52" />
            ))}
          </div>
        )}

        {!isLoading && (!mixes || mixes.length === 0) && (
          <div className="text-center py-24">
            <div className="text-6xl font-black text-muted-foreground/20 mb-4">EMPTY</div>
            <p className="text-muted-foreground">No mixes yet. Be the first one.</p>
            <Button className="mt-6" onClick={() => navigate("/create/bag")}>
              Create a mix
            </Button>
          </div>
        )}

        {!isLoading && mixes && mixes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mixes.map((mix) => {
              const chips = mix.mainChips as string[];
              const isMyMix = mix.sessionToken === token;
              const userReactions = (mix.userReactions as string[]) ?? [];
              const reactions = (mix.reactions as Record<string, number>) ?? {};
              const chaosScore = calculateChaosScore({
                mainChips: chips,
                secondaryItems: (mix.secondaryItems as SliderItem[]) ?? [],
                spices: (mix.spices as SliderItem[]) ?? [],
                veggies: (mix.veggies as SliderItem[]) ?? [],
                sauces: (mix.sauces as SliderItem[]) ?? [],
                toppings: (mix.toppings as Toppings) ?? { cheese: "none", butter: false, coriander: false },
              });
              const chaos = getChaosLabel(chaosScore);
              return (
                <div
                  key={mix.id}
                  className="group bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all duration-200 flex flex-col"
                  onClick={() => navigate(`/mix/${mix.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-block text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          mix.type === "bowl"
                            ? "bg-foreground text-background"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {mix.type}
                      </span>
                      {isMyMix && (
                        <span className="text-xs font-bold text-muted-foreground">yours</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(mix.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-xl font-black tracking-tight mb-2 group-hover:text-primary transition-colors">
                    {mix.name}
                  </h3>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {chips.slice(0, 3).map((chip) => (
                      <span key={chip} className="text-xs font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {chip}
                      </span>
                    ))}
                    {chips.length > 3 && (
                      <span className="text-xs font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        +{chips.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="mb-3">
                    <span className="text-xs font-bold" style={{ color: chaos.color }}>
                      {chaos.emoji} {chaos.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mb-3" onClick={(e) => e.stopPropagation()}>
                    {REACTION_EMOJIS.map((emoji) => {
                      const count = reactions[emoji] ?? 0;
                      const hasReacted = userReactions.includes(emoji);
                      return (
                        <button
                          key={emoji}
                          onClick={(e) => handleReact(mix.id, emoji, e)}
                          className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                            hasReacted
                              ? "bg-primary/20 border border-primary/40"
                              : "bg-muted hover:bg-muted/80 border border-transparent"
                          }`}
                        >
                          <span>{emoji}</span>
                          {count > 0 && <span className="text-muted-foreground">{count}</span>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => handleLike(mix.id, e)}
                        className={`flex items-center gap-1.5 text-sm font-bold transition-all ${
                          mix.hasLiked ? "text-primary" : "text-muted-foreground hover:text-primary"
                        }`}
                      >
                        <svg className="w-4 h-4" fill={mix.hasLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {mix.likesCount}
                      </button>
                      {(mix.commentsCount ?? 0) > 0 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          💬 {mix.commentsCount}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleRemix(mix, e)}
                      className="text-xs font-black text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
                    >
                      Remix ↗
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
