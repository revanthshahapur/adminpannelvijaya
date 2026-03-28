import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

const dummyStudents = [
  {
    id: 1,
    name: "Rahul Sharma",
    class: "10",
    section: "A",
    feeStructure: [
      { feeHead: "Tuition Fee", amount: 20000, discount: 10 },
      { feeHead: "Stationary", amount: 3000, discount: 5 },
      { feeHead: "Transport", amount: 5000, discount: 0 },
      { feeHead: "Uniform", amount: 2000, discount: 0 },
    ],
  },
];

const paymentModes = ["Cash", "Online", "Bank Transfer", "UPI"];

const FeeManagement = () => {
  const [search, setSearch] = useState("");
  const [student, setStudent] = useState<any>(null);

  const [rowPayments, setRowPayments] = useState<any>({});
  const [payments, setPayments] = useState<any[]>([]);

  const [transactionNo, setTransactionNo] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");

  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const handleSearch = () => {
    const found = dummyStudents.find((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
    setStudent(found || null);
    setRowPayments({});
  };

  const getFinal = (f: any) => {
    const discountAmt = (f.amount * f.discount) / 100;
    return f.amount - discountAmt;
  };

  const getPaid = (feeHead: string) => {
    return payments
      .filter((p) => p.feeHead === feeHead)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const handleConfirmPayment = () => {
    if (!student) return;
    const newPayments: any[] = [];

    student.feeStructure.forEach((f: any, i: number) => {
      const pay = rowPayments[i] || 0;
      if (pay > 0) {
        newPayments.push({
          id: Date.now() + i,
          feeHead: f.feeHead,
          amount: pay,
          mode: paymentMode,
          transactionNo,
          date: new Date().toLocaleDateString(),
          receiptNo: "RCPT" + Math.floor(Math.random() * 100000),
        });
      }
    });

    setPayments([...payments, ...newPayments]);
    setRowPayments({});
    setTransactionNo("");
  };

  return (
    <div className="p-6 space-y-6">

      {/* 🔍 Search */}
      <Card>
        <CardContent className="p-4 flex gap-3">
          <Input
            placeholder="Search Student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={handleSearch}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </CardContent>
      </Card>

      {!student && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            🔍 Search student to view fee details
          </CardContent>
        </Card>
      )}

      {student && (
        <>
          {/* 👤 Student Info */}
          <Card>
            <CardContent className="p-4 grid grid-cols-3 gap-4">
              <p><b>Name:</b> {student.name}</p>
              <p><b>Class:</b> {student.class}</p>
              <p><b>Section:</b> {student.section}</p>
            </CardContent>
          </Card>

          {/* 📊 Fee Table */}
          <Card>
            <CardContent className="p-4 overflow-x-auto">
              <table className="w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Fee Head</th>
                    <th className="border p-2">Amount</th>
                    <th className="border p-2">Discount</th>
                    <th className="border p-2">Final</th>
                    <th className="border p-2">Paid</th>
                    <th className="border p-2">Due</th>
                    <th className="border p-2">Paying</th>
                  </tr>
                </thead>
                <tbody>
                  {student.feeStructure.map((f: any, i: number) => {
                    const final = getFinal(f);
                    const paid = getPaid(f.feeHead);
                    const due = final - paid;
                    const paying = rowPayments[i] || 0;
                    const updatedDue = due - paying;

                    return (
                      <tr key={i}>
                        <td className="border p-2">{f.feeHead}</td>
                        <td className="border p-2">₹ {f.amount}</td>
                        <td className="border p-2">{f.discount}%</td>
                        <td className="border p-2">₹ {final}</td>
                        <td className="border p-2">₹ {paid}</td>
                        <td className="border p-2 text-red-600">₹ {updatedDue}</td>
                        <td className="border p-2">
                          <Input
                            type="number"
                            value={paying}
                            onChange={(e) =>
                              setRowPayments({
                                ...rowPayments,
                                [i]: Number(e.target.value),
                              })
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/*  Summary + Payment */}
          <Card>
            <CardContent className="p-4 space-y-4">

              <div className="grid grid-cols-3 gap-4 text-sm">
                <p><b>Total Amount:</b> ₹ {student.feeStructure.reduce((sum: number, f: any) => sum + getFinal(f), 0)}</p>
                <p><b>Total Paying:</b> ₹ {Object.values(rowPayments).reduce((sum: any, v: any) => sum + v, 0)}</p>
                <p className="text-red-600">
                  <b>Total Due:</b> ₹ {student.feeStructure.reduce((sum: number, f: any, i: number) => {
                    const final = getFinal(f);
                    const paid = getPaid(f.feeHead);
                    const paying = rowPayments[i] || 0;
                    return sum + (final - paid - paying);
                  }, 0)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Transaction Number"
                  value={transactionNo}
                  onChange={(e) => setTransactionNo(e.target.value)}
                />

                <select
                  className="border p-2 rounded"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  {paymentModes.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleConfirmPayment}>
                   Confirm Payment
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 📄 Payment History */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-3">Payment History</h2>

              <table className="w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Date</th>
                    <th className="border p-2">Amount Paid</th>
                    <th className="border p-2">Receipt No</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="border p-2">{p.date}</td>
                      <td className="border p-2">₹ {p.amount}</td>
                      <td
                        className="border p-2 text-blue-600 cursor-pointer"
                        onClick={() => setSelectedReceipt(p)}
                      >
                        {p.receiptNo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* 🧾 RECEIPT POPUP */}
          {selectedReceipt && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white w-[700px] p-6 rounded-lg shadow-lg print:w-full print:shadow-none">

                {/* Header */}
                <div className="text-center border-b pb-3">
                  <h1 className="text-xl font-bold"></h1>
                  <p className="text-xs"></p>
                  <p className="text-xs"></p>
                  <h2 className="mt-2 font-semibold">Receipt</h2>
                </div>

                {/* Top Info */}
                <div className="flex justify-between mt-3 text-sm">
                  <p><b>Receipt No:</b> {selectedReceipt.receiptNo}</p>
                  <p><b>Date:</b> {selectedReceipt.date}</p>
                </div>

                <div className="mt-2 text-sm">
                  <p><b>Name:</b> {student.name}</p>
                  <p><b>Class:</b> {student.class} - {student.section}</p>
                  <p><b>Transaction Mode:</b> {selectedReceipt.mode}</p>
                  <p><b>Transaction No:</b> {selectedReceipt.transactionNo}</p>
                </div>

                {/* Fee Table with Payment Particulars */}
                <table className="w-full border mt-4 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-center">Sr No</th>
                      <th className="border p-2">Fee Head</th>
                      <th className="border p-2">Total Amount</th>
                      <th className="border p-2">Amount Paid</th>
                      <th className="border p-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.feeStructure.map((f: any, i: number) => {
                      const final = getFinal(f);
                      const totalPaid = payments
                        .filter((p) => p.feeHead === f.feeHead)
                        .reduce((sum, p) => sum + p.amount, 0);
                      const currentPaid = selectedReceipt.feeHead === f.feeHead ? selectedReceipt.amount : 0;
                      const balance = final - totalPaid;
                      return (
                        <tr key={i}>
                          <td className="border p-2 text-center">{i + 1}</td>
                          <td className="border p-2">{f.feeHead}</td>
                          <td className="border p-2 text-right">₹ {final}</td>
                          <td className="border p-2 text-right">
                            ₹ {payments
                              .filter((p) => p.feeHead === f.feeHead && p.receiptNo === selectedReceipt.receiptNo)
                              .reduce((sum, p) => sum + p.amount, 0)}
                          </td>
                          <td className="border p-2 text-red-600 text-right">₹ {balance}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Summary */}
                <div className="mt-4 text-sm space-y-1">
                  <p><b>Total Amount:</b> ₹ {student.feeStructure.reduce((sum: number, f: any) => sum + getFinal(f), 0)}</p>
                  <p><b>Amount Paid (This Receipt):</b> ₹ {selectedReceipt.amount}</p>
                  <p className="text-red-600"><b>Balance:</b> ₹ {student.feeStructure.reduce((sum: number, f: any) => sum + getFinal(f), 0) - payments.reduce((s, p) => s + p.amount, 0)}</p>
                </div>

                {/* Footer */}
                {/* <div className="mt-6 flex justify-between text-sm">
                  <p>Paid By: {selectedReceipt.mode}</p>
                  <p>Signature</p>
                </div> */}

                {/* Buttons */}
                <div className="flex justify-end gap-3 mt-6 print:hidden">
                  <Button variant="outline" onClick={() => setSelectedReceipt(null)}>Close</Button>
                  <Button onClick={() => window.print()}>🖨 Print</Button>
                </div>

              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
};

export default FeeManagement;