import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, LogOut, GraduationCap, BarChart, Heart, Shield, UserCheck, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HierarchyData {
  directors?: any[];
  coordinators?: any[];
  teachers?: any[];
  classes?: any[];
  students?: any[];
}

const Index = () => {
  const navigate = useNavigate();
  const { loading, user, profile, isTeacher, isParent, canManage, isAdmin, isDirector, isCoordinator } = useAuth();
  const [hierarchyData, setHierarchyData] = useState<HierarchyData>({});
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user) {
      fetchHierarchyData();
    }
  }, [loading, user, navigate, isAdmin, isDirector, isCoordinator]);

  const fetchHierarchyData = async () => {
    try {
      setDataLoading(true);

      if (isAdmin) {
        // Admin vê tudo
        const [directorsRes, coordinatorsRes, teachersRes, classesRes, studentsRes] = await Promise.all([
          supabase.from("user_roles").select("user_id").eq("role", "director"),
          supabase.from("user_roles").select("user_id").eq("role", "coordinator"),
          supabase.from("user_roles").select("user_id").eq("role", "teacher"),
          supabase.from("classes").select("*"),
          supabase.from("students").select("*")
        ]);

        const directorIds = directorsRes.data?.map(r => r.user_id) || [];
        const coordinatorIds = coordinatorsRes.data?.map(r => r.user_id) || [];
        const teacherIds = teachersRes.data?.map(r => r.user_id) || [];

        const [directorProfiles, coordinatorProfiles, teacherProfiles] = await Promise.all([
          supabase.from("profiles").select("*").in("id", directorIds),
          supabase.from("profiles").select("*").in("id", coordinatorIds),
          supabase.from("profiles").select("*").in("id", teacherIds)
        ]);

        setHierarchyData({
          directors: directorProfiles.data || [],
          coordinators: coordinatorProfiles.data || [],
          teachers: teacherProfiles.data || [],
          classes: classesRes.data || [],
          students: studentsRes.data || []
        });
      } else if (isDirector) {
        // Diretor vê seus coordenadores
        const { data: coordinatorProfiles } = await supabase
          .from("profiles")
          .select("*")
          .eq("managed_by", user?.id);

        setHierarchyData({
          coordinators: coordinatorProfiles || []
        });
      } else if (isCoordinator) {
        // Coordenador vê seus professores
        const { data: teacherProfiles } = await supabase
          .from("profiles")
          .select("*")
          .eq("managed_by", user?.id);

        const teacherIds = teacherProfiles?.map(t => t.id) || [];
        const { data: classes } = await supabase
          .from("classes")
          .select("*")
          .in("teacher_id", teacherIds);

        setHierarchyData({
          teachers: teacherProfiles || [],
          classes: classes || []
        });
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading || dataLoading) {
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

  const renderAdminView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Diretores ({hierarchyData.directors?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hierarchyData.directors?.map((director) => (
              <Card key={director.id} className="p-4">
                <p className="font-medium">{director.full_name || director.email}</p>
                <p className="text-sm text-muted-foreground">{director.email}</p>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Coordenadores ({hierarchyData.coordinators?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hierarchyData.coordinators?.map((coordinator) => (
              <Card key={coordinator.id} className="p-4">
                <p className="font-medium">{coordinator.full_name || coordinator.email}</p>
                <p className="text-sm text-muted-foreground">{coordinator.email}</p>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Professores ({hierarchyData.teachers?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hierarchyData.teachers?.map((teacher) => (
              <Card key={teacher.id} className="p-4">
                <p className="font-medium">{teacher.full_name || teacher.email}</p>
                <p className="text-sm text-muted-foreground">{teacher.email}</p>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Turmas ({hierarchyData.classes?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hierarchyData.classes?.map((cls) => (
              <Card key={cls.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/classes")}>
                <p className="font-medium">{cls.name}</p>
                {cls.description && <p className="text-sm text-muted-foreground">{cls.description}</p>}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Alunos ({hierarchyData.students?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/students")}>Ver todos os alunos</Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderDirectorView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Meus Coordenadores ({hierarchyData.coordinators?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hierarchyData.coordinators?.length === 0 ? (
            <p className="text-muted-foreground">Nenhum coordenador vinculado.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hierarchyData.coordinators?.map((coordinator) => (
                <Card key={coordinator.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/admin/hierarchy")}>
                  <p className="font-medium">{coordinator.full_name || coordinator.email}</p>
                  <p className="text-sm text-muted-foreground">{coordinator.email}</p>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCoordinatorView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Meus Professores ({hierarchyData.teachers?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hierarchyData.teachers?.length === 0 ? (
            <p className="text-muted-foreground">Nenhum professor vinculado.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hierarchyData.teachers?.map((teacher) => (
                <Card key={teacher.id} className="p-4">
                  <p className="font-medium">{teacher.full_name || teacher.email}</p>
                  <p className="text-sm text-muted-foreground">{teacher.email}</p>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Turmas:</p>
                    {hierarchyData.classes?.filter(c => c.teacher_id === teacher.id).map(cls => (
                      <div key={cls.id} className="text-sm mb-1">• {cls.name}</div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <MoreVertical className="w-4 h-4" />
                Opções
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card z-50">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name || "Usuário"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.email || user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canManage && (
                <DropdownMenuItem onClick={() => navigate("/students")}>
                  <Users className="w-4 h-4 mr-2" />
                  Cadastro de Alunos
                </DropdownMenuItem>
              )}
              {(isTeacher || canManage) && (
                <DropdownMenuItem onClick={() => navigate("/classes")}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Turmas
                </DropdownMenuItem>
              )}
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            {isAdmin ? "Visão Geral" : isDirector ? "Meus Coordenadores" : isCoordinator ? "Meus Professores" : "Dashboard"}
          </h2>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Visão completa de toda a organização" 
              : isDirector 
              ? "Gerencie seus coordenadores e acompanhe seus professores" 
              : isCoordinator 
              ? "Gerencie seus professores e suas turmas"
              : "Gerencie alunos, turmas e avaliações comportamentais"}
          </p>
        </div>

        {isAdmin ? renderAdminView() : isDirector ? renderDirectorView() : isCoordinator ? renderCoordinatorView() : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(isTeacher || canManage) && (
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
            )}

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
        )}
      </main>
    </div>
  );
};

export default Index;
