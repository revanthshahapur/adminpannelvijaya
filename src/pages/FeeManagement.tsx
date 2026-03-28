import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Printer } from "lucide-react";

const dummyStudents = [
  {
    id: 1,
    name: "Rahul Sharma",
    class: "10",
    section: "A",
    feeStructure: [
      { feeHead: "Tuition Fee", amount: 20000 },
      { feeHead: "Stationary", amount: 3000 },
      { feeHead: "Transport", amount: 5000 },
      { feeHead: "Uniform", amount: 2000 },
    ],
  },
];

const paymentModes = ["Cash", "Online", "Bank Transfer", "UPI"];

const FeeManagement = () => {
  const [search, setSearch] = useState("");
  const [student, setStudent] = useState<any>(null);

  const [rowDiscounts, setRowDiscounts] = useState<any>({});
  const [rowPayments, setRowPayments] = useState<any>({});
  const [rowModes, setRowModes] = useState<any>({});

  const [payments, setPayments] = useState<any[]>([]);

  const handleSearch = () => {
    const found = dummyStudents.find((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
    setStudent(found || null);

    setRowDiscounts({});
    setRowPayments({});
    setRowModes({});
  };

  const handleConfirmPayment = () => {
    const newPayments: any[] = [];

    student.feeStructure.forEach((f: any, i: number) => {
      const pay = rowPayments[i] || 0;

      if (pay > 0) {
        newPayments.push({
          id: Date.now() + i,
          feeHead: f.feeHead,
          amount: pay,
          mode: rowModes[i] || "Cash",

          // ✅ AUTO GENERATED
          transactionNo: "TXN" + Date.now() + i,

          date: new Date().toLocaleDateString(),
          receiptNo: "RCPT" + Math.floor(Math.random() * 100000),
        });
      }
    });

    setPayments([...payments, ...newPayments]);

    setRowPayments({});
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

          {/* 📊 MAIN TABLE */}
          <Card>
            <CardContent className="p-4 overflow-x-auto">
              <table className="w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Fee Head</th>
                    <th className="border p-2">Amount</th>
                    <th className="border p-2">Discount %</th>
                    <th className="border p-2">Final</th>
                    <th className="border p-2">Paid</th>
                    <th className="border p-2">Due</th>
                    <th className="border p-2">Paying</th>
                    <th className="border p-2">Mode</th>
                    <th className="border p-2">Transaction No</th>
                  </tr>
                </thead>

                <tbody>
                  {student.feeStructure.map((f: any, i: number) => {
                    const discount = rowDiscounts[i] || 0;
                    const disAmt = (f.amount * discount) / 100;
                    const final = f.amount - disAmt;

                    const paid = payments
                      .filter((p) => p.feeHead === f.feeHead)
                      .reduce((sum, p) => sum + p.amount, 0);

                    const due = final - paid;

                    return (
                      <tr key={i}>
                        <td className="border p-2">{f.feeHead}</td>

                        <td className="border p-2">₹ {f.amount}</td>

                        <td className="border p-2">
                          <Input
                            type="number"
                            className="w-16"
                            value={discount}
                            onChange={(e) =>
                              setRowDiscounts({
                                ...rowDiscounts,
                                [i]: Number(e.target.value),
                              })
                            }
                          />
                        </td>

                        <td className="border p-2">₹ {final}</td>

                        <td className="border p-2">₹ {paid}</td>

                        <td className="border p-2 text-red-600">₹ {due}</td>

                        <td className="border p-2">
                          <Input
                            type="number"
                            className="w-20"
                            value={rowPayments[i] || ""}
                            onChange={(e) =>
                              setRowPayments({
                                ...rowPayments,
                                [i]: Number(e.target.value),
                              })
                            }
                          />
                        </td>

                        <td className="border p-2">
                          <select
                            className="border p-1 rounded"
                            value={rowModes[i] || "Cash"}
                            onChange={(e) =>
                              setRowModes({
                                ...rowModes,
                                [i]: e.target.value,
                              })
                            }
                          >
                            {paymentModes.map((m) => (
                              <option key={m}>{m}</option>
                            ))}
                          </select>
                        </td>

                        {/* ✅ Auto transaction */}
                        <td className="border p-2 text-gray-400 text-xs">
                          Auto
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* ✅ Confirm Button */}
              <div className="flex justify-end mt-4">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleConfirmPayment}
                >
                   Confirm Payment
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 📄 Payment History */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-3">Payment History</h2>

              <table className="w-full border text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-1">Date</th>
                    <th className="border p-1">Fee Head</th>
                    <th className="border p-1">Amount</th>
                    <th className="border p-1">Mode</th>
                    <th className="border p-1">Txn</th>
                    <th className="border p-1">Receipt</th>
                    <th className="border p-1">Print</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="border p-1">{p.date}</td>
                      <td className="border p-1">{p.feeHead}</td>
                      <td className="border p-1">₹ {p.amount}</td>
                      <td className="border p-1">{p.mode}</td>
                      <td className="border p-1">{p.transactionNo}</td>
                      <td className="border p-1">{p.receiptNo}</td>
                      <td className="border p-1 text-center">
                        <Printer className="w-4 h-4 cursor-pointer" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default FeeManagement;