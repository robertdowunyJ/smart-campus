export type Notice = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  category: "Academic" | "Scholarship" | "Event";
};

export const notices: Notice[] = [
  {
    id: "n1",
    title: "[Academic] Grade viewing schedule",
    body: "Grade viewing is available from 12/26 to 12/30. Appeals are accepted until 12/31.",
    createdAt: "2025-12-22",
    category: "Academic",
  },
  {
    id: "n2",
    title: "[Scholarship] National scholarship (2nd round)",
    body: "Application period: 12/15 to 12/28. Document submission deadline: 12/30.",
    createdAt: "2025-12-21",
    category: "Scholarship",
  },
  {
    id: "n3",
    title: "[Event] SW/AI Hackathon orientation",
    body: "Orientation: 12/23 09:30. Location: Gwanggaeto Hall. Bring your laptop.",
    createdAt: "2025-12-20",
    category: "Event",
  },
];
