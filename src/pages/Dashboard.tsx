import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [selectedMonth, selectedYear]);

  const fetchStats = async () => {
    setLoading(true);

    let inQuery = supabase.from("in").select("amount");
    let outQuery = supabase.from("out").select("amount");

    if (selectedMonth !== "all") {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
      const endDate = new Date(selectedYear, Number(selectedMonth), 0).toISOString().split("T")[0];
      inQuery = inQuery.gte("date", startDate).lte("date", endDate);
      outQuery = outQuery.gte("date", startDate).lte("date", endDate);
    }

    const [inData, outData, toGiveData, debtData, stockData] = await Promise.all([
      inQuery,
      outQuery,
      supabase.from("to_give").select("amount").eq("status", "Unpaid"),
      supabase.from("debt").select("amount").eq("status", "Not Returned"),
      supabase.from("stock").select("purchase_price, quantity").eq("status", "In Stock"),
    ]);

    const totalIn = inData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalOut = outData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalToGive = toGiveData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalDebt = debtData.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalStock = stockData.data?.reduce(
      (sum, item) => sum + Number(item.purchase_price) * Number(item.quantity),
      0
    ) || 0;

    // Cash = Total Income (from "in" table)
    const cash = totalIn;

    setStats({
      totalMoney: cash,
      toGive: totalToGive,
      debt: totalDebt,
      stockValue: totalStock,
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
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-36 md:w-32 h-10 md:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover">
              <SelectItem value="all">All Time</SelectItem>
              {months.map((month, index) => (
                <SelectItem key={month} value={(index + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedMonth !== "all" && (
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
          )}
        </div>
      </div>

      <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex justify-between flex-row">
            <CardTitle>Cash</CardTitle>
            <TrendingUp className="text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              PKR {loading ? "..." : Math.round(stats.totalMoney).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Income - Expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between flex-row">
            <CardTitle>Stock Value</CardTitle>
            <Package />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              PKR {loading ? "..." : Math.round(stats.stockValue).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between flex-row">
            <CardTitle>Debt</CardTitle>
            <Receipt />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              PKR {loading ? "..." : Math.round(stats.debt).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between flex-row">
            <CardTitle>Total Money</CardTitle>
            <TrendingUp className="text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              PKR {loading ? "..." : Math.round(stats.totalMoney + stats.stockValue + stats.debt).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Cash + Stock + Debt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between flex-row">
            <CardTitle>To Give</CardTitle>
            <HandCoins className="text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              PKR {loading ? "..." : Math.round(stats.toGive).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-5">
          <CardHeader className="flex justify-between flex-row">
            <CardTitle>Net Position</CardTitle>
            <Scale />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                (stats.totalMoney + stats.stockValue + stats.debt) - stats.toGive >= 0
                  ? "text-success"
                  : "text-destructive"
              }`}
            >
              PKR{" "}
              {loading
                ? "..."
                : Math.round(
                    (stats.totalMoney + stats.stockValue + stats.debt) - stats.toGive
                  ).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total Money - To Give</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
