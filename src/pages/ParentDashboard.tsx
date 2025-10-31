import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  class_name: string;
}

interface EvaluationData {
  id: string;
  evaluation_date: string;
  behavior_rating: string | null;
  eating_rating: string | null;
  sleep_rating: string | null;
  social_rating: string | null;
  daily_notes: string | null;
}

const ParentDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isParent } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, EvaluationData[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      if (!isParent) {
        toast.error("Acesso negado: Apenas pais têm acesso a esta área");
        navigate("/");
        return;
      }
      fetchMyChildren();
    }
  }, [user, authLoading, isParent, navigate]);

  const fetchMyChildren = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar estudantes vinculados ao pai
      const { data: links, error: linksError } = await supabase
        .from("parent_student_links")
        .select(`
          student_id,
          students (
            id,
            name,
            class_name
          )
        `)
        .eq("parent_id", user.id);

      if (linksError) throw linksError;

      const childrenData = links?.map((link: any) => link.students).filter(Boolean) || [];
      setStudents(childrenData);

      // Buscar avaliações dos filhos
      const evalMap: Record<string, EvaluationData[]> = {};
      for (const child of childrenData) {
        const { data: evalData, error: evalError } = await supabase
          .from("daily_evaluations")
          .select("*")
          .eq("student_id", child.id)
          .order("evaluation_date", { ascending: false })
          .limit(5);

        if (evalError) {
          console.error("Error fetching evaluations:", evalError);
        } else {
          evalMap[child.id] = evalData || [];
        }
      }
      setEvaluations(evalMap);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: string | null) => {
    if (!rating) return "text-muted-foreground";
    switch (rating.toLowerCase()) {
      case "excelente":
      case "ótimo":
        return "text-green-600";
      case "bom":
        return "text-blue-600";
      case "regular":
        return "text-yellow-600";
      case "precisa melhorar":
        return "text-red-600";
      default:
        return "text-muted-foreground";
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Área dos Pais</h1>
          </div>
        </div>

        {students.length === 0 ? (
          <Card className="p-8 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">
              Nenhum filho vinculado à sua conta.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Entre em contato com a escola para vincular seus filhos.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {students.map((student) => (
              <Card key={student.id} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">{student.name}</h2>
                    <p className="text-sm text-muted-foreground">{student.class_name}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium text-foreground">Últimas Avaliações</h3>
                  {!evaluations[student.id] || evaluations[student.id].length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma avaliação registrada</p>
                  ) : (
                    <div className="space-y-2">
                      {evaluations[student.id].map((evaluation) => (
                        <div key={evaluation.id} className="p-3 bg-accent/50 rounded-lg">
                          <p className="text-sm font-medium text-foreground mb-2">
                            {new Date(evaluation.evaluation_date).toLocaleDateString("pt-BR")}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {evaluation.behavior_rating && (
                              <div>
                                <span className="text-muted-foreground">Comportamento: </span>
                                <span className={getRatingColor(evaluation.behavior_rating)}>
                                  {evaluation.behavior_rating}
                                </span>
                              </div>
                            )}
                            {evaluation.eating_rating && (
                              <div>
                                <span className="text-muted-foreground">Alimentação: </span>
                                <span className={getRatingColor(evaluation.eating_rating)}>
                                  {evaluation.eating_rating}
                                </span>
                              </div>
                            )}
                            {evaluation.sleep_rating && (
                              <div>
                                <span className="text-muted-foreground">Sono: </span>
                                <span className={getRatingColor(evaluation.sleep_rating)}>
                                  {evaluation.sleep_rating}
                                </span>
                              </div>
                            )}
                            {evaluation.social_rating && (
                              <div>
                                <span className="text-muted-foreground">Social: </span>
                                <span className={getRatingColor(evaluation.social_rating)}>
                                  {evaluation.social_rating}
                                </span>
                              </div>
                            )}
                          </div>
                          {evaluation.daily_notes && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              "{evaluation.daily_notes}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => navigate(`/timeline/${student.id}`)}
                >
                  Ver Histórico Completo
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;