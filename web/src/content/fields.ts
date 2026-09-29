import {
  Atom,
  Binary,
  Bot,
  Brain,
  BrainCircuit,
  Cpu,
  Dna,
  FlaskConical,
  Globe2,
  HeartPulse,
  Languages,
  Layers,
  LineChart,
  Microscope,
  Orbit,
  Shield,
  Sigma,
  Sprout,
  TestTube2,
  Thermometer,
  Users,
  Virus,
  type LucideIcon,
} from "lucide-react";

export interface Field {
  slug: string;
  /** The English query sent to the scholarly search (OpenAlex is English-centric). */
  query: string;
  icon: LucideIcon;
  related: string[];
}

export const FIELDS: Field[] = [
  { slug: "astrophysics", query: "astrophysics", icon: Orbit, related: ["physics", "quantum-computing", "mathematics"] },
  { slug: "physics", query: "condensed matter physics", icon: Atom, related: ["astrophysics", "quantum-computing", "materials-science"] },
  { slug: "quantum-computing", query: "quantum computing", icon: Cpu, related: ["physics", "computer-science", "mathematics"] },
  { slug: "chemistry", query: "organic chemistry", icon: FlaskConical, related: ["biochemistry", "materials-science", "environmental-science"] },
  { slug: "materials-science", query: "materials science", icon: Layers, related: ["chemistry", "physics", "robotics"] },
  { slug: "machine-learning", query: "machine learning", icon: BrainCircuit, related: ["computer-science", "robotics", "bioinformatics"] },
  { slug: "computer-science", query: "computer science", icon: Binary, related: ["machine-learning", "quantum-computing", "mathematics"] },
  { slug: "robotics", query: "robotics", icon: Bot, related: ["machine-learning", "computer-science", "materials-science"] },
  { slug: "mathematics", query: "mathematics", icon: Sigma, related: ["computer-science", "physics", "economics"] },
  { slug: "biochemistry", query: "biochemistry", icon: TestTube2, related: ["molecular-biology", "chemistry", "genetics"] },
  { slug: "molecular-biology", query: "molecular biology", icon: Microscope, related: ["biochemistry", "genetics", "immunology"] },
  { slug: "genetics", query: "genetics", icon: Dna, related: ["bioinformatics", "molecular-biology", "epidemiology"] },
  { slug: "bioinformatics", query: "bioinformatics", icon: Dna, related: ["genetics", "machine-learning", "computer-science"] },
  { slug: "neuroscience", query: "neuroscience", icon: Brain, related: ["cognitive-science", "psychology", "machine-learning"] },
  { slug: "cognitive-science", query: "cognitive science", icon: BrainCircuit, related: ["neuroscience", "psychology", "linguistics"] },
  { slug: "psychology", query: "psychology", icon: Users, related: ["cognitive-science", "neuroscience", "sociology"] },
  { slug: "immunology", query: "immunology", icon: Shield, related: ["molecular-biology", "epidemiology", "genetics"] },
  { slug: "public-health", query: "public health", icon: HeartPulse, related: ["epidemiology", "sociology", "environmental-science"] },
  { slug: "epidemiology", query: "epidemiology", icon: Virus, related: ["public-health", "immunology", "genetics"] },
  { slug: "environmental-science", query: "environmental science", icon: Sprout, related: ["climate-science", "chemistry", "public-health"] },
  { slug: "climate-science", query: "climate science", icon: Thermometer, related: ["environmental-science", "physics", "economics"] },
  { slug: "economics", query: "economics", icon: LineChart, related: ["mathematics", "sociology", "climate-science"] },
  { slug: "linguistics", query: "linguistics", icon: Languages, related: ["cognitive-science", "computer-science", "sociology"] },
  { slug: "sociology", query: "sociology", icon: Globe2, related: ["psychology", "economics", "public-health"] },
];

export const fieldBySlug = (slug: string) => FIELDS.find((f) => f.slug === slug);
