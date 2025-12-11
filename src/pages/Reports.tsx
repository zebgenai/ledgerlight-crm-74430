import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface ReportStats {
  currentMoney: number;
  totalIn: number;
  totalOut: number;
  toGive: number;
  debt: number;
  stockValue: number;
  stockCount: number;
}

export default function Reports() {
  const [stats, setStats] = useState<ReportStats>({ 
    currentMoney: 0, 
    totalIn: 0, 
    totalOut: 0, 
    toGive: 0, 
    debt: 0,
    stockValue: 0,
    stockCount: 0
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [selectedMonth, selectedYear]);

  const fetchStats = async () => {
    setLoading(true);
    
    const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];

    const [inData, outData, toGiveData, debtData, stockData] = await Promise.all([
      supabase.from("in").select("amount").gte("date", startDate).lte("date", endDate),
      supabase.from("out").select("amount").gte("date", startDate).lte("date", endDate),
      supabase.from("to_give").select("amount").eq("status", "Unpaid"),
      supabase.from("debt").select("amount").eq("status", "Not Returned"),
      supabase.from("stock").select("purchase_price, quantity").eq("status", "In Stock"),
    ]);

    const totalIn = inData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalOut = outData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalToGive = toGiveData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalDebt = debtData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalStockValue = stockData.data?.reduce((sum, item) => sum + (Number(item.purchase_price) * Number(item.quantity)), 0) || 0;
    const totalStockCount = stockData.data?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;

    setStats({
      currentMoney: totalIn - totalOut,
      totalIn,
      totalOut,
      toGive: totalToGive,
      debt: totalDebt,
      stockValue: totalStockValue,
      stockCount: totalStockCount,
    });
    
    setLoading(false);
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Comprehensive financial overview</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={month} value={(index + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-success/50">
          <CardHeader>
            <CardTitle className="text-lg">Current Money</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              PKR {loading ? "..." : stats.currentMoney.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              For selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              PKR {loading ? "..." : stats.totalIn.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Total money received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              PKR {loading ? "..." : stats.totalOut.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Total money spent
            </p>
          </CardContent>
        </Card>

        <Card className="border-warning/50">
          <CardHeader>
            <CardTitle className="text-lg">Money To Give</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">
              PKR {loading ? "..." : stats.toGive.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Unpaid obligations
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-lg">Money Taken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              PKR {loading ? "..." : stats.debt.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Not yet returned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Net Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              stats.currentMoney + stats.debt + stats.stockValue - stats.toGive >= 0 ? "text-success" : "text-destructive"
            }`}>
              PKR {loading ? "..." : (stats.currentMoney + stats.debt + stats.stockValue - stats.toGive).toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Cash + Debt + Stock - To Give
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="text-lg">Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              PKR {loading ? "..." : stats.stockValue.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats.stockCount} items in stock
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
