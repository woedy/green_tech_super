export type Project = {
  id: string;
  title: string;
  status: "planning" | "in_progress" | "on_hold" | "completed";
  nextMilestone?: string;
  milestones: { title: string; due?: string; done?: boolean }[];
  updates: { at: string; text: string }[];
};

export const PROJECTS: Project[] = [
  {
    id: "PRJ-88",
    title: "Urban Duplex A2 - Kumasi",
    status: "in_progress",
    nextMilestone: "Foundation pour (Mar 22)",
    milestones: [
      { title: "Site prep", done: true },
      { title: "Foundation pour", due: "2025-03-22" },
      { title: "Framing" },
      { title: "Roofing" },
    ],
    updates: [
      { at: "2025-03-10", text: "Rebar delivered to site." },
      { at: "2025-03-08", text: "Soil test passed; ready for pour." },
    ],
  },
  {
    id: "PRJ-73",
    title: "Eco Bungalow S1 - Accra",
    status: "planning",
    nextMilestone: "Permit approval (ETA Apr 5)",
    milestones: [
      { title: "Design finalization", done: true },
      { title: "Permit approval", due: "2025-04-05" },
      { title: "Groundbreaking" },
    ],
    updates: [
      { at: "2025-03-05", text: "Submitted permit documents." },
    ],
  },
];



