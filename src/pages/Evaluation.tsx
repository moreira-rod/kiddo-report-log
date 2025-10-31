import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import EvaluationOption from "@/components/EvaluationOption";
import AudioRecorder from "@/components/AudioRecorder";

interface Student {
  id: string;
  name: string;
  class_name: string;
}

const Evaluation = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { loading: authLoading, isTeacher, isAdmin } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [behaviorRating, setBehaviorRating] = useState("");
  const [eatingRating, setEatingRating] = useState("");
  const [sleepRating, setSleepRating] = useState("");
  const [socialRating, setSocialRating] = useState("");
  const [dailyNotes, setDailyNotes] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (!isTeacher && !isAdmin) {
        toast.error("Acesso negado");
        navigate("/");
      } else {
        fetchStudent();
        fetchTodayEvaluation();
      }
    }
  }, [studentId, authLoading, isTeacher, isAdmin]);

  const fetchStudent = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();

      if (error) throw error;
      setStudent(data);
    } catch (error) {
      toast.error("Erro ao carregar aluno");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayEvaluation = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("daily_evaluations")
        .select("*")
        .eq("student_id", studentId)
        .eq("evaluation_date", today)
        .maybeSingle();

      if (data) {
        setBehaviorRating(data.behavior_rating || "");
        setEatingRating(data.eating_rating || "");
        setSleepRating(data.sleep_rating || "");
        setSocialRating(data.social_rating || "");
        setDailyNotes(data.daily_notes || "");
        setAudioUrl(data.audio_url || "");
      }
    } catch (error) {
      console.error("Erro ao carregar avaliação:", error);
    }
  };

  const handleSave = async () => {
    if (!student) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const today = new Date().toISOString().split("T")[0];

      const evaluationData = {
        student_id: student.id,
        evaluation_date: today,
        behavior_rating: behaviorRating || null,
        eating_rating: eatingRating || null,
        sleep_rating: sleepRating || null,
        social_rating: socialRating || null,
        daily_notes: dailyNotes || null,
        audio_url: audioUrl || null,
        created_by: user?.id,
      };

      const { error } = await supabase
        .from("daily_evaluations")
        .upsert(evaluationData, {
          onConflict: "student_id,evaluation_date",
        });

      if (error) throw error;

      toast.success("Avaliação salva com sucesso!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar avaliação");
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-gradient-background pb-20">
      <header className="bg-card shadow-soft sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{student?.name}</h1>
            <p className="text-sm text-muted-foreground">{student?.class_name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 shadow-card space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Comportamento Geral</h2>
            <div className="grid grid-cols-2 gap-3">
              <EvaluationOption
                label="Excelente"
                emoji="😊"
                selected={behaviorRating === "excelente"}
                onClick={() => setBehaviorRating("excelente")}
                color="secondary"
              />
              <EvaluationOption
                label="Bom"
                emoji="🙂"
                selected={behaviorRating === "bom"}
                onClick={() => setBehaviorRating("bom")}
                color="primary"
              />
              <EvaluationOption
                label="Regular"
                emoji="😐"
                selected={behaviorRating === "regular"}
                onClick={() => setBehaviorRating("regular")}
                color="accent"
              />
              <EvaluationOption
                label="Precisa Melhorar"
                emoji="😟"
                selected={behaviorRating === "precisa_melhorar"}
                onClick={() => setBehaviorRating("precisa_melhorar")}
                color="coral"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Alimentação</h2>
            <div className="grid grid-cols-2 gap-3">
              <EvaluationOption
                label="Comeu Tudo"
                emoji="🍽️"
                selected={eatingRating === "comeu_tudo"}
                onClick={() => setEatingRating("comeu_tudo")}
                color="secondary"
              />
              <EvaluationOption
                label="Comeu Bem"
                emoji="😋"
                selected={eatingRating === "comeu_bem"}
                onClick={() => setEatingRating("comeu_bem")}
                color="primary"
              />
              <EvaluationOption
                label="Comeu Pouco"
                emoji="🥄"
                selected={eatingRating === "comeu_pouco"}
                onClick={() => setEatingRating("comeu_pouco")}
                color="accent"
              />
              <EvaluationOption
                label="Não Comeu"
                emoji="😔"
                selected={eatingRating === "nao_comeu"}
                onClick={() => setEatingRating("nao_comeu")}
                color="coral"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Sono</h2>
            <div className="grid grid-cols-2 gap-3">
              <EvaluationOption
                label="Dormiu Bem"
                emoji="😴"
                selected={sleepRating === "dormiu_bem"}
                onClick={() => setSleepRating("dormiu_bem")}
                color="secondary"
              />
              <EvaluationOption
                label="Dormiu Pouco"
                emoji="🥱"
                selected={sleepRating === "dormiu_pouco"}
                onClick={() => setSleepRating("dormiu_pouco")}
                color="primary"
              />
              <EvaluationOption
                label="Não Dormiu"
                emoji="😪"
                selected={sleepRating === "nao_dormiu"}
                onClick={() => setSleepRating("nao_dormiu")}
                color="accent"
              />
              <EvaluationOption
                label="Agitado"
                emoji="🤯"
                selected={sleepRating === "agitado"}
                onClick={() => setSleepRating("agitado")}
                color="coral"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Socialização</h2>
            <div className="grid grid-cols-2 gap-3">
              <EvaluationOption
                label="Muito Participativo"
                emoji="🤗"
                selected={socialRating === "muito_participativo"}
                onClick={() => setSocialRating("muito_participativo")}
                color="secondary"
              />
              <EvaluationOption
                label="Participativo"
                emoji="😊"
                selected={socialRating === "participativo"}
                onClick={() => setSocialRating("participativo")}
                color="primary"
              />
              <EvaluationOption
                label="Tímido"
                emoji="😳"
                selected={socialRating === "timido"}
                onClick={() => setSocialRating("timido")}
                color="accent"
              />
              <EvaluationOption
                label="Isolado"
                emoji="😞"
                selected={socialRating === "isolado"}
                onClick={() => setSocialRating("isolado")}
                color="coral"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações do Dia</Label>
            <Textarea
              id="notes"
              placeholder="Escreva como foi o dia do aluno..."
              value={dailyNotes}
              onChange={(e) => setDailyNotes(e.target.value)}
              rows={4}
              className="transition-smooth"
            />
          </div>

          <AudioRecorder
            studentId={student?.id || ""}
            onAudioSaved={(url) => setAudioUrl(url)}
            existingAudioUrl={audioUrl}
          />
        </Card>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 text-lg gap-2"
          size="lg"
        >
          <Save className="w-5 h-5" />
          {saving ? "Salvando..." : "Salvar Avaliação"}
        </Button>
      </main>
    </div>
  );
};

export default Evaluation;
