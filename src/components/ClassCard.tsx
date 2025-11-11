import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Pencil, Trash2, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ClassCardProps {
  classData: {
    id: string;
    name: string;
    description: string | null;
    school_year: string | null;
    teacher_name?: string | null;
  };
  studentCount: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ClassCard = ({ classData, studentCount, onEdit, onDelete }: ClassCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="p-6 shadow-card hover:shadow-soft transition-smooth">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-foreground">{classData.name}</h3>
          {classData.description && (
            <p className="text-sm text-muted-foreground mt-1">{classData.description}</p>
          )}
          {classData.school_year && (
            <p className="text-xs text-muted-foreground mt-1">Ano: {classData.school_year}</p>
          )}
          {classData.teacher_name && (
            <div className="flex items-center gap-2 mt-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground font-medium">{classData.teacher_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{studentCount} alunos</span>
          </div>
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="mt-6 flex gap-2">
          {onEdit && (
            <Button onClick={onEdit} variant="outline" size="sm" className="gap-2">
              <Pencil className="w-3 h-3" />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button onClick={onDelete} variant="outline" size="sm" className="gap-2">
              <Trash2 className="w-3 h-3" />
              Excluir
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export default ClassCard;
