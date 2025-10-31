import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, BookOpen, GraduationCap, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface ManagementStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalEvaluations: number;
  monthlyTrends: { month: string; evaluations: number }[];
}

const ManagementDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, canManage } = useAuth();
  const [stats, setStats] = useState<ManagementStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalEvaluations: 0,
    monthlyTrends: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      if (!canManage) {
        toast.error("Acesso negado: Apenas gestores têm acesso a este dashboard");
        navigate("/");
        return;
      }
      fetchManagementData();
    }
  }, [user, authLoading, canManage, navigate]);

  const fetchManagementData = async () => {
    try {
      setLoading(true);

      // Total de estudantes
      const { count: studentsCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      // Total de professores (users com role teacher)
      const { data: teachersData } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "teacher");

      // Total de turmas
      const { count: classesCount } = await supabase
        .from("classes")
        .select("*", { count: "exact", head: true });

      // Total de avaliações
      const { count: evaluationsCount } = await supabase
        .from("daily_evaluations")
        .select("*", { count: "exact", head: true });

      // Tendências mensais (últimos 6 meses)
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

        const { count } = await supabase
          .from("daily_evaluations")
          .select("*", { count: "exact", head: true })
          .gte("evaluation_date", monthStart)
          .lte("evaluation_date", monthEnd);

        monthlyData.push({
          month: date.toLocaleDateString("pt-BR", { month: "short" }),
          evaluations: count || 0,
        });
      }

      setStats({
        totalStudents: studentsCount || 0,
        totalTeachers: teachersData?.length || 0,
        totalClasses: classesCount || 0,
        totalEvaluations: evaluationsCount || 0,
        monthlyTrends: monthlyData,
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Dashboard - Gestão</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Alunos</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalStudents}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Professores</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalTeachers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Turmas</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalClasses}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avaliações</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalEvaluations}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Tendência de Avaliações (Últimos 6 Meses)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="evaluations" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={() => navigate("/")}>Ver Todos os Alunos</Button>
          <Button variant="outline" onClick={() => navigate("/classes")}>
            Gerenciar Turmas
          </Button>
          <Button variant="outline" onClick={() => toast.info("Em desenvolvimento")}>
            Relatórios Completos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboard;