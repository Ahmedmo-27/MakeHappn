import { api } from "@/lib/api-client";

export interface AnalyticsReport {
  productStats: any[];
  topClients: any[];
  varianceProjects: any[];
  laneStats: any[];
  funnel: any;
  totalProjectsCount: number;
  totalClientsCount: number;
  revenueByCurrency: Array<{ currency: string; total: number }>;
  salesByPeriod: Array<{ period: string; currency: string; amount: number }>;
  deliveryPerformance: { onTime: number; late: number; unscheduled: number };
}

export function getStudioAnalytics() {
  return api<AnalyticsReport>("/reports");
}

export function loadCommandCenter() {
  return api<{
    invoices: any[];
    tasks: any[];
    users: Array<{ _id: any; name: string; title?: string; laneIds: any[]; role?: string; [key: string]: any }>;
    deliverables: any[];
    teams: Array<{ _id: any; name: string; [key: string]: any }>;
  }>("/reports/command-center");
}
