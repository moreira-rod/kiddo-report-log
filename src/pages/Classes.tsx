import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, LogOut, BookOpen, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import ClassCard from "@/components/ClassCard";
import AddClassDialog from "@/components/AddClassDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Class {
  id: string;
  name: string;
  description: string | null;
  school_year: string | null;
}

const Classes = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const navigate = useNavigate();
  const { loading: authLoading, isTeacher, isAdmin } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (!isTeacher && !isAdmin) {
        toast.error("Acesso negado");
        navigate("/");
      } else {
        fetchClasses();
      }
    }
  }, [authLoading, isTeacher, isAdmin, navigate]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("name");

      if (error) throw error;
      setClasses(data || []);

      // Fetch student counts for each class
      if (data && data.length > 0) {
        const counts: Record<string, number> = {};
        await Promise.all(
          data.map(async (cls) => {
            const { count } = await supabase
              .from("students")
              .select("*", { count: "exact", head: true })
              .eq("class_id", cls.id);
            counts[cls.id] = count || 0;
          })
        );
        setStudentCounts(counts);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar turmas");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleDeleteClass = async () => {
    if (!classToDelete) return;

    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", classToDelete);

      if (error) throw error;

      toast.success("Turma excluída com sucesso");
      fetchClasses();
    } catch (error: any) {
      toast.error("Erro ao excluir turma");
    } finally {
      setDeleteDialogOpen(false);
      setClassToDelete(null);
    }
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Turmas</h1>
              <p className="text-sm text-muted-foreground">{classes.length} turmas cadastradas</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {classes.length === 0 ? (
          <Card className="p-12 text-center shadow-card">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Nenhuma turma cadastrada</h2>
            <p className="text-muted-foreground mb-6">
              Crie sua primeira turma para organizar seus alunos
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Primeira Turma
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {classes.map((cls) => (
                <ClassCard
                  key={cls.id}
                  classData={cls}
                  studentCount={studentCounts[cls.id] || 0}
                  onEdit={() => {
                    // TODO: Implement edit functionality
                    toast.info("Funcionalidade em desenvolvimento");
                  }}
                  onDelete={() => {
                    setClassToDelete(cls.id);
                    setDeleteDialogOpen(true);
                  }}
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

      <AddClassDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchClasses}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta turma? Os alunos não serão excluídos, apenas desvinculados da turma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Classes;
