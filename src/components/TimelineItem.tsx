import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface TimelineItemProps {
  evaluation: {
    evaluation_date: string;
    behavior_rating: string | null;
    eating_rating: string | null;
    sleep_rating: string | null;
    social_rating: string | null;
    daily_notes: string | null;
    audio_url: string | null;
  };
}

const ratingLabels: Record<string, string> = {
  excelente: "Excelente",
  bom: "Bom",
  regular: "Regular",
  precisa_melhorar: "Precisa Melhorar",
  comeu_tudo: "Comeu Tudo",
  comeu_bem: "Comeu Bem",
  comeu_pouco: "Comeu Pouco",
  nao_comeu: "Não Comeu",
  dormiu_bem: "Dormiu Bem",
  dormiu_pouco: "Dormiu Pouco",
  nao_dormiu: "Não Dormiu",
  agitado: "Agitado",
  muito_participativo: "Muito Participativo",
  participativo: "Participativo",
  timido: "Tímido",
  isolado: "Isolado",
};

const TimelineItem = ({ evaluation }: TimelineItemProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Card className="p-6 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold">{formatDate(evaluation.evaluation_date)}</h3>
        </div>
      </div>

      <div className="space-y-3">
        {evaluation.behavior_rating && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Comportamento:</span>
            <span className="font-medium">{ratingLabels[evaluation.behavior_rating]}</span>
          </div>
        )}
        {evaluation.eating_rating && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Alimentação:</span>
            <span className="font-medium">{ratingLabels[evaluation.eating_rating]}</span>
          </div>
        )}
        {evaluation.sleep_rating && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sono:</span>
            <span className="font-medium">{ratingLabels[evaluation.sleep_rating]}</span>
          </div>
        )}
        {evaluation.social_rating && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Socialização:</span>
            <span className="font-medium">{ratingLabels[evaluation.social_rating]}</span>
          </div>
        )}

        {evaluation.daily_notes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Observações:</p>
            <p className="text-sm">{evaluation.daily_notes}</p>
          </div>
        )}

        {evaluation.audio_url && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Áudio do dia:</p>
            <audio src={evaluation.audio_url} controls className="w-full" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default TimelineItem;
