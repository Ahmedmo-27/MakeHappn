import "@/models/Client"; // registers the schema for populate("clientId")
import "@/models/User"; // registers the schema for populate of user refs
import { connectDB } from "@/lib/db";
import { Project } from "@/models/Project";
import { Client } from "@/models/Client";
import { Lead } from "@/models/Lead";
import { Task } from "@/models/Task";
import { Team } from "@/models/Team";
import {
  STUDIO_PRODUCTS,
  STUDIO_PRODUCT_LABELS,
  type StudioProduct,
} from "@/lib/domain";

export async function getStudioAnalytics() {
  await connectDB();

  const [projects, clients, leads, tasks, lanes] = await Promise.all([
    Project.find().populate("clientId", "name brandName").lean(),
    Client.find().lean(),
    Lead.find().lean(),
    Task.find().populate("teamId", "name").lean(),
    Team.find().lean(),
  ]);

  // 1. Revenue by Studio Product
  const productStats: Record<
    StudioProduct,
    { label: string; projectCount: number; totalRevenue: number; avgDealSize: number }
  > = {} as Record<
    StudioProduct,
    { label: string; projectCount: number; totalRevenue: number; avgDealSize: number }
  >;

  for (const prod of STUDIO_PRODUCTS) {
    productStats[prod] = {
      label: STUDIO_PRODUCT_LABELS[prod],
      projectCount: 0,
      totalRevenue: 0,
      avgDealSize: 0,
    };
  }

  for (const p of projects) {
    const val = p.approvedContractValue || p.quotedValue || 0;
    const splitVal = p.products.length > 0 ? val / p.products.length : val;
    for (const prod of p.products) {
      if (productStats[prod]) {
        productStats[prod].projectCount += 1;
        productStats[prod].totalRevenue += splitVal;
      }
    }
  }

  for (const prod of STUDIO_PRODUCTS) {
    if (productStats[prod].projectCount > 0) {
      productStats[prod].avgDealSize =
        productStats[prod].totalRevenue / productStats[prod].projectCount;
    }
  }

  // 2. Client Concentration
  const clientMap = new Map<string, { name: string; projectCount: number; totalSpent: number }>();
  for (const p of projects) {
    const client = p.clientId as unknown as { _id?: unknown; name?: string; brandName?: string } | null;
    const clientName = client?.brandName || client?.name || "Client";
    const clientIdStr = client?._id ? String(client._id) : clientName;

    const existing = clientMap.get(clientIdStr) ?? {
      name: clientName,
      projectCount: 0,
      totalSpent: 0,
    };
    existing.projectCount += 1;
    existing.totalSpent += p.approvedContractValue || p.quotedValue || 0;
    clientMap.set(clientIdStr, existing);
  }

  const topClients = Array.from(clientMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 8);

  // 3. Estimate vs Actual Cost Variance
  const varianceProjects = projects
    .filter((p) => p.actualTotalCost > 0 || p.estimatedTotalCost > 0)
    .map((p) => {
      const estimated = p.estimatedTotalCost || 0;
      const actual = p.actualTotalCost || 0;
      const contract = p.approvedContractValue || p.quotedValue || 0;
      const costVariance = actual - estimated; // positive = over budget
      const realizedProfit = contract - actual;
      const marginPercent = contract > 0 ? (realizedProfit / contract) * 100 : 0;

      return {
        id: String(p._id),
        code: p.code,
        name: p.name,
        contract,
        estimated,
        actual,
        costVariance,
        realizedProfit,
        marginPercent,
        status: p.status,
      };
    })
    .slice(0, 10);

  // 4. Lane Workload & Task Capacity
  const laneStats = lanes.map((lane) => {
    const laneTasks = tasks.filter((t) => t.teamId && String((t.teamId as unknown as { _id: unknown })._id || t.teamId) === String(lane._id));
    const openTasks = laneTasks.filter((t) => t.status !== "done");
    const blockedTasks = laneTasks.filter((t) => t.status === "blocked");
    const urgentTasks = laneTasks.filter((t) => t.priority === "urgent" && t.status !== "done");

    return {
      id: String(lane._id),
      name: lane.name,
      totalTasks: laneTasks.length,
      openTasks: openTasks.length,
      blockedTasks: blockedTasks.length,
      urgentTasks: urgentTasks.length,
    };
  });

  // 5. Sales Funnel & Win/Loss Conversion
  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.stage === "won").length;
  const lostLeads = leads.filter((l) => l.stage === "lost").length;
  const inPipelineLeads = leads.filter((l) => l.stage !== "won" && l.stage !== "lost").length;
  const winRatePercent = totalLeads > 0 ? (wonLeads / (wonLeads + lostLeads || 1)) * 100 : 0;

  return {
    productStats: Object.values(productStats),
    topClients,
    varianceProjects,
    laneStats,
    funnel: {
      totalLeads,
      wonLeads,
      lostLeads,
      inPipelineLeads,
      winRatePercent: Math.round(winRatePercent),
    },
    totalProjectsCount: projects.length,
    totalClientsCount: clients.length,
  };
}
