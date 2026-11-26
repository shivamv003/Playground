import {
  Accessibility,
  BookOpen,
  CodeXml,
  HeartHandshake,
  Leaf,
  Palette,
} from "lucide-react";

export const featuredCategories = [
  { name: "Sustainability", icon: Leaf, color: "mint" },
  { name: "Education", icon: BookOpen, color: "peach" },
  { name: "Accessibility", icon: Accessibility, color: "lilac" },
  { name: "Software", icon: CodeXml, color: "butter" },
  { name: "Design", icon: Palette, color: "rose" },
  { name: "Social Impact", icon: HeartHandshake, color: "sky" },
] as const;

export type Category = (typeof featuredCategories)[number]["name"];

export type SampleProblem = {
  slug: string;
  title: string;
  description: string;
  context: string;
  category: Category;
  skills: string[];
  image: string;
  color: string;
  author: string;
  initials: string;
  purpose: string;
};

export const sampleProblems: SampleProblem[] = [
  {
    slug: "campus-food-waste",
    title: "Give campus leftovers a second life",
    description:
      "Help connect college kitchens with local groups that can put surplus food to good use.",
    context:
      "Dining halls often have safe, edible food left over after service. Local food rescue groups could collect it if they knew what was available and had a reliable pickup window. A first version could help a single campus coordinate those handoffs.",
    category: "Sustainability",
    skills: ["Backend", "UI/UX"],
    image: "/images/food-rescue.webp",
    color: "mint",
    author: "Ananya Rao",
    initials: "AR",
    purpose: "Social impact",
  },
  {
    slug: "first-generation-student-guide",
    title: "Make college easier to navigate",
    description:
      "Build a practical guide to campus life with and for first-generation students.",
    context:
      "Processes like finding financial aid, booking office hours, and applying for campus work can be hard to figure out. A small group of students could collect the questions they wish they had known to ask, then turn the answers into a searchable guide.",
    category: "Education",
    skills: ["Research", "Frontend"],
    image: "/images/student-guide.webp",
    color: "peach",
    author: "Maya Patel",
    initials: "MP",
    purpose: "Side project",
  },
  {
    slug: "accessible-city-map",
    title: "Map a more accessible city",
    description:
      "Create a neighborhood map that makes it easier to plan step-free trips.",
    context:
      "Route planners rarely capture details such as curb cuts, steep ramps, or entrances with steps. Start with a neighborhood and work with local wheelchair users to decide which details to record and how to keep them up to date.",
    category: "Accessibility",
    skills: ["Product Design", "Mapping"],
    image: "/images/city-map.webp",
    color: "lilac",
    author: "Jordan Lee",
    initials: "JL",
    purpose: "Open source",
  },
];

export function exploreCategoryHref(category: Category) {
  return `/explore?category=${encodeURIComponent(category)}`;
}
