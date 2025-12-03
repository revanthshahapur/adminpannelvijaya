import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  Users, IndianRupee, FileText, Download, Send, 
  ChevronsUpDown, Check, Calculator, Building2,
  CalendarIcon, Printer, Wallet, TrendingDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SalaryRecord {
  id: number;
  facultyId: number;
  facultyName: string;
  department: string;
  month: string;
  year: number;
  basicSalary: number;
  hra: number;
  da: number;
  ta: number;
  medicalAllowance: number;
  specialAllowance: number;
  pfDeduction: number;
  professionalTax: number;
  tds: number;
  lopDays: number;
  lopDeduction: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
  paidDate?: string;
  transactionId?: string;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Payroll = () => {
  const { faculty } = useAppStore();
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([
    {
      id: 1,
      facultyId: 1,
      facultyName: 'Dr. Suresh Kumar',
      department: 'Mathematics',
      month: 'November',
      year: 2024,
      basicSalary: 45000,
      hra: 18000,
      da: 9000,
      ta: 3000,
      medicalAllowance: 2000,
      specialAllowance: 5000,
      pfDeduction: 5400,
      professionalTax: 200,
      tds: 2500,
      lopDays: 0,
      lopDeduction: 0,
      grossSalary: 82000,
      totalDeductions: 8100,
      netSalary: 73900,
      status: 'paid',
      paidDate: '2024-11-30',
      transactionId: 'SAL202411001'
    },
    {
      id: 2,
      facultyId: 2,
      facultyName: 'Priya Menon',
      department: 'Science',
      month: 'November',
      year: 2024,
      basicSalary: 38000,
      hra: 15200,
      da: 7600,
      ta: 2500,
      medicalAllowance: 2000,
      specialAllowance: 4000,
      pfDeduction: 4560,
      professionalTax: 200,
      tds: 1800,
      lopDays: 2,
      lopDeduction: 2533,
      grossSalary: 69300,
      totalDeductions: 9093,
      netSalary: 60207,
      status: 'pending',
    }
  ]);

  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [payslipDialogOpen, setPayslipDialogOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<SalaryRecord | null>(null);
  const [facultySearchOpen, setFacultySearchOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Salary form state
  const [basicSalary, setBasicSalary] = useState('45000');
  const [hraPercent, setHraPercent] = useState('40');
  const [daPercent, setDaPercent] = useState('20');
  const [ta, setTa] = useState('3000');
  const [medicalAllowance, setMedicalAllowance] = useState('2000');
  const [specialAllowance, setSpecialAllowance] = useState('5000');
  const [pfPercent, setPfPercent] = useState('12');
  const [professionalTax, setProfessionalTax] = useState('200');
  const [tdsPercent, setTdsPercent] = useState('5');
  const [lopDays, setLopDays] = useState('0');

  const selectedFacultyData = faculty.find((f) => f.id.toString() === selectedFaculty);

  const calculateSalary = () => {
    const basic = parseFloat(basicSalary) || 0;
    const hra = (basic * (parseFloat(hraPercent) || 0)) / 100;
    const da = (basic * (parseFloat(daPercent) || 0)) / 100;
    const taAmount = parseFloat(ta) || 0;
    const medical = parseFloat(medicalAllowance) || 0;
    const special = parseFloat(specialAllowance) || 0;
    
    const grossSalary = basic + hra + da + taAmount + medical + special;
    
    const pf = (basic * (parseFloat(pfPercent) || 0)) / 100;
    const pt = parseFloat(professionalTax) || 0;
    const tds = (grossSalary * (parseFloat(tdsPercent) || 0)) / 100;
    const lop = parseInt(lopDays) || 0;
    const perDaySalary = grossSalary / 30;
    const lopDeduction = perDaySalary * lop;
    
    const totalDeductions = pf + pt + tds + lopDeduction;
    const netSalary = grossSalary - totalDeductions;

    return {
      basic,
      hra,
      da,
      ta: taAmount,
      medical,
      special,
      grossSalary,
      pf,
      pt,
      tds,
      lop,
      lopDeduction,
      totalDeductions,
      netSalary
    };
  };

  const calc = calculateSalary();

  const handleProcessSalary = () => {
    if (!selectedFaculty) {
      toast({ title: 'Select Faculty', description: 'Please select a faculty member', variant: 'destructive' });
      return;
    }

    const newRecord: SalaryRecord = {
      id: salaryRecords.length + 1,
      facultyId: parseInt(selectedFaculty),
      facultyName: selectedFacultyData?.name || '',
      department: selectedFacultyData?.department || '',
      month: selectedMonth,
      year: selectedYear,
      basicSalary: calc.basic,
      hra: calc.hra,
      da: calc.da,
      ta: calc.ta,
      medicalAllowance: calc.medical,
      specialAllowance: calc.special,
      pfDeduction: calc.pf,
      professionalTax: calc.pt,
      tds: calc.tds,
      lopDays: calc.lop,
      lopDeduction: calc.lopDeduction,
      grossSalary: calc.grossSalary,
      totalDeductions: calc.totalDeductions,
      netSalary: calc.netSalary,
      status: 'pending',
    };

    setSalaryRecords([...salaryRecords, newRecord]);
    toast({ title: 'Salary Processed', description: `Salary for ${selectedFacultyData?.name} has been processed` });
    setProcessDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedFaculty('');
    setBasicSalary('45000');
    setLopDays('0');
  };

  const handlePaySalary = (record: SalaryRecord) => {
    const updated = salaryRecords.map((r) =>
      r.id === record.id
        ? { ...r, status: 'paid' as const, paidDate: new Date().toISOString().split('T')[0], transactionId: `SAL${Date.now().toString().slice(-10)}` }
        : r
    );
    setSalaryRecords(updated);
    toast({ title: 'Salary Paid', description: `₹${record.netSalary.toLocaleString()} transferred to ${record.facultyName}` });
  };

  const openPayslip = (record: SalaryRecord) => {
    setSelectedPayslip(record);
    setPayslipDialogOpen(true);
  };

  const totalPending = salaryRecords.filter((r) => r.status === 'pending').reduce((sum, r) => sum + r.netSalary, 0);
  const totalPaid = salaryRecords.filter((r) => r.status === 'paid').reduce((sum, r) => sum + r.netSalary, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Faculty Payroll</h1>
          <p className="text-muted-foreground">Manage salary processing, deductions and payslips</p>
        </div>
        <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Calculator className="h-4 w-4" />
              Process Salary
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Process Faculty Salary
              </DialogTitle>
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-6 py-4">
              {/* Left Column - Input */}
              <div className="space-y-4">
                {/* Faculty Selection */}
                <div className="space-y-2">
                  <Label>Select Faculty *</Label>
                  <Popover open={facultySearchOpen} onOpenChange={setFacultySearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between glass-card">
                        {selectedFacultyData ? (
                          <span>{selectedFacultyData.name} - {selectedFacultyData.department}</span>
                        ) : (
                          <span className="text-muted-foreground">Search faculty...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 bg-background border">
                      <Command>
                        <CommandInput placeholder="Search by name..." />
                        <CommandList>
                          <CommandEmpty>No faculty found.</CommandEmpty>
                          <CommandGroup>
                            {faculty.map((f) => (
                              <CommandItem
                                key={f.id}
                                value={f.name}
                                onSelect={() => {
                                  setSelectedFaculty(f.id.toString());
                                  setFacultySearchOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", selectedFaculty === f.id.toString() ? "opacity-100" : "opacity-0")} />
                                <div className="flex flex-col">
                                  <span>{f.name}</span>
                                  <span className="text-xs text-muted-foreground">{f.department}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Month & Year */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between glass-card">
                          {selectedMonth}
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0 bg-background border">
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              {months.map((m) => (
                                <CommandItem key={m} onSelect={() => setSelectedMonth(m)}>
                                  <Check className={cn("mr-2 h-4 w-4", selectedMonth === m ? "opacity-100" : "opacity-0")} />
                                  {m}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="glass-card" />
                  </div>
                </div>

                <Separator />

                {/* Earnings */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-500 flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" /> Earnings
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Basic Salary</Label>
                      <Input type="number" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} className="glass-card" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">HRA (%)</Label>
                      <Input type="number" value={hraPercent} onChange={(e) => setHraPercent(e.target.value)} className="glass-card" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">DA (%)</Label>
                      <Input type="number" value={daPercent} onChange={(e) => setDaPercent(e.target.value)} className="glass-card" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">TA</Label>
                      <Input type="number" value={ta} onChange={(e) => setTa(e.target.value)} className="glass-card" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Medical</Label>
                      <Input type="number" value={medicalAllowance} onChange={(e) => setMedicalAllowance(e.target.value)} className="glass-card" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Special Allowance</Label>
                      <Input type="number" value={specialAllowance} onChange={(e) => setSpecialAllowance(e.target.value)} className="glass-card" />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Deductions */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-destructive flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" /> Deductions
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">PF (%)</Label>
                      <Input type="number" value={pfPercent} onChange={(e) => setPfPercent(e.target.value)} className="glass-card" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Professional Tax</Label>
                      <Input type="number" value={professionalTax} onChange={(e) => setProfessionalTax(e.target.value)} className="glass-card" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">TDS (%)</Label>
                      <Input type="number" value={tdsPercent} onChange={(e) => setTdsPercent(e.target.value)} className="glass-card" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">LOP Days</Label>
                      <Input type="number" value={lopDays} onChange={(e) => setLopDays(e.target.value)} className="glass-card" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Summary */}
              <div className="space-y-4">
                <Card className="glass-card border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Salary Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Earnings Summary */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-green-500">Earnings</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Basic</span><span>₹{calc.basic.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">HRA</span><span>₹{calc.hra.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">DA</span><span>₹{calc.da.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">TA</span><span>₹{calc.ta.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Medical</span><span>₹{calc.medical.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Special</span><span>₹{calc.special.toLocaleString()}</span></div>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Gross Salary</span>
                        <span className="text-green-500">₹{calc.grossSalary.toLocaleString()}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Deductions Summary */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-destructive">Deductions</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">PF</span><span>₹{calc.pf.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Professional Tax</span><span>₹{calc.pt.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">TDS</span><span>₹{calc.tds.toLocaleString()}</span></div>
                        {calc.lop > 0 && (
                          <div className="flex justify-between"><span className="text-muted-foreground">LOP ({calc.lop} days)</span><span>₹{calc.lopDeduction.toLocaleString()}</span></div>
                        )}
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total Deductions</span>
                        <span className="text-destructive">₹{calc.totalDeductions.toLocaleString()}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Net Salary */}
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Net Salary</span>
                        <span className="text-2xl font-bold text-primary">₹{calc.netSalary.toLocaleString()}</span>
                      </div>
                    </div>

                    <Button onClick={handleProcessSalary} className="w-full gap-2">
                      <Calculator className="h-4 w-4" />
                      Process Salary
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Faculty</p>
                  <p className="text-2xl font-bold">{faculty.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card border-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-yellow-500/10">
                  <IndianRupee className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payroll</p>
                  <p className="text-2xl font-bold">₹{totalPending.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <IndianRupee className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold">₹{totalPaid.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Salary Records */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
        <h2 className="text-xl font-semibold">Salary Records</h2>
        {salaryRecords.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No salary records found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {salaryRecords.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass-card hover:glow transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{record.facultyName}</p>
                          <p className="text-sm text-muted-foreground">{record.department} • {record.month} {record.year}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Net Salary</p>
                          <p className="text-lg font-bold text-primary">₹{record.netSalary.toLocaleString()}</p>
                        </div>
                        <Badge variant={record.status === 'paid' ? 'default' : 'secondary'} className={record.status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                          {record.status === 'paid' ? 'Paid' : 'Pending'}
                        </Badge>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openPayslip(record)}>
                            <FileText className="h-4 w-4 mr-1" />
                            Payslip
                          </Button>
                          {record.status === 'pending' && (
                            <Button size="sm" onClick={() => handlePaySalary(record)}>
                              <Send className="h-4 w-4 mr-1" />
                              Pay
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Payslip Dialog */}
      <Dialog open={payslipDialogOpen} onOpenChange={setPayslipDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Salary Slip - {selectedPayslip?.month} {selectedPayslip?.year}
            </DialogTitle>
          </DialogHeader>
          {selectedPayslip && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl bg-primary/5 border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Employee:</span> <span className="font-medium">{selectedPayslip.facultyName}</span></div>
                  <div><span className="text-muted-foreground">Department:</span> <span className="font-medium">{selectedPayslip.department}</span></div>
                  <div><span className="text-muted-foreground">Pay Period:</span> <span className="font-medium">{selectedPayslip.month} {selectedPayslip.year}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <Badge variant={selectedPayslip.status === 'paid' ? 'default' : 'secondary'} className={selectedPayslip.status === 'paid' ? 'bg-green-500' : ''}>{selectedPayslip.status}</Badge></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="glass-card border-green-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-500">Earnings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Basic</span><span>₹{selectedPayslip.basicSalary.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">HRA</span><span>₹{selectedPayslip.hra.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">DA</span><span>₹{selectedPayslip.da.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">TA</span><span>₹{selectedPayslip.ta.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Medical</span><span>₹{selectedPayslip.medicalAllowance.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Special</span><span>₹{selectedPayslip.specialAllowance.toLocaleString()}</span></div>
                    <Separator />
                    <div className="flex justify-between font-semibold"><span>Gross</span><span className="text-green-500">₹{selectedPayslip.grossSalary.toLocaleString()}</span></div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-destructive/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-destructive">Deductions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">PF</span><span>₹{selectedPayslip.pfDeduction.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Prof. Tax</span><span>₹{selectedPayslip.professionalTax.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">TDS</span><span>₹{selectedPayslip.tds.toLocaleString()}</span></div>
                    {selectedPayslip.lopDays > 0 && (
                      <div className="flex justify-between"><span className="text-muted-foreground">LOP ({selectedPayslip.lopDays}d)</span><span>₹{selectedPayslip.lopDeduction.toLocaleString()}</span></div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold"><span>Total</span><span className="text-destructive">₹{selectedPayslip.totalDeductions.toLocaleString()}</span></div>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass-card border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">Net Salary</span>
                    <span className="text-2xl font-bold text-primary">₹{selectedPayslip.netSalary.toLocaleString()}</span>
                  </div>
                  {selectedPayslip.transactionId && (
                    <p className="text-xs text-muted-foreground mt-2">Transaction ID: {selectedPayslip.transactionId}</p>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" className="gap-2">
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button className="gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payroll;
