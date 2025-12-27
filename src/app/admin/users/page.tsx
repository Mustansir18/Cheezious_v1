
"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, User, Edit } from "lucide-react";
import type { User as UserType, UserRole } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/context/SettingsContext";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";

function UserForm({
  user,
  onSave,
}: {
  user?: UserType;
  onSave: (user: Omit<UserType, "id"> | UserType, id?: string) => void;
}) {
  const [id, setId] = useState('');
  const [username, setUsername] = useState(user?.username ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole | string>(user?.role ?? "cashier");
  const [branchId, setBranchId] = useState<string | undefined>(user?.branchId);
  const { settings } = useSettings();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (user) {
      onSave({
        ...user,
        username,
        role: role as UserRole,
        branchId,
        ...(password && { password }),
      });
    } else {
      if (id && username && password) {
        onSave({ username, password, role: role as UserRole, branchId }, id);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!user && (
         <div>
          <Label htmlFor="user-id">User Code</Label>
          <Input id="user-id" value={id} onChange={(e) => setId(e.target.value)} required placeholder="e.g. U-001" />
        </div>
      )}
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={user ? "Leave blank to keep current password" : ""}
          required={!user}
        />
      </div>

      <div>
        <Label htmlFor="role">Role</Label>
        <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
          <SelectTrigger id="role">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {settings.roles
              .filter((r) => r.id !== "root")
              .map((r) => (
                <SelectItem key={r.id} value={r.id as string}>
                  {r.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {(role === "admin" || role === "cashier") && (
        <div>
          <Label htmlFor="branch">Branch</Label>
          <Select value={branchId} onValueChange={setBranchId} required>
            <SelectTrigger id="branch">
              <SelectValue placeholder="Select a branch" />
            </SelectTrigger>
            <SelectContent>
              {settings.branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit">Save User</Button>
      </DialogFooter>
    </form>
  );
}

export default function UserManagementPage() {
  const { users, user, addUser, deleteUser, updateUser } = useAuth();
  const { settings } = useSettings();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType>();

  const handleSaveUser = (userToSave: Omit<UserType, "id"> | UserType, id?: string) => {
    if ("id" in userToSave) {
      updateUser(userToSave);
    } else if (id){
      addUser({
        id,
        username: userToSave.username,
        password: userToSave.password!,
        role: userToSave.role,
        branchId: userToSave.branchId,
      });
    }
    setDialogOpen(false);
    setEditingUser(undefined);
  };

  const displayableUsers = users.filter((u) => {
    if (user?.role === "root") return u.role !== "root";
    if (user?.role === "admin") return u.branchId === user.branchId;
    return false;
  });

  const getRoleName = (roleId: UserRole | string) =>
    settings.roles.find((r) => r.id === roleId)?.name ?? roleId;
    
  const openAddDialog = () => {
    setEditingUser(undefined);
    setDialogOpen(true);
  }

  const openEditDialog = (userToEdit: UserType) => {
      setEditingUser(userToEdit);
      setDialogOpen(true);
  }

  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-8">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="font-headline text-4xl font-bold">
              User Management
            </CardTitle>
            <CardDescription>
              Create and manage cashier, admin, and marketing accounts.
            </CardDescription>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "Edit User" : "Add New User"}
                </DialogTitle>
              </DialogHeader>
              <UserForm user={editingUser} onSave={handleSaveUser} />
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayableUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium flex items-center">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    {u.username}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{u.id}</TableCell>
                  <TableCell>
                    <Badge
                      variant={u.role === "admin" ? "secondary" : "outline"}
                    >
                      {getRoleName(u.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {settings.branches.find((b) => b.id === u.branchId)?.name ??
                      "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(u)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <DeleteConfirmationDialog
                      title={`Delete User "${u.username}"?`}
                      description={
                        <>
                          This action cannot be undone. This will permanently
                          delete the user <strong>{u.username}</strong>.
                        </>
                      }
                      onConfirm={() => deleteUser(u.id, u.username)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            {displayableUsers.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No users found.</p>
                    <p className="text-sm text-muted-foreground">Click "Add User" to create one.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
