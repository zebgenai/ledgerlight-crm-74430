import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Pencil, Trash2, Plus, FileDown } from "lucide-react";
import { z } from "zod";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const outSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  reason: z.string().min(1, "Reason is required").max(200, "Reason must be less than 200 characters"),
  date: z.string(),
});

interface OutRecord {
  id: string;
  amount: number;
  reason: string;
  date: string;
}

export default function Out() {
  const [records, setRecords] = useState<OutRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ amount: "", reason: "", date: new Date().toISOString().split('T')[0] });
  const { toast } = useToast();
  const { user, role } = useAuth();

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from("out")
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
      outSchema.parse({ ...formData, amount: Number(formData.amount) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation Error", description: error.errors[0].message, variant: "destructive" });
        return;
      }
    }

    if (editingId) {
      const { error } = await supabase
        .from("out")
        .update({ amount: Number(formData.amount), reason: formData.reason, date: formData.date })
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
        .from("out")
        .insert([{ ...formData, amount: Number(formData.amount), created_by: user?.id }]);

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
    const { error } = await supabase.from("out").delete().eq("id", id);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Record deleted successfully" });
      fetchRecords();
    }
  };

  const resetForm = () => {
    setFormData({ amount: "", reason: "", date: new Date().toISOString().split('T')[0] });
    setEditingId(null);
  };

  const startEdit = (record: OutRecord) => {
    setFormData({ amount: record.amount.toString(), reason: record.reason, date: record.date });
    setEditingId(record.id);
    setOpen(true);
  };

  const canEdit = role === "admin";
  const canDelete = role === "admin";

  const handleExport = (format: 'csv' | 'excel') => {
    const exportData = records.map(record => ({
      Date: new Date(record.date).toLocaleDateString(),
      Amount: Number(record.amount).toFixed(2),
      Reason: record.reason,
    }));

    const filename = `expenses-${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
      exportToCSV(exportData, filename);
    } else {
      exportToExcel(exportData, filename, 'Expenses');
    }

    toast({ title: "Success", description: `Data exported as ${format.toUpperCase()}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track your expenses</p>
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
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit" : "Add"} Expense</DialogTitle>
                <DialogDescription>Enter the expense details below</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
                <Button type="submit" className="w-full">
                  {editingId ? "Update" : "Add"} Expense
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
              <TableHead>Amount</TableHead>
              <TableHead>Reason</TableHead>
              {(canEdit || canDelete) && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-destructive font-medium">-PKR {Number(record.amount).toFixed(2)}</TableCell>
                <TableCell>{record.reason}</TableCell>
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
                <TableCell colSpan={canEdit || canDelete ? 4 : 3} className="text-center text-muted-foreground">
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
