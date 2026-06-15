type SliderItem = { amount: number };
type Toppings = { cheese: string; butter: boolean; coriander: boolean };

export function calculateChaosScore(mix: {
  mainChips: string[];
  secondaryItems: SliderItem[];
  spices: SliderItem[];
  veggies: SliderItem[];
  sauces: SliderItem[];
  toppings: Toppings;
}): number {
  let score = 0;
  score += mix.mainChips.length * 15;
  score += mix.secondaryItems.filter((i) => i.amount > 0).length * 5;
  score += mix.spices.filter((i) => i.amount > 0).length * 4;
  score += mix.veggies.filter((i) => i.amount > 0).length * 3;
  score += mix.sauces.filter((i) => i.amount > 0).length * 4;
  if (mix.toppings.cheese === "extra") score += 8;
  if (mix.toppings.cheese === "double_extra") score += 15;
  if (mix.toppings.butter) score += 5;
  if (mix.toppings.coriander) score += 3;
  const maxScore = 169;
  return Math.min(100, Math.round((score / maxScore) * 100));
}

export function getChaosLabel(score: number): { label: string; emoji: string; color: string } {
  if (score <= 20) return { label: "Chill & Safe", emoji: "😇", color: "#4ade80" };
  if (score <= 40) return { label: "Getting Spicy", emoji: "🌶️", color: "#fb923c" };
  if (score <= 60) return { label: "Certified Chaotic", emoji: "🌪️", color: "#f97316" };
  if (score <= 80) return { label: "Pure Madness", emoji: "🤯", color: "#ef4444" };
  return { label: "ABSOLUTE LEGEND", emoji: "👑", color: "#a855f7" };
}
