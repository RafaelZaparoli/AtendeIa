import type { ReactNode } from "react";
import { DashboardAuthGate } from "@/components/DashboardAuthGate";

export default function DashboardRouteLayout({
  children
}: {
  children: ReactNode;
}) {
  return <DashboardAuthGate>{children}</DashboardAuthGate>;
}
