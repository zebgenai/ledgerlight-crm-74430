import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Pencil, Trash2, Plus, FileDown } from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const debtSchema = z.object({
  person_name: z.string().min(1, "Person name is required").max(100, "Name must be less than 100 characters"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string(),
  status: z.enum(["Not Returned", "Returned"]),
});

interface DebtRecord {
  id: string;
  person_name: string;
  amount: number;
  date: string;
  status: string;
}

export default function Debt() {
  const [records, setRecords] = useState<DebtRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    person_name: "", 
    amount: "", 
    date: new Date().toISOString().split('T')[0],
    status: "Not Returned" 
  });
  const { toast } = useToast();
  const { user, role } = useAuth();

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from("debt")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setRecords(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      debtSchema.parse({ ...formData, amount: Number(formData.amount) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation Error", description: error.errors[0].message, variant: "destructive" });
        return;
      }
    }

    if (editingId) {
      const { error } = await supabase
        .from("debt")
        .update({ 
          person_name: formData.person_name,
          amount: Number(formData.amount), 
          date: formData.date,
          status: formData.status
        })
        .eq("id", editingId);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Record updated successfully" });
        fetchRecords();
        setOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("debt")
        .insert([{ 
          ...formData, 
          amount: Number(formData.amount), 
          created_by: user?.id 
        }]);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Record added successfully" });
        fetchRecords();
        setOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("debt").delete().eq("id", id);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Record deleted successfully" });
      fetchRecords();
    }
  };

  const resetForm = () => {
    setFormData({ 
      person_name: "", 
      amount: "", 
      date: new Date().toISOString().split('T')[0],
      status: "Not Returned"
    });
    setEditingId(null);
  };

  const startEdit = (record: DebtRecord) => {
    setFormData({ 
      person_name: record.person_name,
      amount: record.amount.toString(), 
      date: record.date,
      status: record.status
    });
    setEditingId(record.id);
    setOpen(true);
  };

  const canEdit = role === "admin";
  const canDelete = role === "admin";

  const handleExport = (format: 'csv' | 'excel') => {
    const exportData = records.map(record => ({
      'Person Name': record.person_name,
      Date: new Date(record.date).toLocaleDateString(),
      Amount: Number(record.amount).toFixed(2),
      Status: record.status,
    }));

    const filename = `debt-${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
      exportToCSV(exportData, filename);
    } else {
      exportToExcel(exportData, filename, 'Debt');
    }

    toast({ title: "Success", description: `Data exported as ${format.toUpperCase()}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debt</h1>
          <p className="text-muted-foreground">Track money people owe you</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Debt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit" : "Add"} Debt</DialogTitle>
                <DialogDescription>Enter the details below</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="person_name">Person Name</Label>
                  <Input
                    id="person_name"
                    value={formData.person_name}
                    onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Returned">Not Returned</SelectItem>
                      <SelectItem value="Returned">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? "Update" : "Add"} Debt
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Person</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              {(canEdit || canDelete) && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id} className={record.status === "Not Returned" ? "bg-destructive/5" : ""}>
                <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                <TableCell>{record.person_name}</TableCell>
                <TableCell className="font-medium">${Number(record.amount).toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    record.status === "Not Returned" ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"
                  }`}>
                    {record.status}
                  </span>
                </TableCell>
                {(canEdit || canDelete) && (
                  <TableCell className="text-right space-x-2">
                    {canEdit && (
                      <Button variant="ghost" size="icon" onClick={() => startEdit(record)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(record.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={canEdit || canDelete ? 5 : 4} className="text-center text-muted-foreground">
                  No records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
