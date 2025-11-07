import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddStudentDialog = ({ open, onOpenChange, onSuccess }: AddStudentDialogProps) => {
  const [name, setName] = useState("");
  const [classId, setClassId] = useState<string>("");
  const [teacherId, setTeacherId] = useState<string>("");
  const [parentIds, setParentIds] = useState<string[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [parents, setParents] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchClasses();
      fetchTeachers();
      fetchParents();
    }
  }, [open]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, profiles(id, full_name, email)")
        .eq("role", "teacher");

      if (error) throw error;
      
      const teacherList = data
        ?.map((item: any) => ({
          id: item.profiles?.id,
          full_name: item.profiles?.full_name || item.profiles?.email,
          email: item.profiles?.email
        }))
        .filter(t => t.id) || [];
      
      setTeachers(teacherList);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const fetchParents = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, profiles(id, full_name, email)")
        .eq("role", "parent");

      if (error) throw error;
      
      const parentList = data
        ?.map((item: any) => ({
          id: item.profiles?.id,
          full_name: item.profiles?.full_name || item.profiles?.email,
          email: item.profiles?.email
        }))
        .filter(p => p.id) || [];
      
      setParents(parentList);
    } catch (error) {
      console.error("Error fetching parents:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !classId) {
      toast.error("Por favor, preencha o nome e selecione uma turma");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Get class name from selected class
      const selectedClass = classes.find(c => c.id === classId);
      if (!selectedClass) {
        toast.error("Turma não encontrada");
        return;
      }

      // Insert student
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .insert({
          name: name.trim(),
          class_name: selectedClass.name,
          class_id: classId,
          teacher_id: teacherId || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (studentError) throw studentError;

      // Link parents
      if (parentIds.length > 0 && studentData) {
        const parentLinks = parentIds.map(parentId => ({
          student_id: studentData.id,
          parent_id: parentId,
          created_by: user.id
        }));

        const { error: linkError } = await supabase
          .from("parent_student_links")
          .insert(parentLinks);

        if (linkError) {
          console.error("Error linking parents:", linkError);
          toast.error("Aluno criado, mas erro ao vincular pais");
        }
      }

      toast.success("Aluno adicionado com sucesso!");
      setName("");
      setClassId("");
      setTeacherId("");
      setParentIds([]);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error adding student:", error);
      toast.error("Erro ao adicionar aluno");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Aluno</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Aluno *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do aluno"
              required
              maxLength={100}
            />
          </div>
          
          <div>
            <Label htmlFor="classId">Turma *</Label>
            <Select value={classId} onValueChange={setClassId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma turma" />
              </SelectTrigger>
              <SelectContent>
                {classes.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhuma turma cadastrada
                  </div>
                ) : (
                  classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {classes.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Cadastre uma turma primeiro na página de Turmas
              </p>
            )}
          </div>

          {teachers.length > 0 && (
            <div>
              <Label htmlFor="teacherId">Professor Responsável (opcional)</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um professor" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {parents.length > 0 && (
            <div>
              <Label>Vincular Pais/Responsáveis (opcional)</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {parents.map((parent) => (
                  <label key={parent.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={parentIds.includes(parent.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setParentIds([...parentIds, parent.id]);
                        } else {
                          setParentIds(parentIds.filter(id => id !== parent.id));
                        }
                      }}
                      className="rounded border-input"
                    />
                    <span className="text-sm">{parent.full_name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading || classes.length === 0} className="w-full">
            {loading ? "Adicionando..." : "Adicionar Aluno"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentDialog;
