import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCTC(lpa: number): string {
  if (lpa >= 100) return `₹${lpa}L`;
  return `₹${lpa}L`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function daysLeft(dateStr: string): number {
  const deadline = new Date(dateStr);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: "badge-success",
    upcoming: "badge-primary",
    completed: "badge-neutral",
    cancelled: "badge-danger",
    placed: "badge-success",
    unplaced: "badge-neutral",
    applied: "badge-info",
    shortlisted: "badge-primary",
    interview_scheduled: "badge-warning",
    offer_extended: "badge-success",
    offer_accepted: "badge-success",
    rejected: "badge-danger",
    withdrawn: "badge-neutral",
    pending: "badge-warning",
    approved: "badge-success",
  };
  return map[status] ?? "badge-neutral";
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: "Active",
    upcoming: "Upcoming",
    completed: "Completed",
    cancelled: "Cancelled",
    placed: "Placed",
    unplaced: "Unplaced",
    applied: "Applied",
    shortlisted: "Shortlisted",
    interview_scheduled: "Interview Scheduled",
    offer_extended: "Offer Extended",
    offer_accepted: "Offer Accepted",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
    pending: "Pending Approval",
    approved: "Approved",
    one_offer: "One-Offer Policy",
    dream_offer: "Dream Offer",
    standard: "Standard Policy",
  };
  return map[status] ?? status;
}

export function getTierColor(tier: string): { bg: string; text: string } {
  if (tier === "Tier-1") return { bg: "#FFF7ED", text: "#C2410C" };
  if (tier === "Tier-2") return { bg: "#FFFBEB", text: "#B45309" };
  return { bg: "#F0FDF4", text: "#15803D" };
}

export function getCGPAColor(cgpa: number): string {
  if (cgpa >= 8) return "text-green-600";
  if (cgpa >= 7) return "text-orange-500";
  return "text-red-500";
}

export function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function downloadCSV(filename: string, data: Record<string, unknown>[]): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvLines = [
    headers.join(","),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        const str = String(val ?? "");
        return str.includes(",") ? `"${str}"` : str;
      }).join(",")
    )
  ];
  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
