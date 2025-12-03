import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from '@/hooks/use-toast';
import { Plus, Banknote, Smartphone, FileText, Building2, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

const paymentMethods = [
  { id: 'cash', label: 'Cash', icon: Banknote, color: 'text-green-500' },
  { id: 'upi', label: 'UPI / Scanner', icon: Smartphone, color: 'text-purple-500' },
  { id: 'check', label: 'Check', icon: FileText, color: 'text-blue-500' },
  { id: 'bank', label: 'Bank Transfer', icon: Building2, color: 'text-orange-500' },
];

const PaymentDialog = () => {
  const { students, feeRecords, addPayment } = useAppStore();
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [upiId, setUpiId] = useState('school@upi');

  const selectedFeeRecord = feeRecords.find(
    (r) => r.studentId === parseInt(selectedStudent)
  );

  const resetForm = () => {
    setSelectedStudent('');
    setAmount('');
    setMethod('');
    setTransactionId('');
    setCheckNumber('');
    setBankName('');
  };

  const handleSubmit = () => {
    if (!selectedStudent || !amount || !method) {
      toast({
        title: 'Missing Information',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFeeRecord && parsedAmount > selectedFeeRecord.balance) {
      toast({
        title: 'Amount Exceeds Balance',
        description: `Maximum payable amount is ₹${selectedFeeRecord.balance.toLocaleString()}`,
        variant: 'destructive',
      });
      return;
    }

    let txnId = transactionId;
    if (method === 'cash') {
      txnId = `CASH${Date.now()}`;
    } else if (method === 'check') {
      txnId = `CHK${checkNumber}`;
    } else if (method === 'bank') {
      txnId = transactionId || `BANK${Date.now()}`;
    }

    addPayment(parseInt(selectedStudent), {
      amount: parsedAmount,
      method: paymentMethods.find((m) => m.id === method)?.label || method,
      transactionId: txnId,
      date: new Date().toISOString().split('T')[0],
    });

    toast({
      title: 'Payment Recorded',
      description: `₹${parsedAmount.toLocaleString()} payment recorded successfully`,
    });

    resetForm();
    setOpen(false);
  };

  const MethodIcon = paymentMethods.find((m) => m.id === method)?.icon || CreditCard;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Collect Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Collect Fee Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label>Select Student *</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="glass-card">
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent className="bg-background border">
                {students.map((student) => {
                  const feeRecord = feeRecords.find((r) => r.studentId === student.id);
                  return (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      <span className="flex items-center gap-2">
                        {student.name} ({student.regNo})
                        {feeRecord && (
                          <span className="text-xs text-muted-foreground">
                            - Balance: ₹{feeRecord.balance.toLocaleString()}
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Fee Summary */}
          {selectedFeeRecord && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-card border-primary/20">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Fee</p>
                      <p className="text-lg font-bold">₹{selectedFeeRecord.totalFee.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Paid</p>
                      <p className="text-lg font-bold text-green-500">₹{selectedFeeRecord.paid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="text-lg font-bold text-destructive">₹{selectedFeeRecord.balance.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label>Amount (₹) *</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glass-card text-lg font-semibold"
            />
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Payment Method *</Label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((pm) => {
                const Icon = pm.icon;
                const isSelected = method === pm.id;
                return (
                  <motion.button
                    key={pm.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMethod(pm.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-border/50 glass-card hover:border-primary/50'
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${isSelected ? 'text-primary' : pm.color}`} />
                    <span className={`font-medium ${isSelected ? 'text-primary' : ''}`}>
                      {pm.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Method-specific Fields */}
          <AnimatePresence mode="wait">
            {method && (
              <motion.div
                key={method}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {method === 'cash' && (
                  <Card className="glass-card border-green-500/30 bg-green-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Banknote className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="font-medium">Cash Payment</p>
                          <p className="text-sm text-muted-foreground">
                            Transaction ID will be auto-generated
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {method === 'upi' && (
                  <Card className="glass-card border-purple-500/30 bg-purple-500/5">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">UPI Payment</p>
                          <p className="text-sm text-muted-foreground">
                            Scan QR or use UPI ID
                          </p>
                        </div>
                        <div className="p-2 bg-white rounded-lg">
                          <QRCodeSVG
                            value={`upi://pay?pa=${upiId}&pn=School&am=${amount || '0'}&cu=INR`}
                            size={100}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>UPI ID</Label>
                        <Input
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="glass-card"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Transaction ID / UTR *</Label>
                        <Input
                          placeholder="Enter UPI transaction ID"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="glass-card"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {method === 'check' && (
                  <Card className="glass-card border-blue-500/30 bg-blue-500/5">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-medium">Check Payment</p>
                          <p className="text-sm text-muted-foreground">
                            Enter check details
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Check Number *</Label>
                          <Input
                            placeholder="Enter check number"
                            value={checkNumber}
                            onChange={(e) => setCheckNumber(e.target.value)}
                            className="glass-card"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Bank Name</Label>
                          <Input
                            placeholder="Enter bank name"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="glass-card"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {method === 'bank' && (
                  <Card className="glass-card border-orange-500/30 bg-orange-500/5">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-orange-500" />
                        <div>
                          <p className="font-medium">Bank Transfer</p>
                          <p className="text-sm text-muted-foreground">
                            NEFT / RTGS / IMPS
                          </p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50 border">
                        <p className="text-xs text-muted-foreground mb-1">Bank Details</p>
                        <p className="text-sm font-mono">A/C: 1234567890123456</p>
                        <p className="text-sm font-mono">IFSC: SBIN0001234</p>
                        <p className="text-sm font-mono">Name: School Fee Account</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Transaction Reference *</Label>
                        <Input
                          placeholder="Enter transaction reference"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="glass-card"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            className="w-full h-12 text-lg gap-2"
            disabled={!selectedStudent || !amount || !method}
          >
            <MethodIcon className="h-5 w-5" />
            Record Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
