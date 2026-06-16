import { useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useSessionManager } from "@/hooks/use-session-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateChaosScore, getChaosLabel } from "@/lib/chaos";
import html2canvas from "html2canvas";

const REACTION_EMOJIS = ["🔥", "😱", "🤢", "🤩"];

type SliderItem = { name: string; amount: number; unit: string };
type Toppings = { cheese: string; butter: boolean; coriander: boolean };

interface Comment {
  id: number;
  content: string;
  createdAt: string;
}

function ShareCard({
  mix,
  chaosScore,
}: {
  mix: {
    id: number;
    name: string;
    type: string;
    mainChips: string[];
    secondaryItems: SliderItem[];
    spices: SliderItem[];
    veggies: SliderItem[];
    sauces: SliderItem[];
    toppings: Toppings;
    createdAt: string;
  };
  chaosScore: number;
}) {
  const chaos = getChaosLabel(chaosScore);
  const allIngredients = [
    ...mix.mainChips,
    ...mix.secondaryItems.filter((i) => i.amount > 0).map((i) => i.name),
    ...mix.spices.filter((i) => i.amount > 0).map((i) => i.name),
    ...mix.veggies.filter((i) => i.amount > 0).map((i) => i.name),
    ...mix.sauces.filter((i) => i.amount > 0).map((i) => i.name),
  ];

  return (
    <div
      style={{
        width: 360,
        background: "#0a0a0a",
        color: "#f0f0f0",
        fontFamily: "monospace",
        padding: "24px 20px",
        borderRadius: 0,
        position: "relative",
      }}
    >
      <div style={{ textAlign: "center", borderBottom: "1px dashed #333", paddingBottom: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 10, letterSpacing: 6, color: "#555", marginBottom: 4 }}>SNACKSUP</div>
        <div style={{ fontSize: 10, color: "#444" }}>BYOB RECEIPT</div>
      </div>

      <div style={{ borderBottom: "1px dashed #333", paddingBottom: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "#555", marginBottom: 4 }}>ORDER TYPE</div>
        <div style={{ fontSize: 13, fontWeight: "bold", letterSpacing: 2 }}>{mix.type.toUpperCase()}</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "#555", marginBottom: 6 }}>MIX NAME</div>
        <div
          style={{
            fontSize: 22,
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: 1,
            lineHeight: 1.2,
            color: "#fff",
          }}
        >
          {mix.name}
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #333", paddingTop: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "#555", marginBottom: 8 }}>INGREDIENTS</div>
        {allIngredients.map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4, color: "#ccc" }}>
            <span>· {item}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: "1px dashed #333",
          borderBottom: "1px dashed #333",
          padding: "10px 0",
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 10, color: "#555", marginBottom: 4 }}>CHAOS RATING</div>
        <div style={{ fontSize: 20, fontWeight: "bold", color: chaos.color }}>
          {chaos.emoji} {chaos.label.toUpperCase()}
        </div>
        <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{chaosScore}/100</div>
      </div>

      <div style={{ textAlign: "center", fontSize: 9, color: "#333", lineHeight: 1.6 }}>
        <div>#{mix.id} · {new Date(mix.createdAt).toLocaleDateString("en-IN")}</div>
        <div style={{ marginTop: 2, letterSpacing: 2 }}>SNACKSUP.VERCEL.APP</div>
        <div style={{ marginTop: 4 }}>★ ★ ★</div>
      </div>
    </div>
  );
}

