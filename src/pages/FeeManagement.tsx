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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader, Printer } from "lucide-react";
import svpsLogoUrl from "../assets/SVPS-logo.png";
import { toast } from "sonner";
import { formatINR } from '@/lib/utils';

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
  amountPaid: number | null;
};

type StudentFeeInstallmentHead = {
  id: number;
  feeHeadId: number;
  payableAmount: number;
};

type StudentFeeInstallment = {
  id: number;
  schoolId: number;
  installmentId: number;
  installmentName?: string;
  seqNo?: number;
  academicYearId: number;
  amount: number;
  paidAmount?: number;
  paymentStatus?: string;
  studentFeeInstallmentHeads: StudentFeeInstallmentHead[];
};

type BankOption = {
  id: number;
  name: string;
};

type PaymentModeOption = {
  id: number;
  name: string;
};

type FeeSummaryResponse = {
  studentAccountId: number;
  studentId: number;
  schoolId: number;
  totalAmount: number;
  // Backend returns payableAmount at the top level; use this for Fee Summary Total Amount display.
  payableAmount?: number;
  totalAmountPaid: number;
  studentFeeItems: StudentFeeItem[];
  studentFeeInstallments?: StudentFeeInstallment[];
  // Some backend versions use "entitlements" for installments.
  entitlements?: StudentFeeInstallment[];
};

