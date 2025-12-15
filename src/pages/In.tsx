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
import { RecordCard } from "@/components/RecordCard";

const inSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  reason: z.string().min(1, "Reason is required").max(200, "Reason must be less than 200 characters"),
  date: z.string(),
});

interface InRecord {
  id: string;
  amount: number;
  reason: string;
  date: string;
}

export default function In() {
  const [records, setRecords] = useState<InRecord[]>([]);
  const [open, setOpen] = useState(false);
  
  const totalAmount = records.reduce((sum, record) => sum + Number(record.amount), 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ amount: "", reason: "", date: new Date().toISOString().split('T')[0] });
  const { toast } = useToast();
  const { user, role } = useAuth();

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from("in")
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
      inSchema.parse({ ...formData, amount: Number(formData.amount) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation Error", description: error.errors[0].message, variant: "destructive" });
        return;
      }
    }

    if (editingId) {
      const { error } = await supabase
        .from("in")
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
        .from("in")
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
    const { error } = await supabase.from("in").delete().eq("id", id);
    
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

  const startEdit = (record: InRecord) => {
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

    const filename = `cash-${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
      exportToCSV(exportData, filename);
    } else {
      exportToExcel(exportData, filename, 'Cash');
    }

    toast({ title: "Success", description: `Data exported as ${format.toUpperCase()}` });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Cash</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Total: <span className="font-semibold text-success">PKR {Math.round(totalAmount).toLocaleString()}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default" className="h-10 md:h-9">
                <FileDown className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-50 bg-popover">
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
              <Button className="h-10 md:h-9">
                <Plus className="h-4 w-4 mr-2" />
                Add Cash
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit" : "Add"} Cash</DialogTitle>
                <DialogDescription>Enter the cash details below</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="amount" className="text-base">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    className="h-11 text-base"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reason" className="text-base">Reason</Label>
                  <Input
                    id="reason"
                    className="h-11 text-base"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date" className="text-base">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    className="h-11 text-base"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-base">
                  {editingId ? "Update" : "Add"} Cash
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {records.map((record) => (
          <RecordCard
            key={record.id}
            date={record.date}
            amount={record.amount}
            reason={record.reason}
            type="income"
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={() => startEdit(record)}
            onDelete={() => handleDelete(record.id)}
          />
        ))}
        {records.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No records found
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border overflow-x-auto">
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
                <TableCell className="text-success font-medium">PKR {Math.round(Number(record.amount)).toLocaleString()}</TableCell>
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