export default function MixDetail() {
  const [matched, params] = useRoute("/mix/:id");
  const [, navigate] = useLocation();
  const { token } = useSessionManager();
  const cardRef = useRef<HTMLDivElement>(null);
  const [showShare, setShowShare] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [downloading, setDownloading] = useState(false);

  const id = matched && params?.id ? parseInt(params.id, 10) : 1;

  // Mock static layout context replacing Replit database calls
  const [mix, setMix] = useState(() => ({
    id: id,
    name: "The Midnight Hypercrunch",
    type: "bag",
    mainChips: ["Flamin' Hot Cheetos", "Doritos Nacho Cheese"],
    secondaryItems: [{ name: "Roasted Peanuts", amount: 20, unit: "g" }],
    spices: [{ name: "Chili Powder", amount: 2, unit: "pinch" }],
    veggies: [],
    sauces: [],
    toppings: { cheese: "none", butter: false, coriander: false },
    createdAt: new Date().toISOString(),
    likesCount: 24,
    hasLiked: false,
    reactions: { "🔥": 12, "😱": 4 } as Record<string, number>,
    userReactions: [] as string[]
  }));

  const [comments, setComments] = useState<Comment[]>([
    { id: 1, content: "This combo goes crazy absolute legendary level stuff.", createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, content: "My stomach hurts just reading this. 10/10.", createdAt: new Date(Date.now() - 1800000).toISOString() }
  ]);

  const isLoading = false;

  const handleLike = () => {
    if (!token || !mix) return;
    setMix(prev => {
      const updatedHasLiked = !prev.hasLiked;
      return {
        ...prev,
        hasLiked: updatedHasLiked,
        likesCount: updatedHasLiked ? prev.likesCount + 1 : prev.likesCount - 1
      };
    });
  };

  const handleReact = (emoji: string) => {
    if (!token || !mix) return;
    setMix(prev => {
      const currentReactions = { ...prev.reactions };
      let updatedUserReactions = [...prev.userReactions];

      if (updatedUserReactions.includes(emoji)) {
        updatedUserReactions = updatedUserReactions.filter(r => r !== emoji);
        currentReactions[emoji] = Math.max(0, (currentReactions[emoji] ?? 1) - 1);
      } else {
        updatedUserReactions.push(emoji);
        currentReactions[emoji] = (currentReactions[emoji] ?? 0) + 1;
      }

      return {
        ...prev,
        userReactions: updatedUserReactions,
        reactions: currentReactions
      };
    });
  };

  const handleAddComment = () => {
    if (!commentText.trim() || commentText.length > 100) return;
    const newComment: Comment = {
      id: comments.length + 1,
      content: commentText.trim(),
      createdAt: new Date().toISOString()
    };
    setComments([newComment, ...comments]);
    setCommentText("");
  };

  const handleRemix = () => {
    if (!mix) return;
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

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0a0a",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `${mix?.name ?? "mix"}-snacksup.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!mix) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Mix not found.</p>
        <Button onClick={() => navigate("/wall")}>Back to wall</Button>
      </div>
    );
  }

  const mainChips = mix.mainChips as string[];
  const secondaryItems = (mix.secondaryItems as SliderItem[]) ?? [];
  const spices = (mix.spices as SliderItem[]) ?? [];
  const veggies = (mix.veggies as SliderItem[]) ?? [];
  const sauces = (mix.sauces as SliderItem[]) ?? [];
  const toppings = (mix.toppings as Toppings) ?? { cheese: "none", butter: false, coriander: false };
  const userReactions = mix.userReactions ?? [];
  const reactions = mix.reactions ?? {};

  const chaosScore = calculateChaosScore({ mainChips, secondaryItems, spices, veggies, sauces, toppings });
  const chaos = getChaosLabel(chaosScore);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border">
        <button
          onClick={() => navigate("/wall")}
          className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to wall
        </button>
        <span className="text-sm font-black text-primary uppercase">SnacksUp</span>
        <div />
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="bg-card border-2 border-border rounded-3xl overflow-hidden shadow-xl">
          <div className="bg-primary px-8 py-10 text-primary-foreground">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-black uppercase tracking-widest bg-primary-foreground/20 rounded-full px-3 py-1">
                {mix.type === "bowl" ? "BOWL" : "BAG"}
              </span>
              <span className="text-xs opacity-70">by Anonymous</span>
              <span className="text-xs opacity-50 ml-auto">
                {new Date(mix.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight uppercase">{mix.name}</h1>
            <div className="mt-3 inline-block text-sm font-bold opacity-90" style={{ color: chaos.color }}>
              {chaos.emoji} {chaos.label} · Chaos {chaosScore}/100
            </div>
          </div>

          <div className="px-8 py-6 space-y-5">
            <section>
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Main Chips</h2>
              <div className="flex flex-wrap gap-2">
                {mainChips.map((chip) => (
                  <span key={chip} className="bg-primary/10 text-primary font-bold text-sm px-3 py-1 rounded-full">{chip}</span>
                ))}
              </div>
            </section>

            {secondaryItems.filter((i) => i.amount > 0).length > 0 && (
              <section>
                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Secondary Items</h2>
                <div className="grid grid-cols-2 gap-2">
                  {secondaryItems.filter((i) => i.amount > 0).map((item) => (
                    <div key={item.name} className="flex items-center justify-between bg-muted rounded-xl px-3 py-2">
                      <span className="text-sm font-semibold">{item.name}</span>
                      <span className="text-sm font-black text-primary">{item.amount} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {veggies.filter((i) => i.amount > 0).length > 0 && (
              <section>
                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Vegetables</h2>
                <div className="grid grid-cols-2 gap-2">
                  {veggies.filter((i) => i.amount > 0).map((item) => (
                    <div key={item.name} className="flex items-center justify-between bg-muted rounded-xl px-3 py-2">
                      <span className="text-sm font-semibold">{item.name}</span>
                      <span className="text-sm font-black text-primary">{item.amount}{item.unit}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {spices.filter((i) => i.amount > 0).length > 0 && (
              <section>
                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Spices</h2>
                <div className="grid grid-cols-2 gap-2">
                  {spices.filter((i) => i.amount > 0).map((item) => (
                    <div key={item.name} className="flex items-center justify-between bg-muted rounded-xl px-3 py-2">
                      <span className="text-sm font-semibold">{item.name}</span>
                      <span className="text-sm font-black text-primary">{item.amount} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {sauces.filter((i) => i.amount > 0).length > 0 && (
              <section>
                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Sauces & Chutneys</h2>
                <div className="grid grid-cols-2 gap-2">
                  {sauces.filter((i) => i.amount > 0).map((item) => (
                    <div key={item.name} className="flex items-center justify-between bg-muted rounded-xl px-3 py-2">
                      <span className="text-sm font-semibold">{item.name}</span>
                      <span className="text-sm font-black text-primary">{item.amount} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(toppings.cheese !== "none" || toppings.butter || toppings.coriander) && (
              <section>
                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Toppings</h2>
                <div className="flex flex-wrap gap-2">
                  {toppings.cheese !== "none" && (
                    <span className="bg-accent/30 text-foreground font-bold text-sm px-3 py-1 rounded-full capitalize">
                      {toppings.cheese.replace("_", " ")} Cheese
                    </span>
                  )}
                  {toppings.butter && <span className="bg-accent/30 text-foreground font-bold text-sm px-3 py-1 rounded-full">Butter</span>}
                  {toppings.coriander && <span className="bg-accent/30 text-foreground font-bold text-sm px-3 py-1 rounded-full">Coriander</span>}
                </div>
              </section>
            )}
          </div>

          <div className="px-8 pb-6 pt-2 border-t border-border space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {REACTION_EMOJIS.map((emoji) => {
                const count = reactions[emoji] ?? 0;
                const hasReacted = userReactions.includes(emoji);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleReact(emoji)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                      hasReacted
                        ? "bg-primary/20 border border-primary/50 scale-105"
                        : "bg-muted hover:bg-muted/80 border border-transparent"
                    }`}
                  >
                    <span>{emoji}</span>
                    {count > 0 && <span className="text-xs text-muted-foreground">{count}</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLike}
                className={`flex items-center gap-2 text-lg font-black transition-all ${
                  mix.hasLiked ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
              >
                <svg className="w-6 h-6" fill={mix.hasLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {mix.likesCount} {mix.likesCount === 1 ? "like" : "likes"}
              </button>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRemix}>
                  Remix ↗
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowShare((s) => !s)}>
                  Share 🖼️
                </Button>
              </div>
            </div>
          </div>
        </div>

        {showShare && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black uppercase text-sm">Your Receipt</h3>
              <Button size="sm" onClick={handleDownload} disabled={downloading}>
                {downloading ? "Saving..." : "Download PNG"}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <div ref={cardRef} style={{ display: "inline-block" }}>
                <ShareCard
                  mix={{
                    id: mix.id,
                    name: mix.name,
                    type: mix.type,
                    mainChips: mainChips,
                    secondaryItems,
                    spices,
                    veggies,
                    sauces,
                    toppings,
                    createdAt: mix.createdAt,
                  }}
                  chaosScore={chaosScore}
                />
              </div>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-black uppercase text-sm mb-4">
            Comments {comments && comments.length > 0 ? `(${comments.length})` : ""}
          </h3>

          <div className="flex gap-2 mb-5">
            <Input
              placeholder="Drop a quick thought... (100 chars)"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value.slice(0, 100))}
              className="text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            />
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              className="shrink-0"
            >
              Post
            </Button>
          </div>

          {(!comments || comments.length === 0) && (
            <p className="text-muted-foreground text-sm text-center py-4">No comments yet. Be the first.</p>
          )}

          <div className="space-y-3">
            {comments?.map((c) => (
              <div key={c.id} className="bg-muted/50 rounded-xl px-4 py-3">
                <p className="text-sm text-foreground">{c.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}