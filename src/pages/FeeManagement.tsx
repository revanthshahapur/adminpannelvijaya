import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader } from "lucide-react";
import { toast } from "sonner";

type StudentSearchResult = {
  studentId: number;
  name: string;
  admissionNo: string;
  studentEnrollmentClassName: string;
};

type PaymentFeeHead = {
  id: number;
  feeHeadId: number;
  paymentDate: string;
  amountPaid: number;
  receiptNumber: number;
  createdBy: number;
};

type PaymentRecord = {
  id: number;
  schoolId: number;
  studentFeeAccountId: number;
  paymentDate: string;
  amountPaid: number;
  paymentMode: string;
  gatewayTxnId: string | null;
  receiptNumber: number;
  createdBy: number;
  feeHeads: PaymentFeeHead[];
};

type PaymentResponse = {
  message: string;
  data: PaymentRecord[];
};

type StudentFeeItem = {
  feeHeadId: number;
  feeHeadName: string;
  originalAmount: number;
  concessionAmount: number;
  payableAmount: number;
  amountPaid: number;
};

type FeeSummaryResponse = {
  studentAccountId: number;
  studentId: number;
  schoolId: number;
  totalAmount: number;
  totalAmountPaid: number;
  studentFeeItems: StudentFeeItem[];
};

