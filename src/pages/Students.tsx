import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, LogOut, Users, FileText, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import StudentCard from "@/components/StudentCard";
import AddStudentDialog from "@/components/AddStudentDialog";

interface Student {
  id: string;
  name: string;
  class_name: string;
}

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const navigate = useNavigate();
  const { loading: authLoading, user, profile } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else {
        fetchStudents();
      }
    }
  }, [authLoading, user, navigate]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("name");

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card shadow-soft sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Meus Alunos</h1>
              <p className="text-sm text-muted-foreground">
                {profile?.full_name || profile?.email || "Usuário"} • {students.length} alunos
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/classes")}>
              <BookOpen className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando alunos...</p>
            </div>
          </div>
        ) : students.length === 0 ? (
          <Card className="p-12 text-center shadow-card">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Nenhum aluno cadastrado</h2>
            <p className="text-muted-foreground mb-6">
              Adicione seu primeiro aluno para começar a fazer avaliações diárias
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Primeiro Aluno
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {students.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onUpdate={fetchStudents}
                />
              ))}
            </div>
            
            <Button
              onClick={() => setShowAddDialog(true)}
              size="lg"
              className="fixed bottom-6 right-6 shadow-soft h-14 w-14 rounded-full p-0"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </>
        )}
      </main>

      <AddStudentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchStudents}
      />
    </div>
  );
};

export default Students;
