import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EvaluationOptionProps {
  label: string;
  emoji: string;
  selected: boolean;
  onClick: () => void;
  color: "primary" | "secondary" | "accent" | "coral";
}

const EvaluationOption = ({ label, emoji, selected, onClick, color }: EvaluationOptionProps) => {
  const colorClasses = {
    primary: "border-primary bg-primary/10 text-primary",
    secondary: "border-secondary bg-secondary/10 text-secondary",
    accent: "border-accent bg-accent/10 text-accent-foreground",
    coral: "border-coral bg-coral/10 text-coral",
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-auto py-4 flex-col gap-2 transition-smooth",
        selected && colorClasses[color]
      )}
    >
      <span className="text-3xl">{emoji}</span>
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
};

export default EvaluationOption;
