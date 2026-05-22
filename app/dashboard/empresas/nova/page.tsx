import { CompanyEditor } from "@/components/CompanyEditor";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function NovaEmpresaPage() {
  return (
    <DashboardLayout
      title="Nova empresa"
      description="Cadastre os dados que alimentam o assistente e o link publico."
    >
      <CompanyEditor />
    </DashboardLayout>
  );
}
