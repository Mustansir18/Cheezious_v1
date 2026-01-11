

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
import { PlusCircle, User, Edit, Key } from "lucide-react";
import type { User as UserType, UserRole, Role } from "@/lib/types";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";


function RoleForm({
  role,
  onSave,
  onClose,
}: {
  role?: Role;
  onSave: (role: Omit<Role, 'id'> | Role, id?: string) => void;
  onClose: () => void;
}) {
  const [id, setId] = useState<UserRole | string>('');
  const [name, setName] = useState(role?.name || '');
  const [permissions, setPermissions] = useState<string[]>(role?.permissions || []);

  const handlePermissionToggle = (permission: string) => {
    setPermissions(prev =>
      prev.includes(permission) ? prev.filter(p => p !== permission) : [...prev, permission]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, permissions };
    if (role) {
      onSave({ ...role, ...data });
    } else {
      onSave({ ...data }, id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {role ? (
        <div>
          <Label htmlFor="role-id">Role Code</Label>
          <Input id="role-id" value={role.id as string} disabled />
        </div>
      ) : (
        <div>
          <Label htmlFor="role-id">Role Code</Label>
          <Input id="role-id" value={id} onChange={(e) => setId(e.target.value)} required placeholder="e.g. R-00001" />
        </div>
      )}
      <div>
        <Label htmlFor="role-name">Role Name</Label>
        <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} required disabled={!!role?.id && ['root', 'admin', 'cashier', 'marketing'].includes(role.id as string)} />
        {role?.id && ['root', 'admin', 'cashier', 'marketing'].includes(role.id as string) && <p className="text-xs text-muted-foreground mt-1">Default role names cannot be changed.</p>}
      </div>
      <div>
        <Label>Permissions</Label>
        <ScrollArea className="h-60 rounded-md border p-4">
            <div className="space-y-2">
                {ALL_PERMISSIONS.map(permission => (
                     <div key={permission.id} className="flex items-start space-x-2">
                        <Checkbox
                            id={`perm-${permission.id}`}
                            checked={permissions.includes(permission.id)}
                            onCheckedChange={() => handlePermissionToggle(permission.id)}
                            disabled={role?.id === 'root'}
                        />
                         <div className="grid gap-1.5 leading-none">
                            <Label htmlFor={`perm-${permission.id}`} className="font-normal cursor-pointer">{permission.name}</Label>
                            <p className="text-xs text-muted-foreground">{permission.description}</p>
                        </div>
                     </div>
                ))}
            </div>
        </ScrollArea>
      </div>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save Role</Button>
      </DialogFooter>
    </form>
  );
}

function RoleManagement() {
    const { settings, addRole, updateRole, deleteRole } = useSettings();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | undefined>();

    const openDialog = (role?: Role) => {
        setEditingRole(role);
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setEditingRole(undefined);
        setDialogOpen(false);
    };

    const handleSave = (roleData: Omit<Role, 'id'> | Role, id?: string) => {
        if ('id' in roleData) {
            updateRole(roleData as Role);
        } else if (id) {
            addRole({ id, ...roleData });
        }
        closeDialog();
    };

    return (
        <Card>
            <CardHeader className="flex-row justify-between items-center">
                 <div>
                    <CardTitle>Role Management</CardTitle>
                    <CardDescription>Define roles and their access permissions across the application.</CardDescription>
                </div>
                <Button onClick={() => openDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Role
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Role</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Permissions</TableHead>
                            <TableHead className="text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {settings.roles.map(role => (
                            <TableRow key={role.id}>
                                <TableCell className="font-semibold capitalize">{role.name}</TableCell>
                                <TableCell className="font-mono text-xs">{role.id}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-2 max-w-md">
                                        {role.permissions.map(permission => (
                                            <span key={permission} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                                                {ALL_PERMISSIONS.find(p => p.id === permission)?.name || permission}
                                            </span>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => openDialog(role)}>
                                        <Edit className="h-4 w-4"/>
                                    </Button>
                                     <DeleteConfirmationDialog
                                        title={`Delete Role "${role.name}"?`}
                                        description={<>This will permanently delete the role. Users with this role will lose access.</>}
                                        onConfirm={() => deleteRole(role.id as UserRole)}
                                        triggerButton={
                                            <Button variant="ghost" size="icon" disabled={['root', 'admin', 'cashier', 'marketing'].includes(role.id as string)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        }
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingRole ? `Edit Role: ${editingRole.name}` : 'Add New Role'}</DialogTitle>
                    </DialogHeader>
                    <RoleForm role={editingRole} onSave={handleSave} onClose={closeDialog} />
                </DialogContent>
            </Dialog>
        </Card>
    );
}

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
  
  const getStationNameForRole = (roleId: string): string | undefined => {
    const kdsRoleMapping: Record<string, string> = {
        'kds': 'All Stations',
        'make-station': 'MAKE Station',
        'pasta-station': 'PASTA Station',
        'fried-station': 'FRIED Station',
        'bar-station': 'BEVERAGES Station',
        'cutt-station': 'CUTT Station',
    };
    return kdsRoleMapping[roleId];
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const stationName = getStationNameForRole(role as string);

    if (user) {
      onSave({
        ...user,
        username,
        role: role as UserRole,
        branchId,
        stationName,
        ...(password && { password }),
      });
    } else {
      if (id && username && password) {
        onSave({ username, password, role: role as UserRole, branchId, stationName }, id);
      }
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {user ? (
        <div>
          <Label htmlFor="user-id">User Code</Label>
          <Input id="user-id" value={user.id} disabled />
        </div>
      ) : (
         <div>
          <Label htmlFor="user-id">User Code</Label>
          <Input id="user-id" value={id} onChange={(e) => setId(e.target.value)} required placeholder="e.g. CH-00001" />
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

      {(role === "admin" || role === "cashier" || (role as string).includes('-station')) && (
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
        stationName: userToSave.stationName,
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
    <div className="w-full space-y-8">
      <header>
          <h1 className="font-headline text-4xl font-bold">User & Role Management</h1>
          <p className="text-muted-foreground">Manage accounts and their permissions for staff members.</p>
      </header>

      <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle>
                      User Accounts
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
                        <TableHead>Station</TableHead>
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
                              {u.stationName || "N/A"}
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
          </TabsContent>
          <TabsContent value="roles" className="mt-6">
              <RoleManagement />
          </TabsContent>
      </Tabs>
    </div>
  );
}
