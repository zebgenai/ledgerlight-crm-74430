import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RecordCard } from "@/components/RecordCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";

const formSchema = z.object({
  item_name: z.string().min(1, "Item name is required").max(100),
  description: z.string().max(500).optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  purchase_price: z.coerce.number().min(0, "Price must be positive"),
  purchase_date: z.string().min(1, "Date is required"),
  status: z.string().min(1, "Status is required"),
});

type FormData = z.infer<typeof formSchema>;

interface StockItem {
  id: string;
  item_name: string;
  description: string | null;
  quantity: number;
  purchase_price: number;
  purchase_date: string;
  status: string;
  created_by: string;
  created_at: string;
}

export default function Stock() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, role } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      item_name: "",
      description: "",
      quantity: 1,
      purchase_price: 0,
      purchase_date: new Date().toISOString().split("T")[0],
      status: "In Stock",
    },
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("stock")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch stock items",
        variant: "destructive",
      });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    form.reset({
      item_name: "",
      description: "",
      quantity: 1,
      purchase_price: 0,
      purchase_date: new Date().toISOString().split("T")[0],
      status: "In Stock",
    });
    setEditingId(null);
  };

  const startEdit = (item: StockItem) => {
    form.reset({
      item_name: item.item_name,
      description: item.description || "",
      quantity: item.quantity,
      purchase_price: item.purchase_price,
      purchase_date: item.purchase_date,
      status: item.status,
    });
    setEditingId(item.id);
    setOpen(true);
  };

  const onSubmit = async (values: FormData) => {
    if (!user) return;

    if (editingId) {
      // Update existing item
      const { error } = await supabase
        .from("stock")
        .update({
          item_name: values.item_name,
          description: values.description || null,
          quantity: values.quantity,
          purchase_price: values.purchase_price,
          purchase_date: values.purchase_date,
          status: values.status,
        })
        .eq("id", editingId);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Stock item updated successfully",
        });
        resetForm();
        setOpen(false);
        fetchItems();
      }
    } else {
      // Insert new item
      const totalCost = values.purchase_price * values.quantity;

      const { error: stockError } = await supabase.from("stock").insert({
        item_name: values.item_name,
        description: values.description || null,
        quantity: values.quantity,
        purchase_price: values.purchase_price,
        purchase_date: values.purchase_date,
        status: values.status,
        created_by: user.id,
      });

      if (stockError) {
        toast({
          title: "Error",
          description: stockError.message,
          variant: "destructive",
        });
        return;
      }

      // Also add to "out" table to track the expense
      const { error: outError } = await supabase.from("out").insert({
        amount: totalCost,
        reason: `Stock Purchase: ${values.item_name} (Qty: ${values.quantity})`,
        date: values.purchase_date,
        created_by: user.id,
      });

      if (outError) {
        toast({
          title: "Warning",
          description: "Stock added but expense tracking failed",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Stock item added! PKR ${totalCost.toFixed(2)} recorded as expense.`,
        });
      }

      resetForm();
      setOpen(false);
      fetchItems();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("stock").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Stock item deleted",
      });
      fetchItems();
    }
  };

  const handleExport = (format: 'csv' | 'excel') => {
    const exportData = items.map(item => ({
      'Item Name': item.item_name,
      'Description': item.description || '',
      'Quantity': item.quantity,
      'Price (PKR)': Number(item.purchase_price).toFixed(2),
      'Total (PKR)': (item.purchase_price * item.quantity).toFixed(2),
      'Date': new Date(item.purchase_date).toLocaleDateString(),
      'Status': item.status,
    }));

    const filename = `stock-${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
      exportToCSV(exportData, filename);
    } else {
      exportToExcel(exportData, filename, 'Stock');
    }

    toast({ title: "Success", description: `Data exported as ${format.toUpperCase()}` });
  };

  const canEdit = role === "admin";
  const canDelete = role === "admin";

  const totalValue = items.reduce(
    (sum, item) => sum + item.purchase_price * item.quantity,
    0
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Stock</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your inventory
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
              <Button className="h-11 md:h-9 text-base md:text-sm">
                <Plus className="mr-2 h-5 w-5 md:h-4 md:w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] md:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit" : "Add"} Stock Item</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="item_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Car, Laptop"
                            className="h-11 md:h-10 text-base md:text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Details about the item..."
                            className="text-base md:text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              className="h-11 md:h-10 text-base md:text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="purchase_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (PKR)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="h-11 md:h-10 text-base md:text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="purchase_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="h-11 md:h-10 text-base md:text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 md:h-10 text-base md:text-sm">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-50 bg-popover">
                            <SelectItem value="In Stock">In Stock</SelectItem>
                            <SelectItem value="Sold">Sold</SelectItem>
                            <SelectItem value="Reserved">Reserved</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-11 md:h-10 text-base md:text-sm">
                    {editingId ? "Update" : "Add"} Item
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">
            Total Stock Value: PKR {Math.round(totalValue).toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No stock items yet</p>
          ) : (
            <>
              {/* Mobile view - Cards */}
              <div className="md:hidden space-y-3">
                {items.map((item) => (
                  <RecordCard
                    key={item.id}
                    type="income"
                    amount={item.purchase_price * item.quantity}
                    date={item.purchase_date}
                    reason={`${item.item_name} (Qty: ${item.quantity})`}
                    status={item.status}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEdit={() => startEdit(item)}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
              </div>

              {/* Desktop view - Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      {(canEdit || canDelete) && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.item_name}
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {item.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>PKR {Math.round(Number(item.purchase_price)).toLocaleString()}</TableCell>
                        <TableCell>
                          PKR {Math.round(item.purchase_price * item.quantity).toLocaleString()}
                        </TableCell>
                        <TableCell>{item.purchase_date}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              item.status === "In Stock"
                                ? "bg-success/20 text-success"
                                : item.status === "Sold"
                                ? "bg-muted text-muted-foreground"
                                : "bg-warning/20 text-warning"
                            }`}
                          >
                            {item.status}
                          </span>
                        </TableCell>
                        {(canEdit || canDelete) && (
                          <TableCell className="text-right space-x-2">
                            {canEdit && (
                              <Button variant="ghost" size="icon" onClick={() => startEdit(item)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
