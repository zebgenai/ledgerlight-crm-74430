import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, HandCoins, Receipt, Package, Scale } from "lucide-react";

interface Stats {
  totalMoney: number;
  toGive: number;
  debt: number;
  stockValue: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalMoney: 0, toGive: 0, debt: 0, stockValue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    const [inData, outData, toGiveData, debtData, stockData] = await Promise.all([
      supabase.from("in").select("amount"),
      supabase.from("out").select("amount"),
      supabase.from("to_give").select("amount").eq("status", "Unpaid"),
      supabase.from("debt").select("amount").eq("status", "Not Returned"),
      supabase.from("stock").select("purchase_price, quantity").eq("status", "In Stock"),
    ]);

    const totalIn = inData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalOut = outData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalToGive = toGiveData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalDebt = debtData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalStock = stockData.data?.reduce((sum, item) => sum + (Number(item.purchase_price) * Number(item.quantity)), 0) || 0;

    setStats({
      totalMoney: totalIn + totalOut,
      toGive: totalToGive,
      debt: totalDebt,
      stockValue: totalStock,
    });
    
    setLoading(false);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">Overview of your finances</p>
      </div>

      <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="animate-fade-in hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-2">
            <CardTitle className="text-sm md:text-base font-medium">Total Money</CardTitle>
            <TrendingUp className="h-5 w-5 md:h-4 md:w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              PKR {loading ? "..." : Math.round(stats.totalMoney).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total Income - Expenses
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in hover-scale" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-2">
            <CardTitle className="text-sm md:text-base font-medium">Stock Value</CardTitle>
            <Package className="h-5 w-5 md:h-4 md:w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              PKR {loading ? "..." : Math.round(stats.stockValue).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total in-stock items value
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in hover-scale" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-2">
            <CardTitle className="text-sm md:text-base font-medium">To Give</CardTitle>
            <HandCoins className="h-5 w-5 md:h-4 md:w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              PKR {loading ? "..." : Math.round(stats.toGive).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total unpaid amount
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in hover-scale" style={{ animationDelay: "0.3s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-2">
            <CardTitle className="text-sm md:text-base font-medium">Debt</CardTitle>
            <Receipt className="h-5 w-5 md:h-4 md:w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              PKR {loading ? "..." : Math.round(stats.debt).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total not returned
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in hover-scale" style={{ animationDelay: "0.4s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-2">
            <CardTitle className="text-sm md:text-base font-medium">Net Position</CardTitle>
            <Scale className="h-5 w-5 md:h-4 md:w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl md:text-2xl font-bold ${
              stats.totalMoney + stats.debt + stats.stockValue - stats.toGive >= 0 ? "text-success" : "text-destructive"
            }`}>
              PKR {loading ? "..." : Math.round(stats.totalMoney + stats.debt + stats.stockValue - stats.toGive).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
