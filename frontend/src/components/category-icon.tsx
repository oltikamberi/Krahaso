import {
  Gamepad2,
  Laptop,
  Package,
  Smartphone,
  Tv,
  WashingMachine,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  smartphone: Smartphone,
  laptop: Laptop,
  tv: Tv,
  "washing-machine": WashingMachine,
  gamepad: Gamepad2,
};

export function CategoryIcon({
  icon,
  className,
  strokeWidth = 1.5,
}: {
  icon: string | null;
  className?: string;
  strokeWidth?: LucideProps["strokeWidth"];
}) {
  const Icon = (icon && icons[icon]) || Package;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}
