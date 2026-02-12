import fashion1 from "@/assets/mock/fashion-1.jpg";
import fashion2 from "@/assets/mock/fashion-2.jpg";
import fashion3 from "@/assets/mock/fashion-3.jpg";
import fashion4 from "@/assets/mock/fashion-4.jpg";
import fashion5 from "@/assets/mock/fashion-5.jpg";
import fashion6 from "@/assets/mock/fashion-6.jpg";

export const MOCK_IMAGES = [fashion1, fashion2, fashion3, fashion4, fashion5, fashion6];

export interface MockBoard {
  id: string;
  title: string;
  username: string;
  images: string[];
  tags: string[];
  viewCount: number;
  createdAt: Date;
  isPublic: boolean;
  updatedAt: Date;
}

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);

export const MOCK_BOARDS: MockBoard[] = [
  {
    id: "1",
    title: "Gold Hour Maximalism",
    username: "velvet.muse",
    images: [fashion1, fashion2, fashion4, fashion5],
    tags: ["#chunkygold", "#80sluxury", "#maximalist"],
    viewCount: 342,
    createdAt: hoursAgo(2),
    isPublic: true,
    updatedAt: hoursAgo(1),
  },
  {
    id: "2",
    title: "Corporate Goth Revival",
    username: "blade.aesthetic",
    images: [fashion6, fashion3, fashion1, fashion2],
    tags: ["#corporategoth", "#leather", "#powerdressing", "#bladerunner"],
    viewCount: 189,
    createdAt: hoursAgo(5),
    isPublic: true,
    updatedAt: hoursAgo(3),
  },
  {
    id: "3",
    title: "Sculpted Silhouettes",
    username: "atelier.noir",
    images: [fashion3, fashion1, fashion6, fashion4],
    tags: ["#sculptedshoulder", "#powerblazer", "#oversizedsilhouette"],
    viewCount: 567,
    createdAt: hoursAgo(8),
    isPublic: true,
    updatedAt: hoursAgo(6),
  },
  {
    id: "4",
    title: "Old Money Textures",
    username: "satin.cloud",
    images: [fashion4, fashion5, fashion2, fashion1],
    tags: ["#oldmoney", "#satin", "#velvet", "#opulent"],
    viewCount: 124,
    createdAt: hoursAgo(12),
    isPublic: true,
    updatedAt: hoursAgo(10),
  },
  {
    id: "5",
    title: "Art Deco Dreams",
    username: "deco.divine",
    images: [fashion2, fashion4, fashion5, fashion3],
    tags: ["#artdeco", "#sequins", "#oldhollywood"],
    viewCount: 891,
    createdAt: hoursAgo(24),
    isPublic: true,
    updatedAt: hoursAgo(20),
  },
  {
    id: "6",
    title: "Thrift Find Treasures",
    username: "vintage.hunt",
    images: [fashion5, fashion6, fashion3, fashion1],
    tags: ["#thriftfind", "#vintage80s", "#upcycled"],
    viewCount: 256,
    createdAt: hoursAgo(36),
    isPublic: true,
    updatedAt: hoursAgo(30),
  },
  {
    id: "7",
    title: "Metallic Mood",
    username: "chrome.queen",
    images: [fashion1, fashion3, fashion4, fashion6],
    tags: ["#metallictexture", "#highgloss", "#newmoney"],
    viewCount: 432,
    createdAt: hoursAgo(48),
    isPublic: true,
    updatedAt: hoursAgo(40),
  },
  {
    id: "8",
    title: "Power Accessories",
    username: "golden.era",
    images: [fashion2, fashion5, fashion1, fashion4],
    tags: ["#statementbelt", "#brooch", "#operagloves", "#powernecklace"],
    viewCount: 178,
    createdAt: hoursAgo(72),
    isPublic: true,
    updatedAt: hoursAgo(60),
  },
  {
    id: "9",
    title: "Disco Revival",
    username: "sequin.soul",
    images: [fashion4, fashion2, fashion3, fashion5],
    tags: ["#disco", "#sequins", "#maximalist"],
    viewCount: 623,
    createdAt: hoursAgo(96),
    isPublic: true,
    updatedAt: hoursAgo(80),
  },
];

export const POPULAR_TAGS = [
  "#sculptedshoulder",
  "#80sluxury",
  "#maximalist",
  "#powerblazer",
  "#chunkygold",
  "#corporategoth",
  "#oldmoney",
  "#artdeco",
  "#velvet",
  "#thriftfind",
  "#disco",
  "#sequins",
];

export const TAG_LIBRARY = {
  silhouette: [
    { name: "#sculptedshoulder", count: 1200 },
    { name: "#powerblazer", count: 982 },
    { name: "#funnelneck", count: 756 },
    { name: "#oversizedsilhouette", count: 1100 },
    { name: "#peplum", count: 445 },
    { name: "#corset", count: 892 },
  ],
  era: [
    { name: "#80sluxury", count: 2100 },
    { name: "#oldhollywood", count: 1500 },
    { name: "#corporategoth", count: 834 },
    { name: "#bladerunner", count: 623 },
    { name: "#artdeco", count: 901 },
    { name: "#victorian", count: 445 },
  ],
  texture: [
    { name: "#metallictexture", count: 1300 },
    { name: "#sequins", count: 892 },
    { name: "#highgloss", count: 756 },
    { name: "#satin", count: 1100 },
    { name: "#velvet", count: 978 },
    { name: "#leather", count: 834 },
  ],
  accessories: [
    { name: "#chunkygold", count: 1400 },
    { name: "#statementbelt", count: 678 },
    { name: "#cuffbracelet", count: 567 },
    { name: "#brooch", count: 890 },
    { name: "#powernecklace", count: 723 },
    { name: "#operagloves", count: 445 },
  ],
  mood: [
    { name: "#maximalist", count: 1800 },
    { name: "#opulent", count: 1200 },
    { name: "#powerdressing", count: 967 },
    { name: "#oldmoney", count: 1100 },
    { name: "#newmoney", count: 890 },
    { name: "#disco", count: 678 },
  ],
  sustainable: [
    { name: "#thriftfind", count: 1500 },
    { name: "#vintage80s", count: 1100 },
    { name: "#upcycled", count: 723 },
    { name: "#deadstock", count: 445 },
  ],
};

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Yesterday";
  if (diffD < 7) return `${diffD}d ago`;
  return `${Math.floor(diffD / 7)}w ago`;
}
