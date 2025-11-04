import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, History, User, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
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
import { useState } from "react";

interface StudentCardProps {
  student: {
    id: string;
    name: string;
    class_name: string;
  };
  onUpdate: () => void;
}

const StudentCard = ({ student, onUpdate }: StudentCardProps) => {
  const navigate = useNavigate();
  const { canManage } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", student.id);

      if (error) throw error;

      toast.success("Aluno excluído com sucesso");
      onUpdate();
    } catch (error: any) {
      toast.error("Erro ao excluir aluno");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
    <Card className="p-6 shadow-card hover:shadow-soft transition-smooth">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-secondary flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-foreground">{student.name}</h3>
          <p className="text-sm text-muted-foreground">{student.class_name}</p>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <Button
          onClick={() => navigate(`/evaluation/${student.id}`)}
          className="flex-1 gap-2"
        >
          <ClipboardList className="w-4 h-4" />
          Avaliar Hoje
        </Button>
        <Button
          onClick={() => navigate(`/timeline/${student.id}`)}
          variant="outline"
          className="gap-2"
        >
          <History className="w-4 h-4" />
          Histórico
        </Button>
        {canManage && (
          <Button
            onClick={() => setDeleteDialogOpen(true)}
            variant="outline"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>

    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o aluno {student.name}? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default StudentCard;
