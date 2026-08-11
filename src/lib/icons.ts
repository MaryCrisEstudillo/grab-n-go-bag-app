import {
  Briefcase,
  Droplets,
  Flame,
  HeartPulse,
  Package,
  Pill,
  Shirt,
  Soup,
  Utensils,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

/**
 * A curated set rather than a namespace import, so the bundle only carries the
 * icons actually used. Categories store an icon *name*, and anything unknown
 * (including user-created categories) falls back to Package.
 */
const ICONS: Record<string, LucideIcon> = {
  Briefcase,
  Droplets,
  Flame,
  HeartPulse,
  Package,
  Pill,
  Shirt,
  Soup,
  Utensils,
  Wrench,
};

export const DEFAULT_ICON = 'Package';

export function iconFor(name: string): LucideIcon {
  return ICONS[name] ?? Package;
}
