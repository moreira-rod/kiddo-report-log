import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, BookOpen, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface DashboardStats {
  totalStudents: number;
  totalClasses: number;
  evaluationsThisWeek: number;
  behaviorStats: { rating: string; count: number }[];
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isTeacher } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalClasses: 0,
    evaluationsThisWeek: 0,
    behaviorStats: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      if (!isTeacher) {
        toast.error("Acesso negado: Apenas professores têm acesso a este dashboard");
        navigate("/");
        return;
      }
      fetchDashboardData();
    }
  }, [user, authLoading, isTeacher, navigate]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Total de estudantes
      const { count: studentsCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id);

      // Total de turmas
      const { count: classesCount } = await supabase
        .from("classes")
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id);

      // Avaliações desta semana
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: myStudents } = await supabase
        .from("students")
        .select("id")
        .eq("created_by", user.id);

      const studentIds = myStudents?.map(s => s.id) || [];

      let weekEvalCount = 0;
      if (studentIds.length > 0) {
        const { count } = await supabase
          .from("daily_evaluations")
          .select("*", { count: "exact", head: true })
          .in("student_id", studentIds)
          .gte("evaluation_date", weekAgo.toISOString());
        weekEvalCount = count || 0;
      }

      // Estatísticas de comportamento
      let behaviorData: { rating: string; count: number }[] = [];
      if (studentIds.length > 0) {
        const { data: evalData } = await supabase
          .from("daily_evaluations")
          .select("behavior_rating")
          .in("student_id", studentIds)
          .not("behavior_rating", "is", null);

        const ratingCounts: Record<string, number> = {};
        evalData?.forEach((e) => {
          if (e.behavior_rating) {
            ratingCounts[e.behavior_rating] = (ratingCounts[e.behavior_rating] || 0) + 1;
          }
        });

        behaviorData = Object.entries(ratingCounts).map(([rating, count]) => ({
          rating,
          count,
        }));
      }

      setStats({
        totalStudents: studentsCount || 0,
        totalClasses: classesCount || 0,
        evaluationsThisWeek: weekEvalCount,
        behaviorStats: behaviorData,
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
            <h1 className="text-3xl font-bold text-foreground">Dashboard - Professor</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Turmas</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalClasses}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avaliações (7 dias)</p>
                <p className="text-2xl font-bold text-foreground">{stats.evaluationsThisWeek}</p>
              </div>
            </div>
          </Card>
        </div>

        {stats.behaviorStats.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Distribuição de Comportamento
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.behaviorStats}
                  dataKey="count"
                  nameKey="rating"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {stats.behaviorStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={() => navigate("/")}>Ver Alunos</Button>
          <Button variant="outline" onClick={() => navigate("/classes")}>
            Gerenciar Turmas
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;