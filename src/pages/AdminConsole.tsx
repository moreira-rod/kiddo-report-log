import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Edit, Shield } from "lucide-react";
import { toast } from "sonner";

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  roles: string[];
}

const AVAILABLE_ROLES = ["admin", "teacher", "parent", "director", "coordinator", "student"];

const AdminConsole = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  
  // Create user form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState("parent");
  
  // Edit roles form
  const [editRoles, setEditRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      if (!isAdmin) {
        toast.error("Acesso negado: Apenas administradores têm acesso");
        navigate("/");
        return;
      }
      fetchUsers();
    }
  }, [user, authLoading, isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Get current user's roles
      const { data: currentUserRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id);

      const roles = currentUserRoles?.map(r => r.role) || [];
      const isAdminUser = roles.includes("admin");
      const isDirector = roles.includes("director");
      const isCoordinator = roles.includes("coordinator");

      let profilesQuery = supabase
        .from("profiles")
        .select("*")
        .order("email");

      // Filter profiles based on hierarchy
      if (!isAdminUser) {
        if (isCoordinator && !isDirector) {
          // Coordinators see only users they manage
          profilesQuery = profilesQuery.or(`managed_by.eq.${currentUser.id},id.eq.${currentUser.id}`);
        } else if (isDirector) {
          // Directors see coordinators they manage and teachers under those coordinators
          const { data: managedCoordinators } = await supabase
            .from("profiles")
            .select("id")
            .eq("managed_by", currentUser.id);

          const coordinatorIds = managedCoordinators?.map(c => c.id) || [];
          const managedByClause = coordinatorIds.length > 0 
            ? [currentUser.id, ...coordinatorIds]
            : [currentUser.id];
          
          profilesQuery = profilesQuery.or(`managed_by.in.(${managedByClause.join(",")}),id.eq.${currentUser.id}`);
        }
      }

      const { data: profiles, error: profilesError } = await profilesQuery;

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserData[] = (profiles || []).map((profile) => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        roles: rolesData?.filter((r) => r.user_id === profile.id).map((r) => r.role) || [],
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword) {
      toast.error("Email e senha são obrigatórios");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-users", {
        body: {
          action: "create",
          email: newEmail,
          password: newPassword,
          full_name: newFullName,
          role: newRole,
        },
      });

      if (error) throw error;

      toast.success("Usuário criado com sucesso");
      setCreateDialogOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewFullName("");
      setNewRole("parent");
      fetchUsers();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Erro ao criar usuário");
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${userEmail}?`)) {
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("admin-manage-users", {
        body: {
          action: "delete",
          user_id: userId,
        },
      });

      if (error) throw error;

      toast.success("Usuário excluído com sucesso");
      fetchUsers();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Erro ao excluir usuário");
    }
  };

  const handleOpenEditRoles = (userData: UserData) => {
    setSelectedUser(userData);
    setEditRoles(userData.roles);
    setEditDialogOpen(true);
  };

  const handleUpdateRoles = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase.functions.invoke("admin-manage-users", {
        body: {
          action: "update_roles",
          user_id: selectedUser.id,
          roles: editRoles,
        },
      });

      if (error) throw error;

      toast.success("Permissões atualizadas com sucesso");
      setEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Erro ao atualizar permissões");
    }
  };

  const toggleRole = (role: string) => {
    setEditRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
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
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Console de Administração</h1>
            </div>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Criar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Crie um novo usuário no sistema e escolha sua permissão inicial.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="usuario@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <Label htmlFor="fullName">Nome Completo (opcional)</Label>
                  <Input
                    id="fullName"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Permissão Inicial</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Selecione uma permissão" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser}>Criar Usuário</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Gerenciar Usuários</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Permissões</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userData) => (
                  <TableRow key={userData.id}>
                    <TableCell className="font-medium">{userData.email}</TableCell>
                    <TableCell>{userData.full_name || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {userData.roles.map((role) => (
                          <span
                            key={role}
                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                          >
                            {role}
                          </span>
                        ))}
                        {userData.roles.length === 0 && (
                          <span className="text-muted-foreground text-sm">Nenhuma</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditRoles(userData)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(userData.id, userData.email)}
                          disabled={userData.id === user?.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Permissões</DialogTitle>
              <DialogDescription>
                Altere as permissões do usuário {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {AVAILABLE_ROLES.map((role) => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    id={role}
                    checked={editRoles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  <Label htmlFor={role} className="cursor-pointer">
                    {role}
                  </Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateRoles}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminConsole;
