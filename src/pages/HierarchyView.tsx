import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, BookOpen, GraduationCap, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface Coordinator {
  id: string;
  full_name: string | null;
  email: string;
  teachers: Teacher[];
}

interface Teacher {
  id: string;
  full_name: string | null;
  email: string;
  classes: Class[];
}

interface Class {
  id: string;
  name: string;
  studentsCount: number;
  teacherName?: string | null;
}

const HierarchyView = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, isDirector } = useAuth();
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      if (!isAdmin && !isDirector) {
        toast.error("Acesso negado: Apenas administradores e diretores têm acesso");
        navigate("/");
        return;
      }
      fetchHierarchy();
    }
  }, [user, authLoading, isAdmin, isDirector, navigate]);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);

      // Get all coordinators
      const { data: coordinatorRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "coordinator");

      const coordinatorIds = coordinatorRoles?.map(r => r.user_id) || [];

      if (coordinatorIds.length === 0) {
        setCoordinators([]);
        return;
      }

      // Get coordinator profiles
      const { data: coordinatorProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", coordinatorIds);

      // Get all teachers managed by these coordinators
      const { data: teacherProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("managed_by", coordinatorIds);

      const teacherIds = teacherProfiles?.map(t => t.id) || [];

      // Get classes for these teachers
      const { data: classes } = await supabase
        .from("classes")
        .select("*")
        .or(`created_by.in.(${teacherIds.join(",")}),managed_by.in.(${teacherIds.join(",")}),teacher_id.in.(${teacherIds.join(",")})`);

      // Get student counts for each class
      const classIds = classes?.map(c => c.id) || [];
      const { data: students } = await supabase
        .from("students")
        .select("id, class_id")
        .in("class_id", classIds);

      // Build hierarchy
      const hierarchy: Coordinator[] = (coordinatorProfiles || []).map(coord => {
        const coordTeachers = (teacherProfiles || [])
          .filter(t => t.managed_by === coord.id)
          .map(teacher => {
            const teacherClasses = (classes || [])
              .filter(c => c.created_by === teacher.id || c.managed_by === teacher.id || c.teacher_id === teacher.id)
              .map(cls => ({
                id: cls.id,
                name: cls.name,
                studentsCount: (students || []).filter(s => s.class_id === cls.id).length,
                teacherName: teacher.full_name || teacher.email
              }));

            return {
              id: teacher.id,
              full_name: teacher.full_name,
              email: teacher.email,
              classes: teacherClasses
            };
          });

        return {
          id: coord.id,
          full_name: coord.full_name,
          email: coord.email,
          teachers: coordTeachers
        };
      });

      setCoordinators(hierarchy);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Erro ao carregar hierarquia");
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
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Hierarquia Organizacional</h1>
          </div>
        </div>

        {coordinators.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum coordenador encontrado no sistema.</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {coordinators.map((coordinator) => (
              <Card key={coordinator.id} className="overflow-hidden">
                <CardHeader className="bg-primary/5 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <UserCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {coordinator.full_name || coordinator.email}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Coordenador</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {coordinator.teachers.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      Nenhum professor vinculado a este coordenador.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {coordinator.teachers.map((teacher) => (
                        <Card key={teacher.id} className="border-2 hover:border-primary/50 transition-colors">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-secondary/50 rounded">
                                <GraduationCap className="w-4 h-4 text-secondary-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm truncate">
                                  {teacher.full_name || teacher.email}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">Professor</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {teacher.classes.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Sem turmas</p>
                            ) : (
                              <div className="space-y-2">
                                {teacher.classes.map((cls) => (
                                  <div
                                    key={cls.id}
                                    className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <BookOpen className="w-3 h-3 text-muted-foreground" />
                                      <span className="font-medium">{cls.name}</span>
                                    </div>
                                    <span className="text-muted-foreground">
                                      {cls.studentsCount} aluno{cls.studentsCount !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HierarchyView;