const FeeManagement = () => {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<StudentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<StudentSearchResult | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  const [feeSummary, setFeeSummary] = useState<FeeSummaryResponse | null>(null);
  const [enteredAmounts, setEnteredAmounts] = useState<Record<number, string>>({});
  const [paymentLoading, setPaymentLoading] = useState(false);

  const paymentRows =
    paymentData?.data.flatMap((payment) =>
      payment.feeHeads.length > 0
        ? payment.feeHeads.map((feeHead) => ({
            paymentId: payment.id,
            paymentDate: payment.paymentDate,
            receiptNumber: payment.receiptNumber,
            paymentMode: payment.paymentMode,
            feeHeadId: feeHead.feeHeadId,
            feeHeadAmountPaid: feeHead.amountPaid,
            totalAmountPaid: payment.amountPaid,
            gatewayTxnId: payment.gatewayTxnId,
          }))
        : [
            {
              paymentId: payment.id,
              paymentDate: payment.paymentDate,
              receiptNumber: payment.receiptNumber,
              paymentMode: payment.paymentMode,
              feeHeadId: null,
              feeHeadAmountPaid: null,
              totalAmountPaid: payment.amountPaid,
              gatewayTxnId: payment.gatewayTxnId,
            },
          ],
    ) ?? [];

  const enteredTotal = feeSummary
    ? feeSummary.studentFeeItems.reduce((sum, item) => {
        const value = Number.parseFloat(enteredAmounts[item.feeHeadId] || "0");
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0)
    : 0;

  useEffect(() => {
    if (!search.trim()) {
      setStudents([]);
      return;
    }

    const fetchStudents = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("authToken");
        if (!token) {
          toast.error("Token missing. Please login again.");
          return;
        }

        let schoolId = localStorage.getItem("schoolId");
        if (!schoolId) {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              schoolId =
                parsedUser.schoolId ||
                parsedUser.school_id ||
                parsedUser.school?.id ||
                parsedUser.user?.schoolId ||
                parsedUser.user?.school_id;
            } catch {
              // ignore parse errors
            }
          }
        }

        if (!schoolId) {
          toast.error("School ID missing. Unable to search students.");
          return;
        }

        const url = `/api/${schoolId}/students/search?q=${encodeURIComponent(search)}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch students");
        }

        setStudents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching students:", error);
        toast.error("Unable to load students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [search]);

  const handleSelectStudent = async (selectedStudent: StudentSearchResult) => {
    try {
      setPaymentLoading(true);
      setStudent(selectedStudent);
      setStudents([]);
      setSearch("");
      setPaymentData(null);
      setFeeSummary(null);
      setEnteredAmounts({});

      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Token missing. Please login again.");
        return;
      }

      let schoolId = localStorage.getItem("schoolId");
      if (!schoolId) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            schoolId =
              parsedUser.schoolId ||
              parsedUser.school_id ||
              parsedUser.school?.id ||
              parsedUser.user?.schoolId ||
              parsedUser.user?.school_id;
          } catch {
            // ignore parse errors
          }
        }
      }

      if (!schoolId) {
        toast.error("School ID missing.");
        return;
      }

      const paymentUrl = `/api/payments?schoolId=${schoolId}&studentId=${selectedStudent.studentId}`;
      const feeSummaryUrl =
        `/api/student-fees-accounts/summary?schoolId=${schoolId}&studentId=${selectedStudent.studentId}`;

      const [paymentResponse, feeSummaryResponse] = await Promise.all([
        fetch(paymentUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(feeSummaryUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const paymentPayload = await paymentResponse.json();
      const feeSummaryPayload = await feeSummaryResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(paymentPayload.message || "Failed to fetch payment details");
      }

      if (!feeSummaryResponse.ok) {
        throw new Error(feeSummaryPayload.message || "Failed to fetch fee summary");
      }

      setPaymentData(paymentPayload as PaymentResponse);
      setFeeSummary(feeSummaryPayload as FeeSummaryResponse);
    } catch (error) {
      console.error("Error fetching payment data:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load payment details");
      setStudent(null);
      setPaymentData(null);
      setFeeSummary(null);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleAmountChange = (feeHeadId: number, value: string) => {
    const sanitizedValue = value.replace(/[^\d.]/g, "");
    const parts = sanitizedValue.split(".");
    const normalizedValue =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : sanitizedValue;

    setEnteredAmounts((current) => ({
      ...current,
      [feeHeadId]: normalizedValue,
    }));
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex gap-3">
            <Input
              placeholder="Search Student by Name or Admission No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {loading && <Loader className="h-5 w-5 animate-spin" />}
          </div>

          {students.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded-md border bg-white shadow-lg">
              {students.map((s) => (
                <div
                  key={s.studentId}
                  onClick={() => handleSelectStudent(s)}
                  className="grid cursor-pointer grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)] items-center gap-4 border-b p-3 last:border-b-0 hover:bg-gray-100"
                >
                  <p className="min-w-0 truncate font-semibold">{s.name}</p>
                  <p className="min-w-0 truncate text-sm text-gray-600">
                    Admission No: {s.admissionNo}
                  </p>
                  <p className="min-w-0 truncate text-sm text-gray-500">
                    {s.studentEnrollmentClassName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!student && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            Search student to view payment details
          </CardContent>
        </Card>
      )}

      {student && paymentLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader className="mx-auto mb-2 h-6 w-6 animate-spin" />
            Loading payment details...
          </CardContent>
        </Card>
      )}

      {student && !paymentLoading && paymentData && (
        <>
          <Card>
            <CardContent className="grid gap-4 p-4 md:grid-cols-3">
              <p><b>Name:</b> {student.name}</p>
              <p><b>Admission No:</b> {student.admissionNo}</p>
              <p><b>Class:</b> {student.studentEnrollmentClassName}</p>
            </CardContent>
          </Card>

          {feeSummary && (
            <Card>
              <CardContent className="space-y-4 p-4">
                <h3 className="font-semibold">Fee Summary</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">Total Amount</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {feeSummary.totalAmount}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-700">Total Amount Paid</p>
                    <p className="mt-1 text-2xl font-semibold text-emerald-900">
                      {feeSummary.totalAmountPaid}
                    </p>
                  </div>
                </div>

                {feeSummary.studentFeeItems.length > 0 ? (
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(260px,1.4fr)]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fee Head Name</TableHead>
                          <TableHead className="text-right">Original Amount</TableHead>
                          <TableHead className="text-right">Concession Amount</TableHead>
                          <TableHead className="text-right">Payable Amount</TableHead>
                          <TableHead className="text-right">Amount Paid</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feeSummary.studentFeeItems.map((item, index) => (
                          <TableRow key={`${item.feeHeadName}-${index}`}>
                            <TableCell>{item.feeHeadName}</TableCell>
                            <TableCell className="text-right">{item.originalAmount}</TableCell>
                            <TableCell className="text-right">{item.concessionAmount}</TableCell>
                            <TableCell className="text-right">{item.payableAmount}</TableCell>
                            <TableCell className="text-right">{item.amountPaid}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="rounded-lg border bg-slate-50 p-4">
                      <div className="border-b pb-3">
                        <h4 className="font-medium">Amount</h4>
                      </div>

                      <div className="space-y-3 pt-4">
                        {feeSummary.studentFeeItems.map((item) => (
                          <div key={item.feeHeadId} className="space-y-1">
                            <p className="text-sm text-slate-600">{item.feeHeadName}</p>
                            <div className="flex items-center rounded-md border bg-white px-3">
                              <span className="pr-2 text-sm text-slate-500">₹</span>
                              <Input
                                value={enteredAmounts[item.feeHeadId] ?? ""}
                                onChange={(e) => handleAmountChange(item.feeHeadId, e.target.value)}
                                inputMode="decimal"
                                placeholder="0"
                                className="border-0 px-0 shadow-none focus-visible:ring-0"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 border-t pt-4">
                        <p className="text-sm text-slate-600">Total Amount</p>
                        <div className="mt-2 flex items-center rounded-md border bg-slate-100 px-3 py-2">
                          <span className="pr-2 text-sm text-slate-500">₹</span>
                          <span className="font-medium text-slate-900">
                            {enteredTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border px-4 py-6 text-center text-gray-500">
                    No fee summary items available for this student.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="overflow-x-auto p-4">
              <div className="mb-4">
                <h3 className="font-semibold">Fee Details</h3>
                <p className="mt-1 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {paymentData.message}
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Receipt No.</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Fee Head ID</TableHead>
                    <TableHead className="text-right">Fee Head Amount</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead>Gateway Txn ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentRows.length > 0 ? (
                    paymentRows.map((row, index) => (
                      <TableRow key={`${row.paymentId}-${row.feeHeadId ?? "summary"}-${index}`}>
                        <TableCell>{row.paymentId}</TableCell>
                        <TableCell>{row.paymentDate}</TableCell>
                        <TableCell>{row.receiptNumber}</TableCell>
                        <TableCell>{row.paymentMode}</TableCell>
                        <TableCell>{row.feeHeadId ?? "-"}</TableCell>
                        <TableCell className="text-right">
                          {row.feeHeadAmountPaid ?? "-"}
                        </TableCell>
                        <TableCell className="text-right">{row.totalAmountPaid}</TableCell>
                        <TableCell>{row.gatewayTxnId ?? "-"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500">
                        No fee details available for this student.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default FeeManagement;
