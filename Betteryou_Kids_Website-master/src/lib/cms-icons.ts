import type { LucideIcon } from "lucide-react";
import {
  Award,
  Baby,
  BookOpen,
  Clock,
  Dumbbell,
  Gift,
  Globe,
  GraduationCap,
  Heart,
  MapPin,
  Music,
  Palette,
  Sparkles,
  Star,
  TreePine,
  Trophy,
  Users,
  Utensils,
} from "lucide-react";
import type { CmsIconName } from "@/lib/site-content-cms";

const CMS_ICON_MAP: Record<CmsIconName, LucideIcon> = {
  Sparkles,
  MapPin,
  Users,
  Trophy,
  GraduationCap,
  Heart,
  Award,
  Baby,
  Clock,
  Gift,
  Globe,
  Star,
  Music,
  Dumbbell,
  Palette,
  TreePine,
  BookOpen,
  Utensils,
};

export function cmsIcon(name: CmsIconName | string | undefined): LucideIcon {
  if (name && name in CMS_ICON_MAP) {
    return CMS_ICON_MAP[name as CmsIconName];
  }
  return Sparkles;
}
