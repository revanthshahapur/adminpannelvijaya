import { useEffect, useState } from "react";
import { Users, GraduationCap, DollarSign, AlertCircle, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type FinanceAccountBalanceSummary = {
  financeAccountId: number;
  financeAccountName: string;
  financeAccountType: string;
  latestBalance: number | string | null;
  latestTransactionDate: string | null;
};

type FeeSummary = {
  totalPayableAmount: number | string | null;
  totalAmountPaid: number | string | null;
  totalStudents: number | string | null;
};

const getSessionContext = () => {
  const token = localStorage.getItem("authToken");
  const storedUser = localStorage.getItem("user");
  let schoolId = localStorage.getItem("schoolId");

  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      schoolId =
        schoolId ||
        parsedUser.schoolId ||
        parsedUser.school_id ||
        parsedUser.school?.id ||
        parsedUser.user?.schoolId ||
        parsedUser.user?.school_id;
    } catch {
      // ignore parse errors
    }
  }

  return {
    token,
    schoolId: schoolId ? String(schoolId) : "",
  };
};

const normalizeFinanceSummary = (payload: unknown): FinanceAccountBalanceSummary[] => {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;

      const id = Number(record.financeAccountId);
      const name = typeof record.financeAccountName === "string" ? record.financeAccountName.trim() : "";
      const type =
        typeof record.financeAccountType === "string" && record.financeAccountType.trim()
          ? record.financeAccountType.trim()
          : "Unknown";
      const latestBalance = (record.latestBalance ?? null) as FinanceAccountBalanceSummary["latestBalance"];
      const latestTransactionDate =
        typeof record.latestTransactionDate === "string" && record.latestTransactionDate.trim()
          ? record.latestTransactionDate.trim()
          : null;

      if (!Number.isFinite(id) || id <= 0 || !name) return null;

      return {
        financeAccountId: id,
        financeAccountName: name,
        financeAccountType: type,
        latestBalance,
        latestTransactionDate,
      } satisfies FinanceAccountBalanceSummary;
    })
    .filter(Boolean) as FinanceAccountBalanceSummary[];
};

const normalizeFeeSummary = (payload: unknown): FeeSummary | null => {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;

  return {
    totalPayableAmount: (record.totalPayableAmount ?? null) as FeeSummary["totalPayableAmount"],
    totalAmountPaid: (record.totalAmountPaid ?? null) as FeeSummary["totalAmountPaid"],
    totalStudents: (record.totalStudents ?? null) as FeeSummary["totalStudents"],
  };
};

