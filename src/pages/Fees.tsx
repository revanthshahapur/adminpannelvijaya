import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, DollarSign, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';

const Fees = () => {
  const { students, feeRecords, addPayment } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'UPI',
    transactionId: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSearch = () => {
    const student = students.find(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.regNo.toLowerCase().includes(search.toLowerCase())
    );

    if (student) {
      const feeRecord = feeRecords.find((f) => f.studentId === student.id);
      setSelectedStudent({ ...student, feeRecord });
    } else {
      toast.error('Student not found');
      setSelectedStudent(null);
    }
  };

  const handlePayment = () => {
    if (!selectedStudent || !paymentData.amount || !paymentData.transactionId) {
      toast.error('Please fill in all payment details');
      return;
    }

    const amount = parseFloat(paymentData.amount);
    if (amount <= 0 || amount > selectedStudent.feeRecord.balance) {
      toast.error('Invalid payment amount');
      return;
    }

    addPayment(selectedStudent.id, {
      amount,
      method: paymentData.method,
      transactionId: paymentData.transactionId,
      date: paymentData.date,
    });

    toast.success('Payment recorded successfully');
    generateReceipt();
    setIsPaymentOpen(false);
    handleSearch(); // Refresh data
  };

  const generateReceipt = () => {
    const doc = new jsPDF();
    const amount = parseFloat(paymentData.amount);

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('School Management System', 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.text('Fee Receipt', 105, 30, { align: 'center' });

    // Student details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Student Name: ${selectedStudent.name}`, 20, 50);
    doc.text(`Register No: ${selectedStudent.regNo}`, 20, 60);
    doc.text(`Class: ${selectedStudent.class}`, 20, 70);

    // Payment details
    doc.text(`Amount Paid: ₹${amount.toLocaleString()}`, 20, 90);
    doc.text(`Payment Method: ${paymentData.method}`, 20, 100);
    doc.text(`Transaction ID: ${paymentData.transactionId}`, 20, 110);
    doc.text(`Date: ${paymentData.date}`, 20, 120);

    // Fee summary
    const newBalance = selectedStudent.feeRecord.balance - amount;
    doc.text(`Total Fee: ₹${selectedStudent.feeRecord.totalFee.toLocaleString()}`, 20, 140);
    doc.text(
      `Total Paid: ₹${(selectedStudent.feeRecord.paid + amount).toLocaleString()}`,
      20,
      150
    );
    doc.text(`Balance: ₹${newBalance.toLocaleString()}`, 20, 160);

    // Footer
    doc.setFontSize(10);
    doc.text('This is a computer-generated receipt', 105, 280, { align: 'center' });

    doc.save(`receipt-${selectedStudent.regNo}-${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Fee Management</h1>
        <p className="text-muted-foreground">Search and manage student fee Finance</p>
      </div>

      {/* Search */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name or register number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 glass"
              />
            </div>
            <Button onClick={handleSearch} className="glow">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student fee details */}
      {selectedStudent && selectedStudent.feeRecord && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{selectedStudent.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Register No</p>
                <p className="font-medium">{selectedStudent.regNo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class</p>
                <p className="font-medium">{selectedStudent.class}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{selectedStudent.phone}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fee Details</CardTitle>
                <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                  <DialogTrigger asChild>
                    <Button className="glow">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Add Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={paymentData.amount}
                          onChange={(e) =>
                            setPaymentData({ ...paymentData, amount: e.target.value })
                          }
                          placeholder="Enter amount"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="method">Payment Method</Label>
                        <Select
                          value={paymentData.method}
                          onValueChange={(value) =>
                            setPaymentData({ ...paymentData, method: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UPI">UPI</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Cheque">Cheque</SelectItem>
                            <SelectItem value="Card">Card</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="transactionId">Transaction ID</Label>
                        <Input
                          id="transactionId"
                          value={paymentData.transactionId}
                          onChange={(e) =>
                            setPaymentData({ ...paymentData, transactionId: e.target.value })
                          }
                          placeholder="Enter transaction ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={paymentData.date}
                          onChange={(e) =>
                            setPaymentData({ ...paymentData, date: e.target.value })
                          }
                        />
                      </div>
                      <Button onClick={handlePayment} className="w-full">
                        Record Payment
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="p-4 rounded-lg bg-primary/10">
                  <p className="text-sm text-muted-foreground mb-1">Total Fee</p>
                  <p className="text-2xl font-bold text-primary">
                    ₹{selectedStudent.feeRecord.totalFee.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-success/10">
                  <p className="text-sm text-muted-foreground mb-1">Paid</p>
                  <p className="text-2xl font-bold text-success">
                    ₹{selectedStudent.feeRecord.paid.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-warning/10">
                  <p className="text-sm text-muted-foreground mb-1">Balance</p>
                  <p className="text-2xl font-bold text-warning">
                    ₹{selectedStudent.feeRecord.balance.toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedStudent.feeRecord.Finance.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Payment History</h3>
                  <div className="space-y-2">
                    {selectedStudent.feeRecord.Finance.map((payment: any) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">₹{payment.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.method} • {payment.date} • {payment.transactionId}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">{payment.receiptNo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Fees;
