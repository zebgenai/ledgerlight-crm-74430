import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, HandCoins, Receipt } from "lucide-react";

interface Stats {
  totalMoney: number;
  toGive: number;
  debt: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalMoney: 0, toGive: 0, debt: 0 });
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

    const [inData, outData, toGiveData, debtData] = await Promise.all([
      supabase.from("in").select("amount").gte("date", startDate).lte("date", endDate),
      supabase.from("out").select("amount").gte("date", startDate).lte("date", endDate),
      supabase.from("to_give").select("amount").eq("status", "Unpaid"),
      supabase.from("debt").select("amount").eq("status", "Not Returned"),
    ]);

    const totalIn = inData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalOut = outData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalToGive = toGiveData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalDebt = debtData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

    setStats({
      totalMoney: totalIn - totalOut,
      toGive: totalToGive,
      debt: totalDebt,
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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">Overview of your finances</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-36 md:w-32 h-10 md:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover">
              {months.map((month, index) => (
                <SelectItem key={month} value={(index + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-24 h-10 md:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="animate-fade-in hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-2">
            <CardTitle className="text-sm md:text-base font-medium">Total Money</CardTitle>
            <TrendingUp className="h-5 w-5 md:h-4 md:w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              PKR {loading ? "..." : stats.totalMoney.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Income - Expenses for selected period
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in hover-scale" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-2">
            <CardTitle className="text-sm md:text-base font-medium">To Give</CardTitle>
            <HandCoins className="h-5 w-5 md:h-4 md:w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              PKR {loading ? "..." : stats.toGive.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total unpaid amount
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in hover-scale sm:col-span-2 lg:col-span-1" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-2">
            <CardTitle className="text-sm md:text-base font-medium">Debt</CardTitle>
            <Receipt className="h-5 w-5 md:h-4 md:w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              PKR {loading ? "..." : stats.debt.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total not returned
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