const Dashboard = () => {
  const { students, faculty } = useAppStore();
  const [financeSummary, setFinanceSummary] = useState<FinanceAccountBalanceSummary[]>([]);
  const [financeSummaryLoading, setFinanceSummaryLoading] = useState(false);
  const [financeSummaryError, setFinanceSummaryError] = useState<string | null>(null);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [feeSummaryLoading, setFeeSummaryLoading] = useState(false);
  const [feeSummaryError, setFeeSummaryError] = useState<string | null>(null);

  const parseDecimalNumber = (value: number | string | null | undefined) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const feeTotalStudents = (() => {
    const value = parseDecimalNumber(feeSummary?.totalStudents ?? null);
    return value == null ? null : Math.trunc(value);
  })();
  const feeTotalAmountPaid = parseDecimalNumber(feeSummary?.totalAmountPaid ?? null);
  const feeTotalPayableAmount = parseDecimalNumber(feeSummary?.totalPayableAmount ?? null);
  const feePendingAmount =
    feeTotalAmountPaid != null && feeTotalPayableAmount != null ? feeTotalPayableAmount - feeTotalAmountPaid : null;

  const resolveStatValue = (title: string, fallback: unknown) => {
    if (title === "Total Students") {
      return feeSummaryLoading ? "..." : feeTotalStudents ?? "-";
    }
    if (title === "Fees Collected") {
      return feeSummaryLoading ? "..." : feeTotalAmountPaid != null ? formatINR(feeTotalAmountPaid) : "-";
    }
    if (title === "Pending Fees") {
      return feeSummaryLoading ? "..." : feePendingAmount != null ? formatINR(feePendingAmount) : "-";
    }
    return fallback;
  };

  const stats = [
    {
      title: 'Total Students',
      value: students.length,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Faculty',
      value: faculty.length,
      icon: GraduationCap,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Fees Collected',
      value: '₹38,50,000',
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Pending Fees',
      value: '₹4,20,000',
      icon: AlertCircle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'New Admissions',
      value: '35',
      icon: UserPlus,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  const attendanceData = [
    { month: 'Jan', attendance: 92 },
    { month: 'Feb', attendance: 94 },
    { month: 'Mar', attendance: 91 },
    { month: 'Apr', attendance: 95 },
    { month: 'May', attendance: 93 },
    { month: 'Jun', attendance: 96 },
  ];

  const feeData = [
    { month: 'Jan', collected: 650000 },
    { month: 'Feb', collected: 720000 },
    { month: 'Mar', collected: 680000 },
    { month: 'Apr', collected: 750000 },
    { month: 'May', collected: 800000 },
    { month: 'Jun', collected: 800000 },
  ];

  const recentAdmissions = students.slice(-5).reverse();

  useEffect(() => {
    let cancelled = false;

    const loadFeeSummary = async () => {
      const { token, schoolId } = getSessionContext();
      if (!token || !schoolId) return;

      try {
        setFeeSummaryLoading(true);
        setFeeSummaryError(null);

        const response = await fetch(`/api/finance/${encodeURIComponent(String(schoolId))}/fee-summary`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const payload: unknown = await response.json();
        if (!response.ok) {
          const message =
            payload && typeof payload === "object" && "message" in payload
              ? String((payload as Record<string, unknown>).message ?? "")
              : "";
          throw new Error(message || "Failed to load fee summary");
        }

        const normalized = normalizeFeeSummary(payload);
        if (cancelled) return;
        setFeeSummary(normalized);
      } catch (error) {
        console.error("Error loading fee summary:", error);
        if (!cancelled) {
          setFeeSummary(null);
          setFeeSummaryError(error instanceof Error ? error.message : "Failed to load fee summary");
          toast.error(error instanceof Error ? error.message : "Failed to load fee summary");
        }
      } finally {
        if (!cancelled) setFeeSummaryLoading(false);
      }
    };

    void loadFeeSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadFinanceSummary = async () => {
      const { token, schoolId } = getSessionContext();
      if (!token || !schoolId) return;

      try {
        setFinanceSummaryLoading(true);
        setFinanceSummaryError(null);

        const response = await fetch(
          `/api/finance/${encodeURIComponent(String(schoolId))}/finance-summary`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const payload: unknown = await response.json();
        if (!response.ok) {
          const message =
            payload && typeof payload === "object" && "message" in payload
              ? String((payload as Record<string, unknown>).message ?? "")
              : "";
          throw new Error(message || "Failed to load finance summary");
        }

        const normalized = normalizeFinanceSummary(payload);
        if (cancelled) return;

        setFinanceSummary(normalized);
      } catch (error) {
        console.error("Error loading finance summary:", error);
        if (!cancelled) {
          setFinanceSummary([]);
          setFinanceSummaryError(error instanceof Error ? error.message : "Failed to load finance summary");
          toast.error(error instanceof Error ? error.message : "Failed to load finance summary");
        }
      } finally {
        if (!cancelled) setFinanceSummaryLoading(false);
      }
    };

    void loadFinanceSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  const renderBalance = (value: FinanceAccountBalanceSummary["latestBalance"]) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "number" && Number.isFinite(value)) return formatINR(value);
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return formatINR(parsed);
      return value;
    }
    return String(value);
  };

  const parseBalanceNumber = (value: FinanceAccountBalanceSummary["latestBalance"]) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const totalBalance = financeSummary.reduce((sum, row) => {
    const value = parseBalanceNumber(row.latestBalance);
    return value == null ? sum : sum + value;
  }, 0);

  const balanceByType = financeSummary.reduce(
    (acc, row) => {
      const type = row.financeAccountType || "Unknown";
      const value = parseBalanceNumber(row.latestBalance) ?? 0;

      if (!acc[type]) {
        acc[type] = { type, total: 0, accounts: [] as FinanceAccountBalanceSummary[] };
      }

      acc[type].total += value;
      acc[type].accounts.push(row);
      return acc;
    },
    {} as Record<string, { type: string; total: number; accounts: FinanceAccountBalanceSummary[] }>,
  );

  const balanceTypeGroups = Object.values(balanceByType)
    .map((group) => ({
      ...group,
      accounts: [...group.accounts].sort((a, b) => a.financeAccountName.localeCompare(b.financeAccountName)),
    }))
    .sort((a, b) => a.type.localeCompare(b.type));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back!</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-card hover:glow transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{resolveStatValue(stat.title, stat.value)}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Fee Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={feeData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="collected" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Account balances */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>Account Balances</CardTitle>
                <p className="text-sm text-muted-foreground">Summarized by account type</p>
              </div>
              {!financeSummaryLoading && !financeSummaryError && financeSummary.length > 0 ? (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Balance</p>
                  <p className="text-lg font-semibold">{formatINR(totalBalance)}</p>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {financeSummaryLoading ? (
              <p className="text-sm text-muted-foreground">Loading account balances...</p>
            ) : financeSummaryError ? (
              <p className="text-sm text-destructive">{financeSummaryError}</p>
            ) : financeSummary.length === 0 ? (
              <p className="text-sm text-muted-foreground">No account balances found.</p>
            ) : (
              <Accordion type="multiple" className="w-full">
                {balanceTypeGroups.map((group) => (
                  <AccordionItem key={group.type} value={group.type}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex w-full items-center justify-between gap-4 pr-2">
                        <div className="min-w-0 text-left">
                          <p className="truncate font-medium">{group.type}</p>
                          <p className="text-xs text-muted-foreground">{group.accounts.length} accounts</p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold">{formatINR(group.total)}</p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Account</TableHead>
                              <TableHead className="text-right">Balance</TableHead>
                              <TableHead className="text-right">As Of</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.accounts.map((account) => (
                              <TableRow key={account.financeAccountId}>
                                <TableCell className="font-medium">{account.financeAccountName}</TableCell>
                                <TableCell className="text-right">{renderBalance(account.latestBalance)}</TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {account.latestTransactionDate ?? "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent admissions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Recent Admissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAdmissions.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.regNo} • {student.class}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-success/10 text-success">
                    {student.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
