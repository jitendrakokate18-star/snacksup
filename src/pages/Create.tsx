import { useState, useEffect, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useSessionManager } from "@/hooks/use-session-manager";
import { REGULAR_CHIPS, IMPORTED_CHIPS, SECONDARY_ITEMS, VEGGIES, SPICES, SAUCES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { calculateChaosScore, getChaosLabel } from "@/lib/chaos";

type SliderItem = { name: string; amount: number; unit: string };
type Toppings = { cheese: "none" | "regular" | "extra" | "double_extra"; butter: boolean; coriander: boolean };

const MIXING_STAGES = [
  { emoji: "🛍️", text: "Opening the bag..." },
  { emoji: "🤜", text: "Crushing with purpose..." },
  { emoji: "🌶️", text: "Adding the spice..." },
  { emoji: "🧅", text: "Throwing in the onions..." },
  { emoji: "💧", text: "Drizzling the sauces..." },
  { emoji: "🧀", text: "Going heavy on cheese..." },
  { emoji: "🫙", text: "Shaking it all up..." },
  { emoji: "✨", text: "Almost there..." },
  { emoji: "🔥", text: "The mix awakens..." },
  { emoji: "🎉", text: "Done. A masterpiece." },
];

const FLOATING_EMOJIS = ["🌶️", "🧅", "🥜", "🧀", "🫙", "💥", "✨", "🔥", "🫧", "🍋"];

const STEPS = ["Chips", "Secondary", "Spices & Veggies", "Sauces", "Toppings", "Name It"];

const STEP_QUIPS: Record<number, (state: QuipState) => string> = {
  0: ({ chips, mode }) => {
    if (chips.length === 0) return mode === "bowl" ? "A bowl of nothing. Bold start." : "Just one chip. Make it count.";
    if (chips.includes("Lay's Classic") && chips.length === 1) return "Lay's Classic. A minimalist. Respect.";
    if (chips.includes("Kurkure") && chips.length === 1) return "Kurkure only. The OG move.";
    if (chips.length >= 4) return "Four chips in a bowl. This is not a snack, it's an event.";
    if (chips.length === 5) return "FIVE CHIPS. You absolute legend.";
    if (chips.some((c) => ["Pringles", "Doritos"].includes(c))) return "Going imported already? Bougie detected.";
    if (chips.length === 3) return "Triple threat. Getting serious.";
    return "The mix takes shape...";
  },
  1: ({ secondary }) => {
    const active = secondary.filter((i) => i.amount > 0);
    if (active.length === 0) return "No extras? Pure chip energy. Valid.";
    if (active.length >= 4) return "Four extras?! Who ARE you?";
    const peanut = secondary.find((i) => i.name.toLowerCase().includes("peanut") && i.amount > 0);
    if (peanut) return "Peanuts in the mix. A bold statement.";
    const bhujia = secondary.find((i) => i.name.toLowerCase().includes("bhujia") && i.amount > 0);
    if (bhujia) return "Bhujia involvement confirmed. Classic.";
    return `${active.length} extras. This is getting complex.`;
  },
  2: ({ spices, veggies }) => {
    const activeSpices = spices.filter((i) => i.amount > 0);
    const activeVeggies = veggies.filter((i) => i.amount > 0);
    if (activeSpices.length === 0 && activeVeggies.length === 0) return "No spices, no veggies. Living dangerously mild.";
    if (activeSpices.length >= 3) return "Three spices. Your stomach is NOT ready.";
    const chilli = spices.find((i) => i.name.toLowerCase().includes("chilli") && i.amount > 5);
    if (chilli) return "Heavy on the chilli. Call an ambulance. Pre-emptively.";
    const onion = veggies.find((i) => i.name.toLowerCase().includes("onion") && i.amount > 0);
    if (onion) return "Onions. Bold. Everyone will know.";
    return "Spice levels: moderate chaos.";
  },
  3: ({ sauces }) => {
    const active = sauces.filter((i) => i.amount > 0);
    if (active.length === 0) return "No sauces. Keeping it dry. Controversial.";
    if (active.length >= 3) return "Three sauces. This is a soup at this point.";
    const schezwan = sauces.find((i) => i.name.toLowerCase().includes("schezwan") && i.amount > 0);
    if (schezwan) return "Schezwan sauce. Chaos, bottled.";
    const mayo = sauces.find((i) => i.name.toLowerCase().includes("mayo") && i.amount > 0);
    if (mayo) return "Mayo. Unexpected. Respect.";
    return "Drizzle game: active.";
  },
  4: ({ toppings }) => {
    if (toppings.cheese === "double_extra") return "Double extra cheese. You're my hero.";
    if (toppings.cheese === "extra" && toppings.butter) return "Extra cheese + butter. Cardiologist has left the chat.";
    if (toppings.cheese === "none" && !toppings.butter && !toppings.coriander) return "No toppings. Minimalist or lazy? We don't judge.";
    if (toppings.coriander) return "Coriander. Dividing the nation, one bowl at a time.";
    if (toppings.butter) return "Butter on chips. Unhinged. Love it.";
    return "Toppings locked in.";
  },
  5: ({ name }) => {
    if (!name) return "What do you call this creation?";
    if (name.length < 5) return "Short name. Mysterious energy.";
    if (name.toLowerCase().includes("chaos")) return "You named it Chaos. Accurate.";
    if (name.toLowerCase().includes("legend")) return "A legend recognizes themselves.";
    if (name.toLowerCase().includes("mix")) return "Classic naming strategy. Respect.";
    return `"${name}". It has a ring to it.`;
  },
};

type QuipState = {
  chips: string[];
  secondary: SliderItem[];
  spices: SliderItem[];
  veggies: SliderItem[];
  sauces: SliderItem[];
  toppings: Toppings;
  name: string;
  mode: string;
};

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= current ? "bg-primary" : "bg-border"}`}
        />
      ))}
    </div>
  );
}

function MixingAnimation({ progress }: { progress: number }) {
  const stageIdx = Math.min(Math.floor((progress / 100) * MIXING_STAGES.length), MIXING_STAGES.length - 1);
  const stage = MIXING_STAGES[stageIdx];
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 overflow-hidden relative">
      {FLOATING_EMOJIS.map((emoji, i) => (
        <span
          key={i}
          className="absolute text-2xl select-none pointer-events-none"
          style={{
            left: `${10 + (i * 9) % 80}%`,
            top: `${10 + (i * 13) % 70}%`,
            opacity: progress > i * 10 ? 0.6 : 0.1,
            transform: `rotate(${i * 37}deg) scale(${0.8 + (progress / 100) * 0.8})`,
            transition: "all 0.6s ease",
            fontSize: `${1.2 + (i % 3) * 0.5}rem`,
          }}
        >
          {emoji}
        </span>
      ))}
      <div className="relative z-10 max-w-sm w-full text-center">
        <div className="text-7xl mb-6 transition-all duration-500" style={{ transform: `scale(${0.9 + Math.sin(progress / 10) * 0.15})` }}>
          {stage.emoji}
        </div>
        <div className="text-5xl font-black text-primary mb-2 tabular-nums">{Math.round(progress)}%</div>
        <p className="text-lg font-bold text-foreground mb-1">{stage.text}</p>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden mt-6 mb-8">
          <div className="h-3 bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-center gap-3">
          {MIXING_STAGES.slice(0, 5).map((s, i) => (
            <span key={i} className="text-xl transition-all duration-300" style={{ opacity: stageIdx >= i ? 1 : 0.15, transform: stageIdx === i ? "scale(1.4)" : "scale(1)" }}>
              {s.emoji}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Create() {
  const [matched, params] = useRoute("/create/:mode");
  const [, navigate] = useLocation();
  const mode = matched ? (params?.mode === "bowl" ? "bowl" : "bag") : "bag";
  const { session, token, refreshSession, isPremiumUnlocked, isExtraCheeseUnlocked } = useSessionManager();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [secondaryItems, setSecondaryItems] = useState<SliderItem[]>(
    SECONDARY_ITEMS.map((i) => ({ name: i.name, amount: 0, unit: i.unit }))
  );
  const [veggies, setVeggies] = useState<SliderItem[]>(VEGGIES.map((i) => ({ name: i.name, amount: 0, unit: i.unit })));
  const [spices, setSpices] = useState<SliderItem[]>(SPICES.map((i) => ({ name: i.name, amount: 0, unit: i.unit })));
  const [sauces, setSauces] = useState<SliderItem[]>(SAUCES.map((i) => ({ name: i.name, amount: 0, unit: i.unit })));
  const [toppings, setToppings] = useState<Toppings>({ cheese: "none", butter: false, coriander: false });
  const [mixName, setMixName] = useState("");
  const [isMixing, setIsMixing] = useState(false);
  const [mixingProgress, setMixingProgress] = useState(0);
  const [createdMix, setCreatedMix] = useState<null | { id: number; name: string }>(null);
  const [isPosted, setIsPosted] = useState(false);
  const [anonMessage, setAnonMessage] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  const maxChips = mode === "bowl" ? 5 : 1;

  useEffect(() => {
    const remixData = localStorage.getItem("snacksup_remix");
    if (!remixData) return;
    try {
      const remix = JSON.parse(remixData) as {
        mainChips: string[];
        secondaryItems: { name: string; amount: number; unit: string }[];
        spices: { name: string; amount: number; unit: string }[];
        veggies: { name: string; amount: number; unit: string }[];
        sauces: { name: string; amount: number; unit: string }[];
        toppings: Toppings;
      };
      if (Array.isArray(remix.mainChips)) setSelectedChips(remix.mainChips.slice(0, maxChips));
      if (Array.isArray(remix.secondaryItems))
        setSecondaryItems(SECONDARY_ITEMS.map((si) => {
          const found = remix.secondaryItems.find((r) => r.name === si.name);
          return { name: si.name, amount: found?.amount ?? 0, unit: si.unit };
        }));
      if (Array.isArray(remix.spices))
        setSpices(SPICES.map((si) => {
          const found = remix.spices.find((r) => r.name === si.name);
          return { name: si.name, amount: found?.amount ?? 0, unit: si.unit };
        }));
      if (Array.isArray(remix.veggies))
        setVeggies(VEGGIES.map((si) => {
          const found = remix.veggies.find((r) => r.name === si.name);
          return { name: si.name, amount: found?.amount ?? 0, unit: si.unit };
        }));
      if (Array.isArray(remix.sauces))
        setSauces(SAUCES.map((si) => {
          const found = remix.sauces.find((r) => r.name === si.name);
          return { name: si.name, amount: found?.amount ?? 0, unit: si.unit };
        }));
      if (remix.toppings) setToppings(remix.toppings);
      localStorage.removeItem("snacksup_remix");
      toast({ title: "Remix loaded!", description: "Tweak it and make it yours." });
    } catch {
      localStorage.removeItem("snacksup_remix");
    }
  }, [maxChips, toast]);

  useEffect(() => {
    if (!isMixing) return;
    const interval = setInterval(() => {
      setMixingProgress((p) => {
        if (p >= 100) { clearInterval(interval); return 100; }
        const increment = p < 70 ? Math.random() * 8 + 4 : Math.random() * 3 + 1;
        return Math.min(p + increment, 100);
      });
    }, 400);
    return () => clearInterval(interval);
  }, [isMixing]);

  const quipState: QuipState = {
    chips: selectedChips,
    secondary: secondaryItems,
    spices,
    veggies,
    sauces,
    toppings,
    name: mixName,
    mode,
  };
  const quip = STEP_QUIPS[step]?.(quipState) ?? "";

  const chaosScore = useMemo(
    () => calculateChaosScore({ mainChips: selectedChips, secondaryItems, spices, veggies, sauces, toppings }),
    [selectedChips, secondaryItems, spices, veggies, sauces, toppings]
  );
  const chaos = getChaosLabel(chaosScore);

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) => {
      if (prev.includes(chip)) return prev.filter((c) => c !== chip);
      if (prev.length >= maxChips) return prev;
      return [...prev, chip];
    });
  };

  const updateSlider = (
    items: SliderItem[],
    setItems: React.SetStateAction<any>,
    idx: number,
    val: number
  ) => setItems((prev: SliderItem[]) => prev.map((item, i) => (i === idx ? { ...item, amount: val } : item)));

  const handleNext = () => {
    if (step === 0 && selectedChips.length === 0) {
      toast({ title: "Pick at least one chip", variant: "destructive" });
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleMix = async () => {
    if (!mixName.trim()) { toast({ title: "Give your mix a name!", variant: "destructive" }); return; }
    if (!token) return;
    setIsMixing(true);
    setMixingProgress(0);
    try {
      // Offline mutation simulator replacing Replit API architecture
      const generatedId = Math.floor(Math.random() * 100000);
      
      // Update browser stats tracking variables 
      const currentSessionData = localStorage.getItem("snacksup_session_data");
      if (currentSessionData) {
        const parsed = JSON.parse(currentSessionData);
        parsed.byobCount = (parsed.byobCount || 0) + 1;
        parsed.credits = (parsed.credits || 0) + 10;
        localStorage.setItem("snacksup_session_data", JSON.stringify(parsed));
      }

      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          setMixingProgress((p) => {
            if (p >= 99) { clearInterval(check); resolve(); return 100; }
            return p;
          });
        }, 200);
        setTimeout(() => { clearInterval(check); resolve(); }, 3500);
      });
      
      setIsMixing(false);
      setCreatedMix({ id: generatedId, name: mixName.trim() });
      refreshSession();
    } catch {
      setIsMixing(false);
      toast({ title: "Failed to create mix", description: "Try again.", variant: "destructive" });
    }
  };

  const handlePost = () => {
    setIsPosted(true);
    toast({ title: "Mix posted to the Wall!", description: "Everyone can see it. Anonymously." });
  };

  const handleSendMessage = () => {
    if (!anonMessage.trim()) return;
    setMessageSent(true); 
    toast({ title: "Note sent", description: "It's out there. Anonymously." });
  };

  if (isMixing) return <MixingAnimation progress={mixingProgress} />;

  if (createdMix) {
    const toppingsList = [];
    if (toppings.cheese !== "none") toppingsList.push(toppings.cheese.replace("_", " ") + " cheese");
    if (toppings.butter) toppingsList.push("butter");
    if (toppings.coriander) toppingsList.push("coriander");

    return (
      <div className="min-h-screen bg-background text-foreground py-8 px-4">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-black text-center mb-2">
            {isPosted ? "Posted! 🎉" : "Your mix is ready!"}
          </h2>
          <div className="text-center mb-6">
            <span className="text-base font-bold" style={{ color: chaos.color }}>
              {chaos.emoji} {chaos.label} · Chaos Score: {chaosScore}/100
            </span>
          </div>

          <div className="bg-card border-2 border-primary rounded-3xl overflow-hidden shadow-2xl mb-6">
            <div className="bg-primary px-8 py-8 text-primary-foreground">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-black uppercase tracking-widest bg-primary-foreground/20 rounded-full px-3 py-1">
                  {mode.toUpperCase()}
                </span>
                <span className="text-xs opacity-70">by Anonymous</span>
                <span className="text-xs opacity-50 ml-auto">
                  {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <h1 className="text-4xl font-black uppercase tracking-tight">{createdMix.name}</h1>
            </div>

            <div className="px-8 py-6 space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Main Chips</p>
                <div className="flex flex-wrap gap-2">
                  {selectedChips.map((c) => (
                    <span key={c} className="bg-primary/10 text-primary font-bold text-sm px-3 py-1 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
              {secondaryItems.filter((i) => i.amount > 0).length > 0 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Secondaries</p>
                  <div className="flex flex-wrap gap-2">
                    {secondaryItems.filter((i) => i.amount > 0).map((i) => (
                      <span key={i.name} className="bg-muted text-foreground font-semibold text-sm px-3 py-1 rounded-full">
                        {i.name} — {i.amount} {i.unit}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {[...veggies, ...spices].filter((i) => i.amount > 0).length > 0 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Spiced Up</p>
                  <div className="flex flex-wrap gap-2">
                    {[...veggies, ...spices].filter((i) => i.amount > 0).map((i) => (
                      <span key={i.name} className="bg-muted text-foreground font-semibold text-sm px-3 py-1 rounded-full">
                        {i.name} — {i.amount} {i.unit}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {sauces.filter((i) => i.amount > 0).length > 0 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Drizzled</p>
                  <div className="flex flex-wrap gap-2">
                    {sauces.filter((i) => i.amount > 0).map((i) => (
                      <span key={i.name} className="bg-muted text-foreground font-semibold text-sm px-3 py-1 rounded-full">
                        {i.name} — {i.amount} {i.unit}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {toppingsList.length > 0 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Toppings</p>
                  <div className="flex flex-wrap gap-2">
                    {toppingsList.map((t) => (
                      <span key={t} className="bg-accent/30 text-foreground font-bold text-sm px-3 py-1 rounded-full capitalize">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 mb-8">
            {!isPosted ? (
              <Button className="w-full text-base py-6 font-black" onClick={handlePost}>
                Post to the Wall
              </Button>
            ) : (
              <Button className="w-full text-base py-6 font-black" variant="secondary" onClick={() => navigate("/wall")}>
                See it on the Wall →
              </Button>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate(`/mix/${createdMix.id}`)}>
                Full view + Share
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>
                Back home
              </Button>
            </div>
          </div>

          {isPosted && (
            <div className="border border-border rounded-2xl p-5 bg-card">
              <p className="text-sm font-bold mb-1">Got something to say?</p>
              <p className="text-xs text-muted-foreground mb-4">Drop an anonymous note. Nobody knows it's you.</p>
              {messageSent ? (
                <div className="text-sm font-bold text-primary text-center py-2">Note sent ✓ It's out there.</div>
              ) : (
                <>
                  <Textarea
                    placeholder="Say anything. 200 chars max."
                    value={anonMessage}
                    onChange={(e) => setAnonMessage(e.target.value.slice(0, 200))}
                    className="resize-none text-sm mb-2"
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{anonMessage.length}/200</span>
                    <Button size="sm" onClick={handleSendMessage} disabled={!anonMessage.trim()}>
                      Send it
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <button
          onClick={() => (step === 0 ? navigate("/") : handleBack())}
          className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          {step === 0 ? "Cancel" : "Back"}
        </button>
        <div className="text-center">
          <span className="text-xs font-black uppercase tracking-widest text-primary">{mode.toUpperCase()} MODE</span>
        </div>
        {session && <div className="text-xs font-bold text-muted-foreground">{(session as any).credits || 0} cr</div>}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <StepIndicator current={step} total={STEPS.length} />

        <div className="mb-4">
          <h2 className="text-2xl font-black uppercase tracking-tight">{STEPS[step]}</h2>
          {step === 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "bowl" ? `Pick up to ${maxChips} chips` : "Pick exactly 1 chip"}
              {selectedChips.length > 0 && ` — ${selectedChips.length}/${maxChips} selected`}
            </p>
          )}
        </div>

        {quip && (
          <div className="mb-4 px-4 py-2 bg-muted/60 rounded-xl border border-border/50">
            <p className="text-sm font-bold text-muted-foreground italic">"{quip}"</p>
          </div>
        )}

        <div className="mb-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${chaosScore}%`, backgroundColor: chaos.color }}
            />
          </div>
          <span className="text-xs font-black shrink-0" style={{ color: chaos.color }}>
            {chaos.emoji} {chaosScore}
          </span>
        </div>

        {step === 0 && (
          <div className="space-y-4 mt-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Regular</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {REGULAR_CHIPS.map((chip) => {
                  const isSelected = selectedChips.includes(chip);
                  const isDisabled = !isSelected && selectedChips.length >= maxChips;
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => !isDisabled && toggleChip(chip)}
                      className={`rounded-xl px-3 py-3 text-sm font-bold text-left transition-all duration-150 ${
                        isSelected ? "bg-primary text-primary-foreground scale-95"
                          : isDisabled ? "bg-muted text-muted-foreground/40 cursor-not-allowed"
                          : "bg-card border border-border hover:border-primary/40 hover:scale-105"
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Imported (Premium)</p>
                {!isPremiumUnlocked && (
                  <span className="text-xs font-bold bg-accent/30 text-foreground rounded-full px-2 py-0.5">
                    {session ? `${3 - (session.byobCount || 0)} more mix${3 - (session.byobCount || 0) === 1 ? "" : "es"} to unlock` : "locked"}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {IMPORTED_CHIPS.map((chip) => {
                  const isSelected = selectedChips.includes(chip);
                  const isLocked = !isPremiumUnlocked;
                  const isDisabled = (!isSelected && selectedChips.length >= maxChips) || isLocked;
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => !isDisabled && toggleChip(chip)}
                      className={`relative rounded-xl px-3 py-3 text-sm font-bold text-left transition-all duration-150 ${
                        isLocked ? "bg-muted border border-dashed border-border text-muted-foreground/40 cursor-not-allowed"
                          : isSelected ? "bg-primary text-primary-foreground scale-95"
                          : isDisabled ? "bg-muted text-muted-foreground/40 cursor-not-allowed"
                          : "bg-card border border-amber-300/60 hover:border-amber-400 hover:scale-105"
                      }`}
                    >
                      {isLocked ? <span className="absolute top-1 right-1 text-xs">🔒</span> : <span className="absolute top-1 right-1 text-xs">★</span>}
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 mt-4">
            {SECONDARY_ITEMS.map((item, idx) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">{item.name}</span>
                  <span className="text-sm font-black text-primary">{secondaryItems[idx].amount} {item.unit}</span>
                </div>
                <Slider min={0} max={item.max} step={1} value={[secondaryItems[idx].amount]}
                  onValueChange={([v]) => updateSlider(secondaryItems, setSecondaryItems, idx, v)} className="w-full" />
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 mt-4">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Vegetables (grams)</p>
              {VEGGIES.map((item, idx) => (
                <div key={item.name} className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">{item.name}</span>
                    <span className="text-sm font-black text-primary">{veggies[idx].amount}g</span>
                  </div>
                  <Slider min={0} max={item.max} step={5} value={[veggies[idx].amount]}
                    onValueChange={([v]) => updateSlider(veggies, setVeggies, idx, v)} className="w-full" />
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Spices (pinches)</p>
              {SPICES.map((item, idx) => (
                <div key={item.name} className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">{item.name}</span>
                    <span className="text-sm font-black text-primary">{spices[idx].amount} pinches</span>
                  </div>
                  <Slider min={0} max={item.max} step={1} value={[spices[idx].amount]}
                    onValueChange={([v]) => updateSlider(spices, setSpices, idx, v)} className="w-full" />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 mt-4">
            {SAUCES.map((item, idx) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">{item.name}</span>
                  <span className="text-sm font-black text-primary">{sauces[idx].amount} drips</span>
                </div>
                <Slider min={0} max={item.max} step={1} value={[sauces[idx].amount]}
                  onValueChange={([v]) => updateSlider(sauces, setSauces, idx, v)} className="w-full" />
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 mt-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Cheese</p>
              <div className="grid grid-cols-2 gap-2">
                {(["none", "regular", "extra", "double_extra"] as const).map((opt) => {
                  const labels = { none: "None", regular: "Regular", extra: "Extra", double_extra: "Double Extra" };
                  const isLocked = (opt === "extra" || opt === "double_extra") && !isExtraCheeseUnlocked;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isLocked}
                      onClick={() => !isLocked && setToppings((t) => ({ ...t, cheese: opt }))}
                      className={`relative rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                        isLocked ? "bg-muted text-muted-foreground/40 cursor-not-allowed border border-dashed border-border"
                          : toppings.cheese === opt ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border hover:border-primary/40"
                      }`}
                    >
                      {isLocked && <span className="absolute top-1 right-1 text-xs">🔒</span>}
                      {labels[opt]}
                      {isLocked && session && (
                        <div className="text-xs font-normal mt-0.5 opacity-60">{6 - (session.byobCount || 0)} more mixes</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Other Toppings</p>
              <button
                type="button"
                onClick={() => setToppings((t) => ({ ...t, butter: !t.butter }))}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
                  toppings.butter ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"
                }`}
              >
                <span>Butter</span><span>{toppings.butter ? "On" : "Off"}</span>
              </button>
              <button
                type="button"
                onClick={() => setToppings((t) => ({ ...t, coriander: !t.coriander }))}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
                  toppings.coriander ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"
                }`}
              >
                <span>Coriander</span><span>{toppings.coriander ? "On" : "Off"}</span>
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 mt-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-muted-foreground">Name your creation</label>
              <Input
                placeholder="e.g. Absolute Chaos Blend"
                value={mixName}
                onChange={(e) => setMixName(e.target.value.slice(0, 100))}
                className="text-lg font-black h-14"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-2">{mixName.length}/100</p>
            </div>
            <div className="bg-muted/50 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Your mix summary</p>
              <div className="flex flex-wrap gap-1">
                {selectedChips.map((c) => (
                  <span key={c} className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{c}</span>
                ))}
              </div>
              {secondaryItems.filter((i) => i.amount > 0).length > 0 && (
                <p className="text-xs text-muted-foreground">+ {secondaryItems.filter((i) => i.amount > 0).map((i) => i.name).join(", ")}</p>
              )}
              {[...veggies, ...spices].filter((i) => i.amount > 0).length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Spiced: {[...veggies, ...spices].filter((i) => i.amount > 0).map((i) => i.name).join(", ")}
                </p>
              )}
              {sauces.filter((i) => i.amount > 0).length > 0 && (
                <p className="text-xs text-muted-foreground">Drizzled: {sauces.filter((i) => i.amount > 0).map((i) => i.name).join(", ")}</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} className="flex-1 font-black">Next: {STEPS[step + 1]}</Button>
          ) : (
            <Button
              onClick={handleMix}
              disabled={!mixName.trim()}
              className="flex-1 font-black text-base py-6"
            >
              MIX IT!
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}