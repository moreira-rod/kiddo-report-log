import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Teacher {
  id: string;
  full_name: string | null;
  email: string;
}

interface Coordinator {
  id: string;
  full_name: string | null;
  email: string;
}

interface AddClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddClassDialog = ({ open, onOpenChange, onSuccess }: AddClassDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [teacherId, setTeacherId] = useState<string>("");
  const [coordinatorId, setCoordinatorId] = useState<string>("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTeachers();
      fetchCoordinators();
    }
  }, [open]);

  const fetchTeachers = async () => {
    try {
      // Get all teachers
      const { data: teacherRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "teacher");

      const teacherIds = teacherRoles?.map(r => r.user_id) || [];

      if (teacherIds.length === 0) {
        setTeachers([]);
        return;
      }

      // Get teacher profiles
      const { data: teacherProfiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", teacherIds);

      setTeachers(teacherProfiles || []);
    } catch (error: any) {
      console.error("Error fetching teachers:", error);
    }
  };

  const fetchCoordinators = async () => {
    try {
      // Get all coordinators
      const { data: coordinatorRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "coordinator");

      const coordinatorIds = coordinatorRoles?.map(r => r.user_id) || [];

      if (coordinatorIds.length === 0) {
        setCoordinators([]);
        return;
      }

      // Get coordinator profiles
      const { data: coordinatorProfiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", coordinatorIds);

      setCoordinators(coordinatorProfiles || []);
    } catch (error: any) {
      console.error("Error fetching coordinators:", error);
    }
  };

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
        teacher_id: teacherId || null,
        coordinator_id: coordinatorId || null,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Turma criada com sucesso!");
      setName("");
      setDescription("");
      setSchoolYear("");
      setTeacherId("");
      setCoordinatorId("");
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
          <div>
            <Label htmlFor="coordinator">Coordenador Responsável</Label>
            <Select value={coordinatorId} onValueChange={setCoordinatorId}>
              <SelectTrigger id="coordinator">
                <SelectValue placeholder="Selecione um coordenador (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {coordinators.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum coordenador cadastrado
                  </SelectItem>
                ) : (
                  coordinators.map((coordinator) => (
                    <SelectItem key={coordinator.id} value={coordinator.id}>
                      {coordinator.full_name || coordinator.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="teacher">Professor Responsável *</Label>
            <Select value={teacherId} onValueChange={setTeacherId} required>
              <SelectTrigger id="teacher">
                <SelectValue placeholder="Selecione um professor" />
              </SelectTrigger>
              <SelectContent>
                {teachers.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum professor cadastrado
                  </SelectItem>
                ) : (
                  teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name || teacher.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading || !teacherId} className="w-full">
            {loading ? "Criando..." : "Criar Turma"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClassDialog;
