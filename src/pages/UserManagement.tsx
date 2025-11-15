import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, UserCog } from "lucide-react";
import { Navigate } from "react-router-dom";

interface User {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  role: "admin" | "manager" | null;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (role === "admin") {
      fetchUsers();
    }
  }, [role]);

  const fetchUsers = async () => {
    setLoading(true);
    
    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("email");

    if (profilesError) {
      toast({ title: "Error", description: profilesError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch all user roles
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      toast({ title: "Error", description: rolesError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Combine the data
    const usersWithRoles = profiles?.map(profile => {
      const userRole = roles?.find(r => r.user_id === profile.id);
      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        username: profile.username,
        role: userRole?.role || null,
      };
    }) || [];

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    const role = newRole === "none" ? null : (newRole as "admin" | "manager");
    
    if (newRole === "none") {
      // Remove role
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Role removed successfully" });
        fetchUsers();
      }
    } else {
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: role as "admin" | "manager" })
          .eq("user_id", userId);

        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Success", description: "Role updated successfully" });
          fetchUsers();
        }
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: role as "admin" | "manager" }]);

        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Success", description: "Role assigned successfully" });
          fetchUsers();
        }
      }
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <UserCog className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Assign admin or manager roles to users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead className="text-right">Assign Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.name || "-"}</TableCell>
                      <TableCell>{user.username || "-"}</TableCell>
                      <TableCell>
                        {user.role ? (
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            <Shield className="h-3 w-3 mr-1" />
                            {user.role}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No Role</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={user.role || "none"}
                          onValueChange={(value) => updateUserRole(user.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Role</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-start">
            <Badge className="mt-1">Admin</Badge>
            <div className="flex-1">
              <p className="text-sm font-medium">Full Access</p>
              <p className="text-sm text-muted-foreground">Can view, add, edit, and delete all records. Can manage user roles.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <Badge variant="secondary" className="mt-1">Manager</Badge>
            <div className="flex-1">
              <p className="text-sm font-medium">Limited Access</p>
              <p className="text-sm text-muted-foreground">Can view all records and add new records, but cannot edit or delete.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
