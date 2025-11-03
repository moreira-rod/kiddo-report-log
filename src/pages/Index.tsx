import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Users, LogOut, GraduationCap, BarChart, Heart, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { loading, user, profile, isTeacher, isParent, canManage, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card shadow-soft sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">EduTrack</h1>
              <p className="text-sm text-muted-foreground">
                Olá, {profile?.full_name || profile?.email}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">
            Gerencie alunos, turmas e avaliações comportamentais
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 shadow-card hover:shadow-soft transition-smooth cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-secondary flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground mb-2">Alunos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Visualize e gerencie seus alunos, faça avaliações diárias
                </p>
                <Button className="w-full">Acessar Alunos</Button>
              </div>
            </div>
          </Card>

          {(isTeacher || canManage) && (
            <>
              <Card className="p-6 shadow-card hover:shadow-soft transition-smooth cursor-pointer" onClick={() => navigate("/classes")}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground mb-2">Turmas</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Organize seus alunos em turmas
                    </p>
                    <Button className="w-full">Acessar Turmas</Button>
                  </div>
                </div>
              </Card>

              {isTeacher && (
                <Card className="p-6 shadow-card hover:shadow-soft transition-smooth cursor-pointer" onClick={() => navigate("/teacher-dashboard")}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <BarChart className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground mb-2">Dashboard Professor</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Estatísticas e insights dos seus alunos
                      </p>
                      <Button className="w-full">Ver Dashboard</Button>
                    </div>
                  </div>
                </Card>
              )}

              {canManage && (
                <Card className="p-6 shadow-card hover:shadow-soft transition-smooth cursor-pointer" onClick={() => navigate("/management-dashboard")}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <BarChart className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground mb-2">Dashboard Gestão</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Visão geral completa da escola
                      </p>
                      <Button className="w-full">Ver Dashboard</Button>
                    </div>
                  </div>
                </Card>
              )}

              {isAdmin && (
                <Card className="p-6 shadow-card hover:shadow-soft transition-smooth cursor-pointer" onClick={() => navigate("/admin")}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground mb-2">Console Admin</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Gerenciar usuários e permissões
                      </p>
                      <Button className="w-full">Acessar Console</Button>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}

          {isParent && (
            <Card className="p-6 shadow-card hover:shadow-soft transition-smooth cursor-pointer" onClick={() => navigate("/parent-dashboard")}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground mb-2">Meus Filhos</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Acompanhe o desenvolvimento dos seus filhos
                  </p>
                  <Button className="w-full">Acessar Área dos Pais</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
