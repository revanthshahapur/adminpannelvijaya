import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR } from "@/lib/utils";

type StudentFeePreviewProps = {
  studentData: any;
  onFeeFinalized?: (studentData: any) => void;
  onClose?: () => void;
  /**
   * If true, auto-closes (calls `onClose`) shortly after a successful finalization.
   * Default is false to match the fee finalization behavior from student search flow.
   */
  autoCloseOnSuccess?: boolean;
};

const StudentFeePreview = ({
  studentData,
  onFeeFinalized,
  onClose,
  autoCloseOnSuccess = false,
}: StudentFeePreviewProps) => {
  const [isFeeSubmitted, setIsFeeSubmitted] = useState(false);
  const [concessionAmount, setConcessionAmount] = useState<number>(0);
  const [concessionType, setConcessionType] = useState<string>("");
  const [concessionReference, setConcessionReference] = useState<string>("");
  const [expandedInstallmentId, setExpandedInstallmentId] = useState<number | null>(null);

  const schoolConcessions = useMemo(
    () => (Array.isArray(studentData?.schoolConcessions) ? studentData.schoolConcessions : []),
    [studentData]
  );

  useEffect(() => {
    if (!studentData) {
      return;
    }

    const schoolConcessionNames = schoolConcessions
      .map((item: any) => item?.name)
      .filter((name: string | undefined): name is string => Boolean(name));
    const defaultConcessionType = schoolConcessionNames.find(
      (name) => name === "NO CONCESSION"
    );
    const selectedConcessionType =
      defaultConcessionType ||
      (schoolConcessionNames.includes(studentData.feeStructure?.concessionType)
        ? studentData.feeStructure.concessionType
        : schoolConcessionNames[0]) ||
      studentData.feeStructure?.concessionType ||
      "";

    setConcessionType(selectedConcessionType);
    setConcessionAmount(
      Number(
        schoolConcessions.find((item: any) => item?.name === selectedConcessionType)
          ?.maxConcessionAmount ?? 0
      )
    );
    setConcessionReference("");
    setExpandedInstallmentId(null);
    setIsFeeSubmitted(false);
  }, [schoolConcessions, studentData]);

  const totalAmount = studentData
    ? studentData.feeStructure.items.reduce(
        (sum: number, item: any) => sum + item.amount,
        0
      )
    : 0;

  const totalDiscountableAmount = studentData
    ? studentData.feeStructure.items.reduce((sum: number, item: any) => {
        return item.isDiscountAllowed ? sum + item.amount : sum;
      }, 0)
    : 0;

  const totalDiscount = Math.min(Math.max(concessionAmount, 0), totalDiscountableAmount);
  const finalAmount = totalAmount - totalDiscount;
  const installments = studentData?.installments || [];
  const feeHeadFinalAmounts = studentData
    ? studentData.feeStructure.items.reduce((acc: Record<number, number>, item: any) => {
        const itemDiscount = item.isDiscountAllowed && totalDiscountableAmount > 0
          ? (item.amount / totalDiscountableAmount) * totalDiscount
          : 0;
        acc[item.feeHeadId] = item.amount - itemDiscount;
        return acc;
      }, {})
    : {};

  const getConcessionAmountByName = (name: string, concessions: any[]) => {
    if (!name || name === "NO CONCESSION") {
      return 0;
    }
    const matchedConcession = concessions.find((item: any) => item?.name === name);
    return Number(matchedConcession?.maxConcessionAmount ?? 0);
  };

  const handleConcessionTypeChange = (value: string) => {
    setConcessionType(value);
    setConcessionAmount(getConcessionAmountByName(value, schoolConcessions));
    if (!value || value === "NO CONCESSION") {
      setConcessionReference("");
    }
  };

  const handleFeeSubmit = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Token missing");
        return;
      }

      if (!studentData) {
        return;
      }

      const isConcessionSelected = Boolean(concessionType && concessionType !== "NO CONCESSION");
      if (isConcessionSelected && !concessionReference.trim()) {
        toast.error("Concession reference is required when a concession is selected");
        return;
      }

      const selectedConcession = isConcessionSelected
        ? schoolConcessions.find((item: any) => item?.name === concessionType)
        : null;

      if (isConcessionSelected && schoolConcessions.length > 0 && !selectedConcession) {
        toast.error("Selected concession is not available. Please re-select concession type.");
        return;
      }

      const payload = {
        schoolId: studentData.student.schoolId,
        studentId: studentData.student.id,
        enrollmentId: studentData.enrollmentId,
        academicYearId: studentData.feeStructure.academicYearId,
        feeStructureId: studentData.feeStructure.id,
        discountPercentage: 0,
        concessionAmount,
        concessionId: isConcessionSelected
          ? (selectedConcession?.id ??
              selectedConcession?.concessionId ??
              selectedConcession?.concession_id ??
              null)
          : null,
        concessionName: isConcessionSelected
          ? (selectedConcession?.name ?? concessionType ?? null)
          : null,
        concessionReference: isConcessionSelected ? concessionReference.trim() : null,
      };

      const response = await fetch(
        "/api/student-fees-accounts/registerStudentFeeAccount",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      toast.success("Fee submitted successfully");
      setIsFeeSubmitted(true);

      if (onFeeFinalized) {
        onFeeFinalized(data);
      }

      if (autoCloseOnSuccess && onClose) {
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submit failed");
    }
  };

  if (!studentData) {
    return null;
  }

  const isConcessionSelected = Boolean(concessionType && concessionType !== "NO CONCESSION");
  const isReferenceMissing = isConcessionSelected && !concessionReference.trim();

  return (
    <div className="space-y-4">
      {isFeeSubmitted && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">Success</span>
              <div>
                <h3 className="text-lg font-bold text-green-700">Congratulations!</h3>
                <p className="text-sm text-green-600">Student admission completed successfully</p>
                <p className="text-xs text-green-700 mt-1">
                  {studentData.student.fullName} has been registered and fee finalized
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Fee Preview</h2>

          <table className="w-full border mt-4">
            <thead>
              <tr className="border bg-gray-100">
                <th className="p-2 border">Fee Head</th>
                <th className="p-2 border text-right">Amount</th>
                <th className="p-2 border text-right">Discount</th>
                <th className="p-2 border text-right">Final</th>
              </tr>
            </thead>

            <tbody>
              {studentData.feeStructure.items.map((item: any) => {
                const discount = item.isDiscountAllowed && totalDiscountableAmount > 0
                  ? (item.amount / totalDiscountableAmount) * totalDiscount
                  : 0;
                const final = item.amount - discount;

                return (
                  <tr key={item.feeHeadId} className="border hover:bg-gray-50">
                    <td className="p-2 border">{item.name}</td>

                    <td className="p-2 border relative group cursor-pointer text-right">
                      {formatINR(Number(item.amount || 0))}
                      <div className="absolute hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded -top-7 left-1/2 -translate-x-1/2">
                        {item.isDiscountAllowed
                          ? `Max Discount: ${item.maxDiscountPercentage}%`
                          : "Discount not applicable for this fee"}
                      </div>
                    </td>

                    <td className="p-2 border text-right">{formatINR(discount)}</td>
                    <td className="p-2 border text-right">{formatINR(final)}</td>
                  </tr>
                );
              })}
              <tr className="border bg-gray-100 font-semibold">
                <td className="p-2 border">Total</td>
                <td className="p-2 border text-right">{formatINR(totalAmount)}</td>
                <td className="p-2 border text-right">{formatINR(totalDiscount)}</td>
                <td className="p-2 border text-right">{formatINR(finalAmount)}</td>
              </tr>
            </tbody>
          </table>

          {!isFeeSubmitted && (
            <>
              {/*
                Concession reference is mandatory for any concession type other than "NO CONCESSION".
                Concession amount is derived from concession type, so it must not be editable.
              */}
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_auto] items-end gap-3">
                <div className="min-w-0 space-y-1 text-slate-700">
                  <span className="block text-sm">Concession Type</span>
                  <Select value={concessionType || undefined} onValueChange={handleConcessionTypeChange}>
                    <SelectTrigger className="w-full bg-white text-black">
                      <SelectValue placeholder="Concession Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolConcessions.map((item: any) => (
                        <SelectItem key={String(item?.id ?? item?.concessionId ?? item?.name)} value={item.name}>
                          {item.name}
                        </SelectItem>
                      ))}
                      {schoolConcessions.length === 0 && concessionType ? (
                        <SelectItem value={concessionType}>{concessionType}</SelectItem>
                      ) : null}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-0 space-y-1 text-slate-700">
                  <span className="block text-sm">
                    Concession Reference{isConcessionSelected ? <span className="text-red-600"> *</span> : null}
                  </span>
                  <Select
                    value={concessionReference || undefined}
                    onValueChange={setConcessionReference}
                    disabled={!isConcessionSelected}
                  >
                    <SelectTrigger
                      className={[
                        "w-full bg-white text-black",
                        isReferenceMissing ? "border-red-500 focus:ring-red-500" : "",
                      ].join(" ")}
                    >
                      <SelectValue placeholder="Select Reference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Annappa">Annappa</SelectItem>
                      <SelectItem value="Nagaraj">Nagaraj</SelectItem>
                      <SelectItem value="Devaraj">Devaraj</SelectItem>
                      <SelectItem value="Sunil">Sunil</SelectItem>
                      <SelectItem value="Principal">Principal</SelectItem>
                      <SelectItem value="Vice-Principal">Vice-Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-32 space-y-1 text-red-500">
                  <span className="block text-sm">Concession Amount</span>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-full bg-slate-50 disabled:cursor-not-allowed disabled:opacity-100"
                    value={concessionAmount}
                    disabled
                    title="Populated from concession type"
                  />
                </div>
              </div>

              <p className="text-right font-bold text-green-600">
                Final: {formatINR(finalAmount)}
              </p>

              <div className="flex justify-end mt-4">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white px-6"
                  onClick={handleFeeSubmit}
                  disabled={isReferenceMissing}
                >
                  Finalise Fee
                </Button>
              </div>
            </>
          )}

          {isFeeSubmitted && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-700 font-semibold">Fee Finalized Successfully</p>
              <p className="text-green-600 text-sm mt-1">Final Amount: {formatINR(finalAmount)}</p>
            </div>
          )}

          {installments.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-semibold">Installments</h3>

              <table className="w-full border">
                <thead>
                  <tr className="border bg-gray-100">
                    <th className="p-2 border text-left">Installment</th>
                    <th className="p-2 border text-left">Due Date</th>
                    <th className="p-2 border text-right">Amount</th>
                    <th className="p-2 border text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((installment: any) => {
                    const isExpanded = expandedInstallmentId === installment.id;
                    const recalculatedInstallmentAmount = (installment.installmentHeads || []).reduce(
                      (sum: number, head: any) => {
                        const feeHeadFinalAmount = Number(feeHeadFinalAmounts[head.feeHeadId] ?? head.amount ?? 0);
                        return sum + (feeHeadFinalAmount * Number(head.percentage || 0)) / 100;
                      },
                      0
                    );

                    return (
                      <Fragment key={installment.id}>
                        <tr className="border hover:bg-gray-50">
                          <td className="p-2 border">{installment.name}</td>
                          <td className="p-2 border">{installment.dueDate}</td>
                          <td className="p-2 border text-right">{formatINR(recalculatedInstallmentAmount)}</td>
                          <td className="p-2 border text-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setExpandedInstallmentId(isExpanded ? null : installment.id)}
                            >
                              {isExpanded ? "Hide Heads" : "View Heads"}
                            </Button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="border bg-gray-50">
                            <td className="p-3 border" colSpan={4}>
                              <table className="w-full border bg-white">
                                <thead>
                                  <tr className="border bg-slate-100">
                                    <th className="p-2 border text-left">Fee Head</th>
                                    <th className="p-2 border text-right">Percentage</th>
                                    <th className="p-2 border text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {installment.installmentHeads?.map((head: any) => {
                                    const feeHeadFinalAmount = Number(
                                      feeHeadFinalAmounts[head.feeHeadId] ?? head.amount ?? 0
                                    );
                                    const recalculatedHeadAmount =
                                      (feeHeadFinalAmount * Number(head.percentage || 0)) / 100;

                                    return (
                                      <tr key={head.id} className="border">
                                        <td className="p-2 border">{head.feeHeadName}</td>
                                        <td className="p-2 border text-right">{head.percentage}%</td>
                                        <td className="p-2 border text-right">{formatINR(recalculatedHeadAmount)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentFeePreview;
