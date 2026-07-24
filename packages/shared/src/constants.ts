export const APP_NAME = "Edunet Scholar";
export const APP_SLOGAN = "The AI Workspace for Student Success";

export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/",
  EDUCHAT: "/educhat",
  EDUBOOK: "/edubook",
  EDUPLAN: "/eduplan",
} as const;

export const MODULES = [
  { id: "educhat", label: "EduChat", href: ROUTES.EDUCHAT, icon: "MessageSquare" },
  { id: "edubook", label: "EduBook", href: ROUTES.EDUBOOK, icon: "BookOpen" },
  { id: "eduplan", label: "EduPlan", href: ROUTES.EDUPLAN, icon: "CalendarCheck" },
] as const;
