
import {
  BookOpen,
Bot,
  BrainCircuit,
  GitGraph,
  Home,
  LucideLayoutDashboard,
  Newspaper,
  Settings2,
  SquareTerminal,
  Stamp,
  Upload,
  UserIcon,
  UserPenIcon,
} from "lucide-react"
// This is sample data.
export interface User {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  userType: "STUDENT" | "FACULTY" | "ADMIN"; // Add other roles if needed
  isVerified: boolean;
  password: string | null;
  position: string | null;
  resetToken: string | null;
  resetTokenExpiry: string | null;
  varificationCode: string | null;
  varificationCodeExpiry: string | null;
  createdAt: string; // or `Date` if you parse it
  updatedAt: string; // or `Date` if you parse it
}



export const DashboardItems = [
  {
    title: "Dashboard",
    url: "#",
    icon: LucideLayoutDashboard,
    isActive: true,
    items: [
      { title: "Home", url: "/",icon:Home },
      { title: "Data Graph", url: "dashboard" ,icon:GitGraph},
      { title: "Upload Paper", url: "dashboard/upload",icon: Upload },
      { title: "Paper status", url: "dashboard/status",icon: Stamp },
    ],
  },
  {
    title: "Models",
    url: "#",
    icon: Bot,
    items: [
      { title: "Genesis", url: "#" },
      { title: "Explorer", url: "#" },
      { title: "Quantum", url: "#" },
    ],
  },
  {
    title: "Documentation",
    url: "#",
    icon: BookOpen,
    items: [
      { title: "Introduction", url: "#" },
      { title: "Get Started", url: "#" },
      { title: "Tutorials", url: "#" },
      { title: "Changelog", url: "#" },
    ],
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings2,
    
    items: [
      { title: "General", url: "#" },
      { title: "Team", url: "#" },
      { title: "Billing", url: "#" },
      { title: "Limits", url: "#" },
    ],
  },
  {
    title: "Settings for Faculty",
    url: "#",
    icon: Settings2,
    access: ["FACULTY"],
    items: [
      { title: "General", url: "#" },
      { title: "Team", url: "#" },
      { title: "Billing", url: "#" },
      { title: "Limits", url: "#" },
    ],
  },
  {
    title: "Admin Work Panel",
    url: "#",
    icon: BrainCircuit ,
    access: ["ADMIN"],
    items: [
      { title: "Faculty List Work", url: "dashboard/facultylist" ,icon:UserPenIcon},
      { title: "User List", url: "dashboard/userlist" ,icon:UserIcon},
      { title: "Latest News", url: "dashboard/news" ,icon:Newspaper},
      { title: "Upload Home page Images", url: "dashboard/upHIm" ,icon:Upload},
    ],
  },
]
