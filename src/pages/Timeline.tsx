import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar } from "lucide-react";
import { toast } from "sonner";
import TimelineItem from "@/components/TimelineItem";

interface Student {
  id: string;
  name: string;
  class_name: string;
}

interface Evaluation {
  id: string;
  evaluation_date: string;
  behavior_rating: string | null;
  eating_rating: string | null;
  sleep_rating: string | null;
  social_rating: string | null;
  daily_notes: string | null;
  audio_url: string | null;
}

const Timeline = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    try {
      const [studentRes, evaluationsRes] = await Promise.all([
        supabase.from("students").select("*").eq("id", studentId).single(),
        supabase
          .from("daily_evaluations")
          .select("*")
          .eq("student_id", studentId)
          .order("evaluation_date", { ascending: false }),
      ]);

      if (studentRes.error) throw studentRes.error;
      if (evaluationsRes.error) throw evaluationsRes.error;

      setStudent(studentRes.data);
      setEvaluations(evaluationsRes.data || []);
    } catch (error) {
      toast.error("Erro ao carregar dados");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background pb-8">
      <header className="bg-card shadow-soft sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{student?.name}</h1>
              <p className="text-sm text-muted-foreground">
                Histórico de Avaliações - {student?.class_name}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {evaluations.length === 0 ? (
          <Card className="p-12 text-center shadow-card">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Nenhuma avaliação ainda</h2>
            <p className="text-muted-foreground mb-6">
              Comece a avaliar este aluno para ver o histórico aqui
            </p>
            <Button onClick={() => navigate(`/evaluation/${studentId}`)}>
              Fazer Primeira Avaliação
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <TimelineItem key={evaluation.id} evaluation={evaluation} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Timeline;