const FeeManagement = () => {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<StudentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<StudentSearchResult | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  const [feeSummary, setFeeSummary] = useState<FeeSummaryResponse | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState<PaymentReceiptDetails | null>(null);
  const [installmentPaymentOpen, setInstallmentPaymentOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<StudentFeeInstallment | null>(null);
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [paymentModeId, setPaymentModeId] = useState("");
  const [paymentModes, setPaymentModes] = useState<PaymentModeOption[]>([]);
  const [paymentModesLoading, setPaymentModesLoading] = useState(false);
  const [paymentModesLoadedForSchoolId, setPaymentModesLoadedForSchoolId] = useState<string | null>(
    null,
  );
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksLoadedForSchoolId, setBanksLoadedForSchoolId] = useState<string | null>(null);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [gatewayTransactionId, setGatewayTransactionId] = useState("");
  const trimmedSearch = search.trim();

  const paymentSummaries = Array.isArray(paymentData?.data) ? paymentData.data : [];

  const totalPayableAmount = feeSummary ? Number(feeSummary.payableAmount ?? 0) : 0;

  const totalAmountDue = feeSummary ? totalPayableAmount - feeSummary.totalAmountPaid : 0;

  const formatCurrency = (amount: number) => formatINR(amount);

  const normalizeFeeSummary = (payload: unknown): FeeSummaryResponse => {
    const raw = (payload ?? {}) as Record<string, unknown>;
    const payableAmount = Number(raw.payableAmount ?? 0);
    const normalizedPayableAmount = Number.isFinite(payableAmount) ? payableAmount : 0;

    return {
      ...(raw as unknown as FeeSummaryResponse),
      payableAmount: normalizedPayableAmount,
    };
  };

  const feeItemTotals = feeSummary
    ? feeSummary.studentFeeItems.reduce(
        (acc, item) => {
          acc.originalAmount += Number(item.originalAmount ?? 0);
          acc.concessionAmount += Number(item.concessionAmount ?? 0);
          acc.payableAmount += Number(item.payableAmount ?? 0);
          acc.amountPaid += Number(item.amountPaid ?? 0);
          return acc;
        },
        { originalAmount: 0, concessionAmount: 0, payableAmount: 0, amountPaid: 0 },
      )
    : { originalAmount: 0, concessionAmount: 0, payableAmount: 0, amountPaid: 0 };

  const feeHeadNameById = feeSummary
    ? feeSummary.studentFeeItems.reduce<Record<number, string>>((acc, item) => {
        acc[item.feeHeadId] = item.feeHeadName;
        return acc;
      }, {})
    : {};

  const studentFeeInstallmentsRaw = Array.isArray(feeSummary?.studentFeeInstallments)
    ? feeSummary.studentFeeInstallments
    : Array.isArray(feeSummary?.entitlements)
      ? feeSummary.entitlements
      : [];

  const studentFeeInstallments = [...studentFeeInstallmentsRaw].sort((a, b) => {
    const aSeq = Number(a.seqNo);
    const bSeq = Number(b.seqNo);
    const aHasSeq = Number.isFinite(aSeq);
    const bHasSeq = Number.isFinite(bSeq);

    if (aHasSeq && bHasSeq) return aSeq - bSeq;
    if (aHasSeq) return -1;
    if (bHasSeq) return 1;
    return a.installmentId - b.installmentId;
  });

  const nextPayableInstallment =
    studentFeeInstallments.find(
      (installment) => String(installment.paymentStatus ?? "").toUpperCase() !== "COMPLETE",
    ) ?? null;

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

  const normalizeBankOptions = (payload: unknown): BankOption[] => {
    const isRecord = (value: unknown): value is Record<string, unknown> =>
      typeof value === "object" && value !== null;

    const listRaw = Array.isArray(payload)
      ? payload
      : isRecord(payload) && Array.isArray(payload.data)
        ? payload.data
        : [];

    return listRaw
      .map((item) => {
        if (!isRecord(item)) return null;

        const idRaw = item["id"] ?? item["Id"] ?? item["bankId"] ?? item["bank_id"];
        const nameRaw = item["name"] ?? item["Name"] ?? item["bankName"] ?? item["bank_name"];
        const id = Number(idRaw);
        const name = String(nameRaw ?? "").trim();

        if (!Number.isFinite(id) || id <= 0 || !name) return null;
        return { id, name } satisfies BankOption;
      })
      .filter(Boolean) as BankOption[];
  };

  const normalizePaymentModeOptions = (payload: unknown): PaymentModeOption[] => {
    const isRecord = (value: unknown): value is Record<string, unknown> =>
      typeof value === "object" && value !== null;

    const listRaw = Array.isArray(payload)
      ? payload
      : isRecord(payload) && Array.isArray(payload.data)
        ? payload.data
        : [];

    return listRaw
      .map((item) => {
        if (!isRecord(item)) return null;

        const idRaw = item["id"] ?? item["Id"] ?? item["paymentModeId"] ?? item["payment_mode_id"];
        const nameRaw = item["name"] ?? item["Name"] ?? item["paymentMode"] ?? item["payment_mode"];
        const id = Number(idRaw);
        const name = String(nameRaw ?? "").trim();

        if (!Number.isFinite(id) || id <= 0 || !name) return null;
        return { id, name } satisfies PaymentModeOption;
      })
      .filter(Boolean) as PaymentModeOption[];
  };

  const isCashPaymentMode = (mode: string) => String(mode ?? "").trim().toUpperCase() === "CASH";

  useEffect(() => {
    if (!installmentPaymentOpen) return;

    const { token, schoolId } = getSessionContext();
    if (!token || !schoolId) return;

    const schoolIdStr = String(schoolId);
    if (paymentModesLoadedForSchoolId === schoolIdStr && paymentModes.length > 0) return;

    let cancelled = false;
    const loadPaymentModes = async () => {
      try {
        setPaymentModesLoading(true);

        const response = await fetch(`/api/utilities/schools/${schoolIdStr}/payment-modes`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof payload === "object" && payload !== null && "message" in payload
              ? String((payload as Record<string, unknown>).message ?? "")
              : "";
          throw new Error(message || "Failed to load payment modes");
        }

        const options = normalizePaymentModeOptions(payload);
        if (cancelled) return;

        setPaymentModes(options);
        setPaymentModesLoadedForSchoolId(schoolIdStr);

        // If current selection isn't in the list, reset to CASH if present, else first option.
        const hasSelection = options.some((m) => String(m.id) === String(paymentModeId));
        if (!hasSelection) {
          const cash = options.find((m) => isCashPaymentMode(m.name));
          const fallback = cash ?? options[0] ?? null;
          setPaymentModeId(fallback ? String(fallback.id) : "");
          setPaymentMode(fallback?.name || "CASH");
        } else {
          const selected = options.find((m) => String(m.id) === String(paymentModeId)) ?? null;
          if (selected && selected.name !== paymentMode) {
            setPaymentMode(selected.name);
          }
        }
      } catch (error) {
        console.error("Error loading payment modes:", error);
        if (!cancelled) {
          setPaymentModes([]);
          setPaymentModesLoadedForSchoolId(null);
          toast.error(error instanceof Error ? error.message : "Failed to load payment modes");
        }
      } finally {
        if (!cancelled) setPaymentModesLoading(false);
      }
    };

    void loadPaymentModes();
    return () => {
      cancelled = true;
    };
    // paymentMode intentionally included so we can correct it if not in the loaded list.
  }, [
    installmentPaymentOpen,
    paymentMode,
    paymentModeId,
    paymentModes.length,
    paymentModesLoadedForSchoolId,
  ]);

  useEffect(() => {
    if (!installmentPaymentOpen) return;

    const selectedPaymentMode =
      paymentModes.find((mode) => String(mode.id) === String(paymentModeId)) ??
      paymentModes.find((mode) => mode.name === paymentMode) ??
      null;

    const modeName = selectedPaymentMode?.name ?? paymentMode;

    if (isCashPaymentMode(modeName)) {
      setSelectedBankId("");
      return;
    }

    const { token, schoolId } = getSessionContext();
    if (!token || !schoolId) return;

    const schoolIdStr = String(schoolId);
    if (banksLoadedForSchoolId === schoolIdStr && banks.length > 0) return;

    let cancelled = false;
    const loadBanks = async () => {
      try {
        setBanksLoading(true);

        const response = await fetch(`/api/utilities/schools/${schoolIdStr}/banks`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof payload === "object" && payload !== null && "message" in payload
              ? String((payload as Record<string, unknown>).message ?? "")
              : "";
          throw new Error(message || "Failed to load banks");
        }

        const options = normalizeBankOptions(payload);
        if (cancelled) return;
        setBanks(options);
        setBanksLoadedForSchoolId(schoolIdStr);
      } catch (error) {
        console.error("Error loading banks:", error);
        if (!cancelled) {
          setBanks([]);
          setBanksLoadedForSchoolId(null);
          toast.error(error instanceof Error ? error.message : "Failed to load banks");
        }
      } finally {
        if (!cancelled) setBanksLoading(false);
      }
    };

    void loadBanks();
    return () => {
      cancelled = true;
    };
  }, [
    installmentPaymentOpen,
    paymentMode,
    paymentModeId,
    paymentModes,
    banks.length,
    banksLoadedForSchoolId,
  ]);

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
      setInstallmentPaymentOpen(false);
      setSelectedInstallment(null);
      setPaymentMode("CASH");
      setPaymentModeId("");
      setSelectedBankId("");
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
            .header { position: relative; text-align: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; min-height: 72px; }
            .logo { position: absolute; left: 0; top: 50%; transform: translateY(-50%); }
            .logo img { width: 64px; height: auto; object-fit: contain; display: block; }
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
              <div class="logo">
                <img src="${svpsLogoUrl}" alt="SVPS Logo" />
              </div>
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

  const handleConfirmInstallmentPayment = async () => {
    if (!feeSummary || !student) {
      toast.error("Student fee summary is not available.");
      return;
    }

    if (!selectedInstallment) {
      toast.error("Select an installment to pay.");
      return;
    }
    if (String(selectedInstallment.paymentStatus ?? "").toUpperCase() === "COMPLETE") {
      toast.error("This installment is already paid.");
      return;
    }
    if (nextPayableInstallment && selectedInstallment.id !== nextPayableInstallment.id) {
      toast.error("Please pay installments in sequence.");
      return;
    }

    const feeHeads = (Array.isArray(selectedInstallment.studentFeeInstallmentHeads)
      ? selectedInstallment.studentFeeInstallmentHeads
      : []
    )
      .map((head) => ({
        feeHeadId: head.feeHeadId,
        amount: Number(head.payableAmount || 0),
      }))
      .filter((head) => Number.isFinite(head.amount) && head.amount > 0);

    if (feeHeads.length === 0) {
      toast.error("No payable fee heads found for this installment.");
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

    const selectedPaymentMode =
      paymentModes.find((mode) => String(mode.id) === String(paymentModeId)) ??
      paymentModes.find((mode) => mode.name === paymentMode) ??
      null;

    if (!selectedPaymentMode) {
      toast.error("Please select a payment mode.");
      return;
    }

    const amount = Number(selectedInstallment.amount || 0);
    const installmentId = Number(selectedInstallment.installmentId);
    const requiresBank = !isCashPaymentMode(selectedPaymentMode.name);
    const bankId = requiresBank ? Number(selectedBankId) : null;

    if (requiresBank) {
      if (!selectedBankId || !Number.isFinite(bankId) || (bankId ?? 0) <= 0) {
        toast.error("Please select a bank.");
        return;
      }
    }

    if (!Number.isFinite(installmentId) || installmentId <= 0) {
      toast.error("Installment ID is missing.");
      return;
    }

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
          installmentId,
          amount,
          paymentMode: selectedPaymentMode.name,
          paymentModeId: selectedPaymentMode.id,
          ...(requiresBank ? { bankId } : {}),
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
      setInstallmentPaymentOpen(false);
      setSelectedInstallment(null);
      setGatewayTransactionId("");
      setPaymentMode("CASH");
      setPaymentModeId("");
      setSelectedBankId("");
      await handleSelectStudent(student);
    } catch (error) {
      console.error("Error making payment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to make payment");
    } finally {
      setSubmitLoading(false);
    }
  };

  const selectedPaymentModeOption =
    paymentModes.find((mode) => String(mode.id) === String(paymentModeId)) ??
    paymentModes.find((mode) => mode.name === paymentMode) ??
    null;
  const paymentModeNameForUi = selectedPaymentModeOption?.name ?? paymentMode;
  const showBankDropdown = Boolean(paymentModeNameForUi) && !isCashPaymentMode(paymentModeNameForUi);

  return (
    <div className="space-y-6 p-6">
      <Dialog
        open={installmentPaymentOpen}
        onOpenChange={(open) => {
          setInstallmentPaymentOpen(open);
          if (!open) {
            setSelectedInstallment(null);
            setGatewayTransactionId("");
            setPaymentMode("CASH");
            setPaymentModeId("");
            setSelectedBankId("");
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Make Installment Payment</DialogTitle>
            <DialogDescription>
              {student ? `${student.name} (${student.admissionNo})` : "Student"}
              {selectedInstallment
                ? ` - ${selectedInstallment.installmentName || `Installment ${selectedInstallment.installmentId}`}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border bg-slate-50 p-3">
              <p className="text-sm text-slate-600">Installment Amount</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {formatCurrency(selectedInstallment?.amount ?? 0)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="installment-payment-mode">Payment Mode</Label>
              <Select
                value={paymentModeId}
                onValueChange={(value) => {
                  setPaymentModeId(value);
                  const selected =
                    paymentModes.find((mode) => String(mode.id) === String(value)) ?? null;
                  if (selected) {
                    setPaymentMode(selected.name);
                  } else {
                    setPaymentMode("");
                  }
                }}
              >
                <SelectTrigger
                  id="installment-payment-mode"
                  disabled={paymentModesLoading && paymentModes.length === 0}
                >
                  <SelectValue
                    placeholder={paymentModesLoading ? "Loading payment modes..." : "Select payment mode"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {paymentModesLoading && paymentModes.length === 0 && (
                    <SelectItem value="__loading" disabled>
                      Loading payment modes...
                    </SelectItem>
                  )}
                  {!paymentModesLoading && paymentModes.length === 0 && (
                    <SelectItem value="__empty" disabled>
                      No payment modes found
                    </SelectItem>
                  )}
                  {paymentModes.map((mode) => (
                    <SelectItem key={mode.id} value={String(mode.id)}>
                      {mode.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showBankDropdown && (
              <div className="space-y-2">
                <Label htmlFor="installment-bank">Bank</Label>
                <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                  <SelectTrigger id="installment-bank" disabled={banksLoading && banks.length === 0}>
                    <SelectValue placeholder={banksLoading ? "Loading banks..." : "Select bank"} />
                  </SelectTrigger>
                  <SelectContent>
                    {banksLoading && banks.length === 0 && (
                      <SelectItem value="__loading" disabled>
                        Loading banks...
                      </SelectItem>
                    )}
                    {!banksLoading && banks.length === 0 && (
                      <SelectItem value="__empty" disabled>
                        No banks found
                      </SelectItem>
                    )}
                    {banks.map((bank) => (
                      <SelectItem key={bank.id} value={String(bank.id)}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="installment-gateway-transaction-id">Gateway Transaction ID</Label>
              <Input
                id="installment-gateway-transaction-id"
                value={gatewayTransactionId}
                onChange={(e) => setGatewayTransactionId(e.target.value)}
                placeholder="Enter transaction ID"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInstallmentPaymentOpen(false)}
                disabled={submitLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleConfirmInstallmentPayment()}
                disabled={submitLoading || !selectedInstallment}
              >
                {submitLoading ? "Making Payment..." : "Confirm Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                      {formatCurrency(totalPayableAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-700">Total Amount Paid</p>
                    <p className="mt-1 text-2xl font-semibold text-emerald-900">
                      {formatCurrency(feeSummary.totalAmountPaid)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">Total Amount Due</p>
                    <p className="mt-1 text-2xl font-semibold text-amber-900">
                      {formatCurrency(totalAmountDue)}
                    </p>
                  </div>
                </div>

                {feeSummary.studentFeeItems.length > 0 ? (
                  <div className="overflow-x-auto rounded-md border">
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
                            <TableCell className="text-right">{formatCurrency(item.originalAmount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.concessionAmount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.payableAmount)}</TableCell>
                            <TableCell className="text-right">
                              {typeof item.amountPaid === "number" ? formatCurrency(item.amountPaid) : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-slate-50 font-bold">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right">{formatCurrency(feeItemTotals.originalAmount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(feeItemTotals.concessionAmount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(feeItemTotals.payableAmount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(feeItemTotals.amountPaid)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-md border px-4 py-6 text-center text-gray-500">
                    No fee summary items available for this student.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className={`grid gap-6 ${feeSummary ? "lg:grid-cols-2" : ""}`}>
            {feeSummary && (
              <Card>
                <CardContent className="p-4">
                  {studentFeeInstallments.length > 0 ? (
                    <>
                      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="font-semibold">Installments</h3>
                        <p className="text-sm text-slate-600">
                          Total:{" "}
                          {formatCurrency(
                            studentFeeInstallments.reduce((sum, installment) => sum + (installment.amount || 0), 0),
                          )}
                        </p>
                      </div>

                      <Accordion type="multiple" className="w-full">
                        {studentFeeInstallments.map((installment) => {
                          const heads = Array.isArray(installment.studentFeeInstallmentHeads)
                            ? installment.studentFeeInstallmentHeads
                            : [];
                          const headsTotal = heads.reduce((sum, head) => sum + (head.payableAmount || 0), 0);
                          const isPaymentComplete =
                            String(installment.paymentStatus ?? "").toUpperCase() === "COMPLETE";
                          const isNextPayable =
                            !isPaymentComplete && Boolean(nextPayableInstallment) && nextPayableInstallment.id === installment.id;

                          return (
                            <AccordionItem key={installment.id} value={`${installment.id}`}>
                              <AccordionTrigger>
                                <div className="grid w-full grid-cols-1 gap-2 text-left sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                                  <div className="text-slate-900">
                                    {installment.installmentName || `Installment ${installment.installmentId}`}
                                  </div>
                                  <div className="text-sm text-slate-600 text-center">
                                    {formatCurrency(installment.amount)}{" "}
                                    <span className="text-slate-400">
                                      (Heads: {formatCurrency(headsTotal)})
                                    </span>
                                  </div>
                                  <div className="sm:text-right">
                                    {!isPaymentComplete && (
                                      <Button
                                        type="button"
                                        size="sm"
                                        disabled={!isNextPayable}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setSelectedInstallment(installment);
                                          setPaymentMode("CASH");
                                          setGatewayTransactionId("");
                                          setInstallmentPaymentOpen(true);
                                        }}
                                      >
                                        Make Payment
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="grid gap-3">
                                  <div className="overflow-x-auto rounded-md border">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Fee Head</TableHead>
                                          <TableHead className="text-right">Payable Amount</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {heads.length > 0 ? (
                                          heads.map((head) => (
                                            <TableRow key={head.id}>
                                              <TableCell>
                                                {feeHeadNameById[head.feeHeadId] ?? `Fee Head ${head.feeHeadId}`}
                                              </TableCell>
                                              <TableCell className="text-right">
                                                {formatCurrency(head.payableAmount)}
                                              </TableCell>
                                            </TableRow>
                                          ))
                                        ) : (
                                          <TableRow>
                                            <TableCell colSpan={2} className="text-center text-gray-500">
                                              No installment heads available.
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>

                                  <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                                    <p>
                                      <span className="font-medium text-slate-800">Academic Year:</span>{" "}
                                      {installment.academicYearId}
                                    </p>
                                    <p>
                                      <span className="font-medium text-slate-800">Installment Record:</span>{" "}
                                      {installment.id}
                                    </p>
                                    <p>
                                      <span className="font-medium text-slate-800">School:</span> {installment.schoolId}
                                    </p>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </>
                  ) : (
                    <div className="rounded-md border px-4 py-6 text-center text-gray-500">
                      No installment details available for this student.
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
          </div>
        </>
      )}
    </div>
  );
};

export default FeeManagement;
