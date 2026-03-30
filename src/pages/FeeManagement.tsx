import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader, Printer } from "lucide-react";
import { toast } from "sonner";

type StudentSearchResult = {
  studentId: number;
  name: string;
  admissionNo: string;
  studentEnrollmentClassName: string;
};

type PaymentRecord = {
  schoolId: number;
  paymentDate: string;
  receiptNumber: number;
  paymentAmount: number;
};

type PaymentResponse = {
  message: string;
  data: PaymentRecord[];
};

type PaymentReceiptHead = {
  feeHeadId: number;
  feeHeadName: string;
  amountPaid: number;
};

type PaymentReceiptDetails = {
  receiptNumber: number;
  paymentDate: string;
  paymentMode: string;
  transactionRefId: string | null;
  paymentHeads: PaymentReceiptHead[];
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
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [gatewayTransactionId, setGatewayTransactionId] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState<PaymentReceiptDetails | null>(null);
  const trimmedSearch = search.trim();

  const paymentSummaries = Array.isArray(paymentData?.data) ? paymentData.data : [];

  const enteredTotal = feeSummary
    ? feeSummary.studentFeeItems.reduce((sum, item) => {
        const value = Number.parseFloat(enteredAmounts[item.feeHeadId] || "0");
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0)
    : 0;

  const totalAmountDue = feeSummary
    ? feeSummary.totalAmount - feeSummary.totalAmountPaid
    : 0;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  const formatDisplayDate = (value: string) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getSchoolDisplayName = () => {
    const storedSchoolName = localStorage.getItem("schoolName");
    if (storedSchoolName?.trim()) {
      return storedSchoolName;
    }

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      return "School Payment Receipt";
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      return (
        parsedUser.schoolName ||
        parsedUser.school_name ||
        parsedUser.school?.name ||
        parsedUser.school?.schoolName ||
        parsedUser.user?.schoolName ||
        "School Payment Receipt"
      );
    } catch {
      return "School Payment Receipt";
    }
  };

  const getSessionContext = () => {
    const token = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");
    let schoolId = localStorage.getItem("schoolId");
    let createdByUserId: number | null = null;

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
        createdByUserId =
          parsedUser.id ??
          parsedUser.userId ??
          parsedUser.user_id ??
          parsedUser.user?.id ??
          null;
      } catch {
        // ignore parse errors
      }
    }

    return {
      token,
      schoolId,
      createdByUserId,
    };
  };

  useEffect(() => {
    if (!trimmedSearch || trimmedSearch.length < 3) {
      setStudents([]);
      setLoading(false);
      return;
    }

    const fetchStudents = async () => {
      try {
        setLoading(true);

        const { token, schoolId } = getSessionContext();
        if (!token) {
          toast.error("Token missing. Please login again.");
          return;
        }

        if (!schoolId) {
          toast.error("School ID missing. Unable to search students.");
          return;
        }

        const url = `/api/${schoolId}/students/search?q=${encodeURIComponent(trimmedSearch)}`;
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
  }, [trimmedSearch]);

  const handleSelectStudent = async (selectedStudent: StudentSearchResult) => {
    try {
      setPaymentLoading(true);
      setStudent(selectedStudent);
      setStudents([]);
      setSearch("");
      setPaymentData(null);
      setFeeSummary(null);
      setEnteredAmounts({});
      setPaymentMode("CASH");
      setGatewayTransactionId("");

      const { token, schoolId } = getSessionContext();
      if (!token) {
        toast.error("Token missing. Please login again.");
        return;
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

  const handleOpenReceipt = async (receiptNumber: number) => {
    try {
      setReceiptLoading(true);
      setReceiptOpen(true);
      setReceiptDetails(null);

      const { token, schoolId } = getSessionContext();
      if (!token) {
        toast.error("Token missing. Please login again.");
        return;
      }

      if (!schoolId) {
        toast.error("School ID missing.");
        return;
      }

      const response = await fetch(
        `/api/payments/details?schoolId=${schoolId}&receiptNumber=${receiptNumber}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Failed to fetch receipt details");
      }

      setReceiptDetails({
        receiptNumber: Number(payload.receiptNumber ?? receiptNumber),
        paymentDate: String(payload.paymentDate ?? ""),
        paymentMode: String(payload.paymentMode ?? "-"),
        transactionRefId:
          typeof payload.transactionRefId === "string" && payload.transactionRefId.trim()
            ? payload.transactionRefId
            : null,
        paymentHeads: Array.isArray(payload.paymentHeads) ? payload.paymentHeads : [],
      });
    } catch (error) {
      console.error("Error fetching receipt details:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load receipt details");
      setReceiptOpen(false);
      setReceiptDetails(null);
    } finally {
      setReceiptLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!receiptDetails || !student) {
      return;
    }

    const receiptHtml = `
      <html>
        <head>
          <title>Receipt ${receiptDetails.receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
            .receipt { border: 2px solid #1e293b; padding: 24px; max-width: 760px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; }
            .title { font-size: 28px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
            .subtitle { font-size: 13px; color: #475569; margin-top: 8px; }
            .meta { display: table; width: 100%; margin-bottom: 20px; }
            .meta-row { display: table-row; }
            .meta-label, .meta-value { display: table-cell; padding: 6px 0; }
            .meta-label { font-weight: 700; width: 180px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
            th:last-child, td:last-child { text-align: right; }
            .total { margin-top: 16px; text-align: right; font-size: 18px; font-weight: 700; }
            .footer { margin-top: 36px; display: flex; justify-content: space-between; font-size: 12px; color: #475569; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="title">${getSchoolDisplayName()}</div>
              <div class="subtitle">Official Fee Payment Receipt</div>
            </div>
            <div class="meta">
              <div class="meta-row"><div class="meta-label">Receipt Number</div><div class="meta-value">${receiptDetails.receiptNumber}</div></div>
              <div class="meta-row"><div class="meta-label">Payment Date</div><div class="meta-value">${formatDisplayDate(receiptDetails.paymentDate)}</div></div>
              <div class="meta-row"><div class="meta-label">Student Name</div><div class="meta-value">${student.name}</div></div>
              <div class="meta-row"><div class="meta-label">Admission Number</div><div class="meta-value">${student.admissionNo}</div></div>
              <div class="meta-row"><div class="meta-label">Class</div><div class="meta-value">${student.studentEnrollmentClassName}</div></div>
              <div class="meta-row"><div class="meta-label">Payment Mode</div><div class="meta-value">${receiptDetails.paymentMode}</div></div>
              <div class="meta-row"><div class="meta-label">Transaction Ref ID</div><div class="meta-value">${receiptDetails.transactionRefId ?? "-"}</div></div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Fee Head</th>
                  <th>Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                ${receiptDetails.paymentHeads
                  .map(
                    (head) => `
                      <tr>
                        <td>${head.feeHeadName}</td>
                        <td>${formatCurrency(head.amountPaid)}</td>
                      </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="total">Total: ${formatCurrency(
              receiptDetails.paymentHeads.reduce((sum, head) => sum + head.amountPaid, 0),
            )}</div>
            <div class="footer">
              <span>Generated from school admin panel</span>
              <span>Authorized Signature</span>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      toast.error("Unable to open print window.");
      return;
    }

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleMakePayment = async () => {
    if (!feeSummary || !student) {
      toast.error("Student fee summary is not available.");
      return;
    }

    const feeHeads = feeSummary.studentFeeItems
      .map((item) => {
        const amount = Number.parseFloat(enteredAmounts[item.feeHeadId] || "0");
        return {
          feeHeadId: item.feeHeadId,
          amount,
        };
      })
      .filter((item) => Number.isFinite(item.amount) && item.amount > 0);

    if (feeHeads.length === 0) {
      toast.error("Enter at least one fee head amount.");
      return;
    }

    const { token, schoolId, createdByUserId } = getSessionContext();

    if (!token) {
      toast.error("Token missing. Please login again.");
      return;
    }

    if (!schoolId) {
      toast.error("School ID missing.");
      return;
    }

    if (!createdByUserId) {
      toast.error("Logged in user ID is missing.");
      return;
    }

    const amount = feeHeads.reduce((sum, item) => sum + item.amount, 0);

    try {
      setSubmitLoading(true);

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schoolId: Number(schoolId),
          studentFeeAccountId: feeSummary.studentAccountId,
          amount,
          paymentMode,
          gatewayTransactionId: gatewayTransactionId.trim() || null,
          createdByUserId,
          feeHeads,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Failed to make payment");
      }

      toast.success(payload.message || "Payment submitted successfully");
      await handleSelectStudent(student);
    } catch (error) {
      console.error("Error making payment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to make payment");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Dialog
        open={receiptOpen}
        onOpenChange={(open) => {
          setReceiptOpen(open);
          if (!open) {
            setReceiptDetails(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0">
          <div className="border-b bg-slate-900 px-6 py-5 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl uppercase tracking-[0.18em]">
                {getSchoolDisplayName()}
              </DialogTitle>
              <DialogDescription className="text-slate-200">
                Fee payment receipt preview
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="bg-stone-100 p-6">
            {receiptLoading && (
              <div className="flex min-h-[320px] items-center justify-center">
                <Loader className="h-7 w-7 animate-spin text-slate-600" />
              </div>
            )}

            {!receiptLoading && receiptDetails && student && (
              <div className="mx-auto max-w-3xl rounded-xl border-[10px] border-amber-100 bg-white shadow-xl">
                <div className="border-b border-dashed border-slate-300 px-8 py-8">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Official Receipt
                      </p>
                      <h3 className="mt-2 text-3xl font-bold text-slate-900">
                        Fee Payment Receipt
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        Please retain this receipt for your records.
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Receipt No.</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {receiptDetails.receiptNumber}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 px-8 py-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Student Details
                    </p>
                    <div className="space-y-2 text-sm text-slate-700">
                      <p><span className="font-semibold text-slate-900">Name:</span> {student.name}</p>
                      <p><span className="font-semibold text-slate-900">Admission No:</span> {student.admissionNo}</p>
                      <p><span className="font-semibold text-slate-900">Class:</span> {student.studentEnrollmentClassName}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Payment Details
                    </p>
                    <div className="space-y-2 text-sm text-slate-700">
                      <p><span className="font-semibold text-slate-900">Date:</span> {formatDisplayDate(receiptDetails.paymentDate)}</p>
                      <p><span className="font-semibold text-slate-900">Mode:</span> {receiptDetails.paymentMode}</p>
                      <p><span className="font-semibold text-slate-900">Transaction Ref:</span> {receiptDetails.transactionRefId ?? "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="px-8 pb-8">
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead>Fee Head</TableHead>
                          <TableHead className="text-right">Amount Paid</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receiptDetails.paymentHeads.map((head) => (
                          <TableRow key={`${head.feeHeadId}-${head.feeHeadName}`}>
                            <TableCell>{head.feeHeadName}</TableCell>
                            <TableCell className="text-right">{formatCurrency(head.amountPaid)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-4 border-t border-dashed border-slate-300 pt-5">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Generated from school admin panel
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Amount</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {formatCurrency(
                          receiptDetails.paymentHeads.reduce(
                            (sum, head) => sum + head.amountPaid,
                            0,
                          ),
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button type="button" onClick={handlePrintReceipt} className="gap-2">
                      <Printer className="h-4 w-4" />
                      Print Receipt
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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

          {trimmedSearch.length > 0 && trimmedSearch.length < 3 && (
            <p className="text-sm text-gray-500">Type at least 3 characters</p>
          )}

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

                <div className="grid gap-4 md:grid-cols-3">
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
                  <div className="rounded-lg border bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">Total Amount Due</p>
                    <p className="mt-1 text-2xl font-semibold text-amber-900">
                      {totalAmountDue}
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

                    <form
                      className="rounded-lg border bg-slate-50 p-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleMakePayment();
                      }}
                    >
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
                      <div className="mt-4 space-y-3 border-t pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="payment-mode">Payment Mode</Label>
                          <Select value={paymentMode} onValueChange={setPaymentMode}>
                            <SelectTrigger id="payment-mode">
                              <SelectValue placeholder="Select payment mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CASH">CASH</SelectItem>
                              <SelectItem value="BANK-TRANSFER">BANK-TRANSFER</SelectItem>
                              <SelectItem value="UPI">UPI</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gateway-transaction-id">Gateway Transaction ID</Label>
                          <Input
                            id="gateway-transaction-id"
                            value={gatewayTransactionId}
                            onChange={(e) => setGatewayTransactionId(e.target.value)}
                            placeholder="Enter transaction ID"
                          />
                        </div>
                      </div>
                      <Button className="mt-4 w-full" type="submit" disabled={submitLoading}>
                        {submitLoading ? "Making Payment..." : "Make Payment"}
                      </Button>
                    </form>
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
                <h3 className="font-semibold">Payment Summaries</h3>
                <p className="mt-1 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {paymentData.message}
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Receipt No.</TableHead>
                    <TableHead className="text-right">Payment Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentSummaries.length > 0 ? (
                    paymentSummaries.map((payment, index) => (
                      <TableRow key={`${payment.receiptNumber}-${payment.paymentDate}-${index}`}>
                        <TableCell>{payment.paymentDate}</TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => void handleOpenReceipt(payment.receiptNumber)}
                            className="font-semibold text-blue-700 underline-offset-4 hover:underline"
                          >
                            {payment.receiptNumber}
                          </button>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(payment.paymentAmount)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">
                        No payment summaries available for this student.
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
