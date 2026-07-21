import {
  Laptop,
  Package,
  Smartphone,
  Tv,
  WashingMachine,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  smartphone: Smartphone,
  laptop: Laptop,
  tv: Tv,
  "washing-machine": WashingMachine,
};

export function CategoryIcon({
  icon,
  className,
}: {
  icon: string | null;
  className?: string;
}) {
  const Icon = (icon && icons[icon]) || Package;
  return <Icon className={className} />;
}
