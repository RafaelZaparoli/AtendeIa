"use client";

import { useParams } from "next/navigation";
import { CompanyEditor } from "@/components/CompanyEditor";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function EditarEmpresaPage() {
  const params = useParams<{ id: string }>();

  return (
    <DashboardLayout
      title="Editar empresa"
      description="Atualize cadastro, informacoes do assistente e link publico."
    >
      <CompanyEditor companyId={params.id} />
    </DashboardLayout>
  );
}
