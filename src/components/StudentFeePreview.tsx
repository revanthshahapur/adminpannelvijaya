import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR } from "@/lib/utils";

type TransportRouteSearchResult = {
  routeId: number;
  routeName: string;
  routeStopId: number;
  stopName: string;
  amount: number;
};

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

  const [requiresTransport, setRequiresTransport] = useState(false);
  const [requiresHostel, setRequiresHostel] = useState(false);
  const [transportStopName, setTransportStopName] = useState("");
  const [transportSearchResults, setTransportSearchResults] = useState<TransportRouteSearchResult[]>([]);
  const [transportSearchLoading, setTransportSearchLoading] = useState(false);
  const [selectedTransportRoute, setSelectedTransportRoute] = useState<TransportRouteSearchResult | null>(null);

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
    setRequiresTransport(false);
    setRequiresHostel(false);
    setTransportStopName("");
    setTransportSearchResults([]);
    setSelectedTransportRoute(null);
    setTransportSearchLoading(false);
  }, [schoolConcessions, studentData]);

  const previewItems = useMemo(() => {
    const baseItems = Array.isArray(studentData?.feeStructure?.items)
      ? studentData.feeStructure.items
      : [];

    const transportMode = Boolean(requiresTransport && !requiresHostel);
    const hostelMode = Boolean(requiresHostel && !requiresTransport);
    const transportSelected = Boolean(transportMode && selectedTransportRoute);

    const routeAmount = transportSelected ? Number(selectedTransportRoute?.amount ?? 0) : 0;
    const routeLabelSuffix =
      transportSelected && selectedTransportRoute
        ? `${selectedTransportRoute.routeName} (${selectedTransportRoute.stopName})`
        : "";

    const transportIndex = baseItems.findIndex((item: any) => {
      const name = String(item?.name ?? "").toLowerCase();
      return name.includes("transport");
    });

    const hostelIndex = baseItems.findIndex((item: any) => {
      const name = String(item?.name ?? "").toLowerCase();
      return name.includes("hostel");
    });

    // Start from base items and apply facility-specific overrides.
    const updatedItems = baseItems.map((item: any, index: number) => {
      if (index === transportIndex) {
        // Hostel selected: force transport amount to 0.
        if (hostelMode) {
          return { ...item, amount: 0 };
        }

        // Transport mode: until route is selected amount stays 0; once selected inject route amount + label.
        if (transportMode) {
          const baseName = String(item?.name ?? "Transport Fee").trim() || "Transport Fee";
          if (transportSelected) {
            return {
              ...item,
              name: `${baseName} - ${routeLabelSuffix}`,
              amount: routeAmount,
            };
          }

          return { ...item, amount: 0, name: baseName };
        }
      }

      if (index === hostelIndex) {
        // Hostel is opt-in: default amount is 0 unless hostel is selected.
        // Transport mode also forces hostel amount to 0.
        if (!hostelMode) {
          return { ...item, amount: 0 };
        }
      }

      return item;
    });

    // No existing transport head; append a dedicated one for preview purposes when transport is selected.
    if (transportSelected && transportIndex < 0) {
      return [
        ...updatedItems,
        {
          feeHeadId: -999999,
          name: `Transport Fee - ${routeLabelSuffix}`,
          amount: routeAmount,
          isDiscountAllowed: false,
          maxDiscountPercentage: 0,
        },
      ];
    }

    return updatedItems;
  }, [requiresHostel, requiresTransport, selectedTransportRoute, studentData]);

  const totalAmount = previewItems.reduce((sum: number, item: any) => sum + Number(item?.amount ?? 0), 0);

  const totalDiscountableAmount = previewItems.reduce((sum: number, item: any) => {
    return item?.isDiscountAllowed ? sum + Number(item?.amount ?? 0) : sum;
  }, 0);

  const totalDiscount = Math.min(Math.max(concessionAmount, 0), totalDiscountableAmount);
  const finalAmount = totalAmount - totalDiscount;
  const installments = studentData?.installments || [];
  const feeHeadFinalAmounts = previewItems.reduce((acc: Record<number, number>, item: any) => {
    const itemAmount = Number(item?.amount ?? 0);
    const itemDiscount = item?.isDiscountAllowed && totalDiscountableAmount > 0
      ? (itemAmount / totalDiscountableAmount) * totalDiscount
      : 0;
    const feeHeadIdRaw = item?.feeHeadId;
    if (feeHeadIdRaw === null || feeHeadIdRaw === undefined) {
      return acc;
    }

    const feeHeadId = Number(feeHeadIdRaw);
    if (Number.isFinite(feeHeadId)) {
      acc[feeHeadId] = itemAmount - itemDiscount;
    }
    return acc;
  }, {});

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

  useEffect(() => {
    if (!requiresTransport) {
      setTransportSearchResults([]);
      setTransportSearchLoading(false);
      return;
    }

    const trimmedStopName = transportStopName.trim();
    if (trimmedStopName.length < 3) {
      setTransportSearchResults([]);
      setTransportSearchLoading(false);
      return;
    }

    if (
      selectedTransportRoute &&
      trimmedStopName === String(selectedTransportRoute.stopName ?? "").trim()
    ) {
      setTransportSearchResults([]);
      setTransportSearchLoading(false);
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setTransportSearchResults([]);
      setTransportSearchLoading(false);
      return;
    }

    const schoolId = studentData?.student?.schoolId;
    if (!schoolId) {
      setTransportSearchResults([]);
      setTransportSearchLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      try {
        setTransportSearchLoading(true);

        const response = await fetch(
          `/api/utilities/schools/${encodeURIComponent(String(schoolId))}/transport-routes/search?stopName=${encodeURIComponent(trimmedStopName)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const payload = (await response.json().catch(() => null)) as unknown;

        if (!response.ok) {
          const message =
            payload && typeof payload === "object" && "message" in (payload as Record<string, unknown>)
              ? String((payload as Record<string, unknown>).message ?? "")
              : "";
          throw new Error(message || "Failed to search transport routes");
        }

        const results = Array.isArray(payload) ? (payload as TransportRouteSearchResult[]) : [];
        if (cancelled) return;
        setTransportSearchResults(results);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof DOMException && error.name === "AbortError") return;

        console.error("Transport route search failed:", error);
        setTransportSearchResults([]);
        toast.error(error instanceof Error ? error.message : "Failed to search transport routes");
      } finally {
        if (!cancelled) setTransportSearchLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [requiresTransport, selectedTransportRoute, studentData?.student?.schoolId, transportStopName]);

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

      if (requiresTransport && !selectedTransportRoute) {
        toast.error("Please select a transport route");
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

      // Send the computed preview alongside the original inputs so the backend can persist/re-verify
      // the exact fee breakup (heads + installments) used at finalization time.
      const feeHeadPreviews = previewItems.map((item: any) => {
        const grossAmount = Number(item?.amount ?? 0);
        const discountAmount =
          item?.isDiscountAllowed && totalDiscountableAmount > 0
            ? (grossAmount / totalDiscountableAmount) * totalDiscount
            : 0;
        const netAmount = grossAmount - discountAmount;

        return {
          feeHeadId: item?.feeHeadId ?? item?.id ?? null,
          feeHeadName: item?.name ?? null,
          grossAmount,
          discountAmount,
          netAmount,
          isDiscountAllowed: Boolean(item?.isDiscountAllowed),
          maxDiscountPercentage: Number(item?.maxDiscountPercentage ?? 0),
        };
      });

      const installmentPreviews = (installments || []).map((installment: any) => {
        const installmentHeads = Array.isArray(installment?.installmentHeads)
          ? installment.installmentHeads
          : [];

        const heads = installmentHeads.map((head: any) => {
          const pct = Number(head?.percentage ?? 0);
          const feeHeadFinalAmount = Number(feeHeadFinalAmounts[head?.feeHeadId] ?? head?.amount ?? 0);
          const amount = (feeHeadFinalAmount * pct) / 100;
          return {
            installmentHeadId: head?.id ?? null,
            feeHeadId: head?.feeHeadId ?? null,
            feeHeadName: head?.feeHeadName ?? null,
            percentage: pct,
            amount,
          };
        });

        const amount = heads.reduce((sum: number, h: any) => sum + Number(h?.amount ?? 0), 0);

        return {
          installmentId: installment?.id ?? null,
          installmentName: installment?.name ?? null,
          dueDate: installment?.dueDate ?? null,
          amount,
          heads,
        };
      });

      const feePreview = {
        totals: {
          grossAmount: totalAmount,
          discountAmount: totalDiscount,
          netAmount: finalAmount,
        },
        feeHeads: feeHeadPreviews,
        installments: installmentPreviews,
        facilities: {
          transportRequired: Boolean(requiresTransport),
          transportRouteId: requiresTransport ? (selectedTransportRoute?.routeId ?? null) : null,
          transportRouteStopId: requiresTransport ? (selectedTransportRoute?.routeStopId ?? null) : null,
          hostelRequired: Boolean(requiresHostel),
        },
        concession: {
          concessionId: isConcessionSelected
            ? (selectedConcession?.id ??
                selectedConcession?.concessionId ??
                selectedConcession?.concession_id ??
                null)
            : null,
          concessionName: isConcessionSelected
            ? (selectedConcession?.name ?? concessionType ?? null)
            : null,
          concessionAmount: Number(concessionAmount ?? 0),
          concessionReference: isConcessionSelected ? concessionReference.trim() : null,
        },
      };

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
        transportRequired: requiresTransport,
        transportRouteId: requiresTransport ? (selectedTransportRoute?.routeId ?? null) : null,
        transportRouteStopId: requiresTransport ? (selectedTransportRoute?.routeStopId ?? null) : null,
        hostelRequired: requiresHostel,
        feePreview,
      };

      const response = await fetch(
        "/api/student-fees-accounts/finalizeFee",
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
              {previewItems.map((item: any, index: number) => {
                const discount = item.isDiscountAllowed && totalDiscountableAmount > 0
                  ? (item.amount / totalDiscountableAmount) * totalDiscount
                  : 0;
                const final = item.amount - discount;

                return (
                  <tr
                    key={String(item?.feeHeadId ?? item?.id ?? item?.name ?? index)}
                    className="border hover:bg-gray-50"
                  >
                    <td className="p-2 border">{item.name}</td>

                    <td className="p-2 border relative group cursor-pointer text-right">
                      {formatINR(Number(item.amount || 0))}
                      <div className="absolute hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded -top-7 left-1/2 -translate-x-1/2">
                        {item.isDiscountAllowed
                          ? `Max Discount: ${Number(item.maxDiscountPercentage ?? 0)}%`
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
              <div className="rounded-md border p-4 bg-white space-y-3">
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-slate-800">
                    <Checkbox
                      checked={requiresTransport}
                      onCheckedChange={(next) => {
                        const nextValue = Boolean(next);
                        setRequiresTransport(nextValue);
                        if (nextValue) {
                          setRequiresHostel(false);
                        } else {
                          setTransportStopName("");
                          setTransportSearchResults([]);
                          setSelectedTransportRoute(null);
                          setTransportSearchLoading(false);
                        }
                      }}
                      aria-label="Requires transport"
                    />
                    <span className="text-sm font-medium">Requires Transport</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-800">
                    <Checkbox
                      checked={requiresHostel}
                      onCheckedChange={(next) => {
                        const nextValue = Boolean(next);
                        setRequiresHostel(nextValue);
                        if (nextValue) {
                          setRequiresTransport(false);
                          setTransportStopName("");
                          setTransportSearchResults([]);
                          setSelectedTransportRoute(null);
                          setTransportSearchLoading(false);
                        }
                      }}
                      aria-label="Requires hostel facility"
                    />
                    <span className="text-sm font-medium">Hostel Facility</span>
                  </label>
                </div>

                {requiresTransport ? (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <span className="block text-sm text-slate-700">Transport Stop Name</span>
                      <Input
                        value={transportStopName}
                        onChange={(e) => {
                          setTransportStopName(e.target.value);
                          setSelectedTransportRoute(null);
                        }}
                        placeholder="Type min 3 characters to search..."
                      />
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          Enter at least 3 characters to search.
                        </p>
                        {transportSearchLoading ? (
                          <p className="text-xs text-muted-foreground">Searching...</p>
                        ) : null}
                      </div>
                    </div>

                    {selectedTransportRoute ? (
                      <div className="text-sm text-slate-800">
                        Selected:{" "}
                        <span className="font-medium">
                          {selectedTransportRoute.routeName} - {selectedTransportRoute.stopName} (
                          {formatINR(Number(selectedTransportRoute.amount ?? 0))})
                        </span>
                      </div>
                    ) : null}

                    {transportStopName.trim().length >= 3 && !selectedTransportRoute ? (
                      <div className="border rounded-md bg-slate-50">
                        {transportSearchResults.length === 0 && !transportSearchLoading ? (
                          <div className="p-3 text-sm text-muted-foreground">No routes found.</div>
                        ) : (
                          <div className="max-h-48 overflow-auto">
                            {transportSearchResults.map((option) => (
                              <button
                                key={`${option.routeId}-${option.stopName}`}
                                type="button"
                                onClick={() => {
                                  setSelectedTransportRoute(option);
                                  setTransportStopName(option.stopName);
                                  setTransportSearchResults([]);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-white border-b last:border-b-0"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-slate-800 truncate">
                                      {option.stopName}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {option.routeName}
                                    </div>
                                  </div>
                                  <div className="text-sm font-semibold text-slate-900">
                                    {formatINR(Number(option.amount ?? 0))}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

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
                  disabled={isReferenceMissing || (requiresTransport && !selectedTransportRoute)}
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
