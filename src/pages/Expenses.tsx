import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";

type SearchOption = Record<string, unknown>;

type ExpenseItem = {
  itemName: string;
  itemId: string;
  quantity: string;
  uom: string;
  rate: string;
  amount: string;
};

type ExpenseFormValues = {
  expenseDate: string;
  invoiceNo: string;
  expenseTitle: string;
  description: string;
  vendorId: string;
  vendorName: string;
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  paymentMode: string;
  paymentTxnRefNo: string;
  createdBY: string;
  items: ExpenseItem[];
};

type ExpenseApproval = {
  id: number;
  levelOrder: number;
  approverUserId: number;
  status: string;
  actionDate: string | null;
  remarks: string | null;
};

type SubmittedExpenseResponse = {
  id: number;
  schoolId: number;
  categoryId: number | null;
  subCategoryId: number | null;
  vendorId: number | null;
  invoiceNo: string | null;
  title: string;
  description: string | null;
  amount: number;
  expenseDate: string;
  paymentMode: string;
  paymentTxnRefNo: string | null;
  status: string;
  paymentStatus: string;
  approvalStatus: string;
  createdBy: number;
  createdAt: string;
  items: Array<{
    id: number;
    itemId: number;
    quantity: number;
    uom: string | null;
    unitPrice: number;
    totalAmount: number;
  }>;
  approvals: ExpenseApproval[];
};

type SearchInputProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (option: SearchOption) => void;
  endpoint: string;
  queryParamName?: string;
  includeSchoolId?: boolean;
  extraQueryParams?: Record<string, string | null | undefined>;
  placeholder: string;
  disabled?: boolean;
  renderOption?: (option: SearchOption) => React.ReactNode;
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
    schoolId: schoolId ? String(schoolId) : "",
    createdByUserId: createdByUserId ? String(createdByUserId) : "",
  };
};

const getOptionList = (payload: unknown): SearchOption[] => {
  if (Array.isArray(payload)) {
    return payload as SearchOption[];
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return record.data as SearchOption[];
    }
    if (Array.isArray(record.content)) {
      return record.content as SearchOption[];
    }
    if (Array.isArray(record.results)) {
      return record.results as SearchOption[];
    }
  }

  return [];
};

