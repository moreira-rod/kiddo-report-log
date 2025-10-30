import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface AddClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddClassDialog = ({ open, onOpenChange, onSuccess }: AddClassDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Nome da turma é obrigatório");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { error } = await supabase.from("classes").insert({
        name: name.trim(),
        description: description.trim() || null,
        school_year: schoolYear.trim() || null,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Turma criada com sucesso!");
      setName("");
      setDescription("");
      setSchoolYear("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating class:", error);
      toast.error("Erro ao criar turma");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Turma</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Turma *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: 5º Ano A"
              required
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional da turma"
              maxLength={500}
            />
          </div>
          <div>
            <Label htmlFor="schoolYear">Ano Letivo</Label>
            <Input
              id="schoolYear"
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              placeholder="Ex: 2025"
              maxLength={20}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Criando..." : "Criar Turma"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClassDialog;
