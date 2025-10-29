import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, History, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StudentCardProps {
  student: {
    id: string;
    name: string;
    class_name: string;
  };
  onUpdate: () => void;
}

const StudentCard = ({ student }: StudentCardProps) => {
  const navigate = useNavigate();

  return (
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
      </div>
    </Card>
  );
};

export default StudentCard;