const pickString = (option: SearchOption, keys: string[]) => {
  for (const key of keys) {
    const value = option[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
};

const getOptionLabel = (option: SearchOption) =>
  pickString(option, ["name", "vendorName", "categoryName", "subCategoryName", "itemName", "title"]);

const getOptionId = (option: SearchOption, fallbackKeys: string[]) =>
  pickString(option, [...fallbackKeys, "id"]);

const getItemUom = (option: SearchOption) =>
  pickString(option, ["uom", "unitOfMeasure", "unit", "uomName"]);

const getItemRate = (option: SearchOption) =>
  pickString(option, ["rate", "price", "unitPrice", "cost", "sellingPrice"]);

const calculateAmount = (quantityValue: string, rateValue: string) => {
  const quantity = Number.parseFloat(quantityValue || "0");
  const rate = Number.parseFloat(rateValue || "0");

  if (!Number.isFinite(quantity) || !Number.isFinite(rate)) {
    return "0.00";
  }

  return (quantity * rate).toFixed(2);
};

const SearchInput = ({
  label,
  value,
  onChange,
  onSelect,
  endpoint,
  queryParamName,
  includeSchoolId,
  extraQueryParams,
  placeholder,
  disabled,
  renderOption,
}: SearchInputProps) => {
  const [options, setOptions] = useState<SearchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const requestIdRef = useRef(0);
  const lastSelectedValueRef = useRef("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const updateDropdownPosition = () => {
    if (!inputRef.current) {
      return;
    }

    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    updateDropdownPosition();

    const handlePositionChange = () => updateDropdownPosition();
    window.addEventListener("resize", handlePositionChange);
    window.addEventListener("scroll", handlePositionChange, true);

    return () => {
      window.removeEventListener("resize", handlePositionChange);
      window.removeEventListener("scroll", handlePositionChange, true);
    };
  }, [open]);

  useEffect(() => {
    const trimmedValue = value.trim();

    if (trimmedValue && trimmedValue === lastSelectedValueRef.current) {
      setOptions([]);
      setLoading(false);
      setOpen(false);
      return;
    }

    if (disabled || trimmedValue.length < 3) {
      setOptions([]);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      const currentRequestId = ++requestIdRef.current;
      const { token, schoolId } = getSessionContext();

      if (!token) {
        setLoading(false);
        return;
      }

      if (includeSchoolId && !schoolId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        let parsedOptions: SearchOption[] = [];
        let lastErrorMessage = "Failed to load search results";
        const resolvedEndpoint = includeSchoolId
          ? endpoint.replace("{schoolId}", schoolId)
          : endpoint;
        const extraParams = Object.entries(extraQueryParams || {}).filter(
          ([, queryValue]) => queryValue !== null && queryValue !== undefined && String(queryValue).trim() !== "",
        );
        const querySuffix = extraParams
          .map(([key, queryValue]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(queryValue))}`)
          .join("&");
        const withExtraParams = (baseUrl: string) =>
          querySuffix ? `${baseUrl}&${querySuffix}` : baseUrl;
        const urls = queryParamName
          ? [withExtraParams(`${resolvedEndpoint}?${queryParamName}=${encodeURIComponent(trimmedValue)}`)]
          : [
              withExtraParams(`${resolvedEndpoint}?q=${encodeURIComponent(trimmedValue)}`),
              withExtraParams(`${resolvedEndpoint}?name=${encodeURIComponent(trimmedValue)}`),
              withExtraParams(`${resolvedEndpoint}?search=${encodeURIComponent(trimmedValue)}`),
            ];

        for (const url of urls) {
          const response = await fetch(url, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const payload = await response.json().catch(() => null);

          if (response.ok) {
            parsedOptions = getOptionList(payload);
            break;
          }

          if (payload && typeof payload === "object") {
            const record = payload as Record<string, unknown>;
            if (typeof record.message === "string" && record.message.trim()) {
              lastErrorMessage = record.message;
            }
          }
        }

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        if (!parsedOptions.length) {
          setOptions([]);
          if (trimmedValue.length >= 3) {
            setOpen(true);
          }
          return;
        }

        setOptions(parsedOptions);
        setOpen(true);
      } catch (error) {
        if (currentRequestId === requestIdRef.current) {
          setOptions([]);
          toast.error(error instanceof Error ? error.message : lastErrorMessage);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [disabled, endpoint, value]);

  return (
    <div className="relative space-y-2">
      {label ? <Label>{label}</Label> : null}
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            lastSelectedValueRef.current = "";
            onChange(event.target.value);
            updateDropdownPosition();
            setOpen(true);
          }}
          onFocus={() => {
            if (options.length > 0 || value.trim().length >= 3) {
              updateDropdownPosition();
              setOpen(true);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          placeholder={placeholder}
          disabled={disabled}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {open &&
          !disabled &&
          (options.length > 0 || value.trim().length >= 3) &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              style={dropdownStyle}
              className="max-h-52 overflow-y-auto rounded-md border border-border bg-popover shadow-lg"
            >
              {options.length > 0 ? (
                options.map((option, index) => {
                  const optionLabel = getOptionLabel(option);
                  return (
                    <button
                      key={`${optionLabel}-${index}`}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        lastSelectedValueRef.current = getOptionLabel(option).trim();
                        onSelect(option);
                        setOptions([]);
                        setOpen(false);
                      }}
                    >
                      {renderOption ? renderOption(option) : optionLabel}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">No matches found</div>
              )}
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
};

const Expenses = () => {
  const currentDate = format(new Date(), "yyyy-MM-dd");
  const { createdByUserId } = getSessionContext();
  const [showForm, setShowForm] = useState(false);
  const [submittedExpense, setSubmittedExpense] = useState<SubmittedExpenseResponse | null>(null);

  const {
    control,
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    defaultValues: {
      expenseDate: currentDate,
      invoiceNo: "",
      expenseTitle: "",
      description: "",
      vendorId: "",
      vendorName: "",
      categoryId: "",
      categoryName: "",
      subCategoryId: "",
      subCategoryName: "",
      paymentMode: "CASH",
      paymentTxnRefNo: "",
      createdBY: createdByUserId,
      items: [
        {
          itemName: "",
          itemId: "",
          quantity: "1",
          uom: "",
          rate: "",
          amount: "0.00",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = useWatch({
    control,
    name: "items",
  }) || [];
  const watchedExpenseDate = useWatch({
    control,
    name: "expenseDate",
  });
  const totalAmount = useMemo(
    () =>
      (watchedItems || []).reduce((sum, item) => {
        const rowAmount = Number.parseFloat(
          calculateAmount(item?.quantity || "", item?.rate || ""),
        );
        return sum + (Number.isFinite(rowAmount) ? rowAmount : 0);
      }, 0),
    [watchedItems],
  );

  useEffect(() => {
    setValue("createdBY", createdByUserId);
  }, [createdByUserId, setValue]);

  useEffect(() => {
    (watchedItems || []).forEach((item, index) => {
      const formattedAmount = calculateAmount(item?.quantity || "", item?.rate || "");

      if (item?.amount !== formattedAmount) {
        setValue(`items.${index}.amount`, formattedAmount, {
          shouldDirty: false,
          shouldValidate: false,
        });
      }
    });
  }, [setValue, watchedItems]);

  const handleSubmitExpense = async (values: ExpenseFormValues) => {
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

    const payload = {
      categoryId: values.categoryId ? Number(values.categoryId) : null,
      subCategoryId: values.subCategoryId ? Number(values.subCategoryId) : null,
      vendorId: values.vendorId ? Number(values.vendorId) : null,
      invoiceNo: values.invoiceNo.trim() || null,
      title: values.expenseTitle.trim(),
      description: values.description.trim() || null,
      expenseDate: values.expenseDate,
      paymentMode:
        values.paymentMode === "BANK-TRANSFER" ? "BANK_TRAN" : values.paymentMode,
      paymentTxnRefNo: values.paymentTxnRefNo.trim() || null,
      createdBy: Number(createdByUserId),
      items: values.items
        .filter((item) => item.itemName.trim() || item.itemId || item.quantity || item.rate)
        .map((item) => ({
          itemId: item.itemId ? Number(item.itemId) : null,
          quantity: item.quantity ? Number(item.quantity) : 0,
          uom: item.uom.trim() || null,
          unitPrice: item.rate ? Number(item.rate) : 0,
        })),
    };

    try {
      const response = await fetch(
        `/api/schools/${schoolId}/expenses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          (responseData &&
            typeof responseData === "object" &&
            "message" in responseData &&
            typeof responseData.message === "string" &&
            responseData.message) ||
            "Failed to save expense",
        );
      }

      setSubmittedExpense(responseData as SubmittedExpenseResponse);
      toast.success("Expense submitted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save expense");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Track expense entries and maintain item-level details.
          </p>
        </div>
        {!showForm && (
          <Button variant="link" className="px-0" onClick={() => setShowForm(true)}>
            Add Expense
          </Button>
        )}
      </div>

      {!showForm ? (
        <Card>
          <CardContent className="flex min-h-48 items-center justify-center p-6">
            <Button variant="link" className="text-base" onClick={() => setShowForm(true)}>
              Add Expense
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit(handleSubmitExpense)} className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Expense Details</h2>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Expense Date</Label>
                  <Controller
                    name="expenseDate"
                    control={control}
                    render={({ field }) => {
                      const selectedDate = field.value ? new Date(field.value) : new Date();

                      return (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(selectedDate, "dd MMM yyyy") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => {
                                if (date) {
                                  field.onChange(format(date, "yyyy-MM-dd"));
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      );
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expense Title</Label>
                  <Input
                    {...register("expenseTitle", {
                      required: "Expense title is required",
                      maxLength: {
                        value: 50,
                        message: "Expense title must be 50 characters or less",
                      },
                    })}
                    maxLength={50}
                    placeholder="Enter expense title"
                  />
                  {errors.expenseTitle && (
                    <p className="text-sm text-destructive">{errors.expenseTitle.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Input
                    {...register("description", {
                      maxLength: {
                        value: 100,
                        message: "Description must be 100 characters or less",
                      },
                    })}
                    maxLength={100}
                    placeholder="Enter description"
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="grid gap-4 md:grid-cols-2">
                    <SearchInput
                      label="Vendor Name"
                      value={watch("vendorName")}
                      endpoint="/api/utilities/schools/{schoolId}/vendors/search"
                      queryParamName="name"
                      includeSchoolId
                      placeholder="Search vendor"
                      renderOption={(option) => (
                        <div className="space-y-1">
                          <div className="font-medium">{getOptionLabel(option)}</div>
                          <div className="text-xs text-muted-foreground">
                            {pickString(option, ["address"])}
                          </div>
                        </div>
                      )}
                          onChange={(nextValue) => {
                            setSubmittedExpense(null);
                            setValue("vendorName", nextValue, { shouldDirty: true });
                            setValue("vendorId", "", { shouldDirty: true });
                          }}
                      onSelect={(option) => {
                        setValue("vendorName", getOptionLabel(option), { shouldDirty: true });
                        setValue("vendorId", getOptionId(option, ["vendorId"]), { shouldDirty: true });
                      }}
                    />

                    <div className="space-y-2">
                      <Label>Invoice No</Label>
                      <Input
                        {...register("invoiceNo")}
                        placeholder="Enter invoice number"
                      />
                    </div>
                  </div>
                </div>

                <SearchInput
                  label="Category Name"
                  value={watch("categoryName")}
                  endpoint="/api/schools/{schoolId}/expense-categories/search"
                  queryParamName="name"
                  includeSchoolId
                  placeholder="Search category"
                  onChange={(nextValue) => {
                    setSubmittedExpense(null);
                    setValue("categoryName", nextValue, { shouldDirty: true });
                    setValue("categoryId", "", { shouldDirty: true });
                  }}
                  onSelect={(option) => {
                    setValue("categoryName", getOptionLabel(option), { shouldDirty: true });
                    setValue("categoryId", getOptionId(option, ["categoryId"]), { shouldDirty: true });
                  }}
                />

                <SearchInput
                  label="Sub Category Name"
                  value={watch("subCategoryName")}
                  endpoint="/api/schools/{schoolId}/expense-categories/sub-categories/search"
                  queryParamName="name"
                  includeSchoolId
                  placeholder="Search sub category"
                  onChange={(nextValue) => {
                    setSubmittedExpense(null);
                    setValue("subCategoryName", nextValue, { shouldDirty: true });
                    setValue("subCategoryId", "", { shouldDirty: true });
                  }}
                  onSelect={(option) => {
                    setValue("subCategoryName", getOptionLabel(option), { shouldDirty: true });
                    setValue("subCategoryId", getOptionId(option, ["subCategoryId"]), { shouldDirty: true });
                  }}
                />

                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Controller
                    name="paymentMode"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">CASH</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="BANK-TRANSFER">BANK-TRANSFER</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Transaction Ref No</Label>
                  <Input
                    {...register("paymentTxnRefNo")}
                    placeholder="Enter transaction reference"
                  />
                </div>
              </div>

              <Input type="hidden" {...register("vendorId")} />
              <Input type="hidden" {...register("categoryId")} />
              <Input type="hidden" {...register("subCategoryId")} />
              <Input type="hidden" {...register("createdBY")} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Expense Items</h2>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      itemName: "",
                      itemId: "",
                      quantity: "1",
                      uom: "",
                      rate: "",
                      amount: "0.00",
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>UOM</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="w-16">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell className="min-w-64 align-top">
                        <SearchInput
                          label={undefined}
                          value={watch(`items.${index}.itemName`)}
                          endpoint="/api/schools/{schoolId}/items/filter"
                          queryParamName="name"
                          includeSchoolId
                          extraQueryParams={{
                            categoryId: watch("categoryId") || undefined,
                            subCategoryId: watch("subCategoryId") || undefined,
                          }}
                          placeholder="Search item"
                          onChange={(nextValue) => {
                            setSubmittedExpense(null);
                            setValue(`items.${index}.itemName`, nextValue, { shouldDirty: true });
                            setValue(`items.${index}.itemId`, "", { shouldDirty: true });
                            setValue(`items.${index}.uom`, "", { shouldDirty: true });
                            setValue(`items.${index}.rate`, "", { shouldDirty: true });
                          }}
                          onSelect={(option) => {
                            const nextItemName = pickString(option, ["name", "itemName"]);
                            const nextItemId = getOptionId(option, ["itemId"]);
                            const nextUom = pickString(option, ["uom", "unitOfMeasure", "unit", "uomName"]);
                            const nextRate = pickString(option, ["rate", "price", "unitPrice", "cost", "sellingPrice"]);
                            const currentQuantity = watch(`items.${index}.quantity`) || "";

                            setValue(`items.${index}.itemName`, nextItemName, { shouldDirty: true });
                            setValue(`items.${index}.itemId`, nextItemId, {
                              shouldDirty: true,
                            });
                            setValue(`items.${index}.uom`, nextUom, { shouldDirty: true });
                            setValue(`items.${index}.rate`, nextRate, { shouldDirty: true });
                            setValue(
                              `items.${index}.amount`,
                              calculateAmount(currentQuantity, nextRate),
                              { shouldDirty: true },
                            );
                          }}
                        />
                        <Input type="hidden" {...register(`items.${index}.itemId`)} />
                      </TableCell>

                      <TableCell className="align-top">
                        <div className="space-y-2">
                          <Label className="sr-only">Quantity</Label>
                          <Input
                            value={watch(`items.${index}.quantity`) || ""}
                            onChange={(event) => {
                              setSubmittedExpense(null);
                              const nextQuantity = event.target.value;
                              const currentRate = watch(`items.${index}.rate`) || "";

                              setValue(`items.${index}.quantity`, nextQuantity, { shouldDirty: true });
                              setValue(
                                `items.${index}.amount`,
                                calculateAmount(nextQuantity, currentRate),
                                { shouldDirty: true },
                              );
                            }}
                            placeholder="Qty"
                            inputMode="decimal"
                          />
                        </div>
                      </TableCell>

                      <TableCell className="align-top">
                        <div className="space-y-2">
                          <Label className="sr-only">UOM</Label>
                          <Input
                            value={watch(`items.${index}.uom`) || ""}
                            onChange={(event) =>
                              (setSubmittedExpense(null),
                              setValue(`items.${index}.uom`, event.target.value, { shouldDirty: true })
                              )
                            }
                            placeholder="UOM"
                          />
                        </div>
                      </TableCell>

                      <TableCell className="align-top">
                        <div className="space-y-2">
                          <Label className="sr-only">Rate</Label>
                          <Input
                            value={watch(`items.${index}.rate`) || ""}
                            onChange={(event) => {
                              setSubmittedExpense(null);
                              const nextRate = event.target.value;
                              const currentQuantity = watch(`items.${index}.quantity`) || "";

                              setValue(`items.${index}.rate`, nextRate, { shouldDirty: true });
                              setValue(
                                `items.${index}.amount`,
                                calculateAmount(currentQuantity, nextRate),
                                { shouldDirty: true },
                              );
                            }}
                            placeholder="Rate"
                            inputMode="decimal"
                          />
                        </div>
                      </TableCell>

                      <TableCell className="align-top">
                        <div className="space-y-2">
                          <Label className="sr-only">Amount</Label>
                          <Input
                            value={watch(`items.${index}.amount`) || "0.00"}
                            readOnly
                            placeholder="Amount"
                          />
                        </div>
                      </TableCell>

                      <TableCell className="align-top">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={fields.length === 1}
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <div className="min-w-48 rounded-md border bg-muted/30 px-4 py-3 text-right">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-semibold">{totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {submittedExpense && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Approvals</h2>
                  <div className="text-sm text-muted-foreground">
                    Status: {submittedExpense.approvalStatus}
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Level</TableHead>
                      <TableHead>Approver User Id</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action Date</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submittedExpense.approvals.length > 0 ? (
                      submittedExpense.approvals.map((approval) => (
                        <TableRow key={approval.id}>
                          <TableCell>{approval.levelOrder}</TableCell>
                          <TableCell>{approval.approverUserId}</TableCell>
                          <TableCell>{approval.status}</TableCell>
                          <TableCell>{approval.actionDate || "-"}</TableCell>
                          <TableCell>{approval.remarks || "-"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No approvals returned
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button type="submit">Submit Expense</Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Expenses;
