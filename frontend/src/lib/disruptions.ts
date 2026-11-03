import { CloudRain, Flame, Wind, type LucideIcon } from "lucide-react";

export const DISRUPTIONS = ["Rain", "Heat", "Pollution"] as const;
export type Disruption = (typeof DISRUPTIONS)[number];

export const DISRUPTION_META: Record<
  Disruption,
  { icon: LucideIcon; tone: string; description: string }
> = {
  Rain: {
    icon: CloudRain,
    tone: "bg-rain/10 text-rain",
    description: "Heavy rain or waterlogging",
  },
  Heat: {
    icon: Flame,
    tone: "bg-heat/10 text-heat",
    description: "Heat advisory or unsafe temperature",
  },
  Pollution: {
    icon: Wind,
    tone: "bg-smog/10 text-smog",
    description: "Severe air quality (AQI spike)",
  },
};
