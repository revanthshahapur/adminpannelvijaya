import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Relation = {
  name: string;
  contact: string;
  occupation: string;
  email?: string;
  relation: string;
  otherRelation?: string;
};

type StudentFormValues = {
  admissionNo: string;
  academicYearId: string;
  aadhaarNo: string;
  fullName: string;
  dob: string;
  placeOfBirth: string;
  gender: string;
  bloodGroup: string;
  religion: string;
  caste: string;
  subCaste: string;
  category: string;
  permanentAddress: string;
  currentAddress: string;
  phone: string;
  email: string;
  admissionDate: string;
  admissionClassId: string;
  previousSchool: string;
  previousClass: string;
  previousBoard: string;
  satsId: string;
  relations: Relation[];
};

const StudentForm = ({ onClose, onFeeFinalized }: { onClose?: () => void; onFeeFinalized?: (studentData: any) => void }) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [isFeeSubmitted, setIsFeeSubmitted] = useState(false);
  const [isValidatingAadhaar, setIsValidatingAadhaar] = useState(false);
  const [lastValidatedAadhaar, setLastValidatedAadhaar] = useState<string>("");

  // ✅ NEW STATES (overall discount only)
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [academicYearName, setAcademicYearName] = useState<string>("");
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const aadhaarValidationRequestRef = useRef(0);

  const currentDate = new Date().toISOString().slice(0, 10);
  
  // Calculate date 4 years ago for minimum DOB
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 4);
  const minDateString = minDate.toISOString().slice(0, 10);

  const { control, register, handleSubmit, setValue, watch, setError, clearErrors, formState: { errors } } =
    useForm<StudentFormValues>({
      mode: "onBlur",
      defaultValues: {
        academicYearId: "",
        admissionDate: currentDate,
        dob: minDateString,
        relations: [
          {
            name: "",
            contact: "",
            occupation: "",
            email: "",
            relation: "",
            otherRelation: "",
          },
        ],
      },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "relations",
  });
  const aadhaarNo = watch("aadhaarNo");

  const getSessionContext = () => {
    const token = localStorage.getItem("authToken");

    let schoolId = localStorage.getItem("schoolId");
    if (!schoolId) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          schoolId =
            parsedUser.schoolId || parsedUser.school_id ||
            parsedUser.school?.id || parsedUser.user?.schoolId ||
            parsedUser.user?.school_id;
        } catch {
          // ignore parse errors
        }
      }
    }

    return { token, schoolId: schoolId ? String(schoolId) : "" };
  };

  const validateAadhaarNumber = async (formattedAadhaar: string) => {
    const normalizedAadhaar = formattedAadhaar.replace(/\D/g, "");

    if (normalizedAadhaar.length !== 12) {
      setLastValidatedAadhaar("");
      clearErrors("aadhaarNo");
      return false;
    }

    if (lastValidatedAadhaar === normalizedAadhaar && !errors.aadhaarNo) {
      return true;
    }

    const { token, schoolId } = getSessionContext();
    if (!token) {
      setError("aadhaarNo", {
        type: "manual",
        message: "Token missing. Please login again.",
      });
      return false;
    }

    if (!schoolId) {
      setError("aadhaarNo", {
        type: "manual",
        message: "School ID missing. Unable to validate Aadhaar.",
      });
      return false;
    }

    const currentRequestId = ++aadhaarValidationRequestRef.current;
    setIsValidatingAadhaar(true);

    try {
      const response = await fetch(
        `/api/${schoolId}/students/validate-aadhaar?aadhaarNumber=${encodeURIComponent(normalizedAadhaar)}`,
        {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);

      if (currentRequestId !== aadhaarValidationRequestRef.current) {
        return false;
      }

      const aadhaarAlreadyExists = data?.data === true;
      const isValid = response.ok && data?.data === false;

      if (!response.ok || aadhaarAlreadyExists || !isValid) {
        throw new Error(
          (aadhaarAlreadyExists && "Aadhaar number already exists") ||
          data?.message ||
          data?.error ||
          data?.errors?.aadhaarNumber?.[0] ||
          "Aadhaar number already exists"
        );
      }

      clearErrors("aadhaarNo");
      setLastValidatedAadhaar(normalizedAadhaar);
      return true;
    } catch (error) {
      if (currentRequestId === aadhaarValidationRequestRef.current) {
        setLastValidatedAadhaar("");
        setError("aadhaarNo", {
          type: "manual",
          message: error instanceof Error ? error.message : "Failed to validate Aadhaar number",
        });
      }
      return false;
    } finally {
      if (currentRequestId === aadhaarValidationRequestRef.current) {
        setIsValidatingAadhaar(false);
      }
    }
  };

  useEffect(() => {
    const fetchActiveAcademicYear = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("Token missing. Please login again.");
        }

        let schoolId = localStorage.getItem("schoolId");
        if (!schoolId) {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              schoolId =
                parsedUser.schoolId || parsedUser.school_id ||
                parsedUser.school?.id || parsedUser.user?.schoolId ||
                parsedUser.user?.school_id;
            } catch {
              // ignore parse errors
            }
          }
        }

        if (!schoolId) {
          throw new Error("School ID missing. Unable to load active academic year.");
        }

        const response = await fetch(
          `/api/utilities/schools/${schoolId}/academic-years/active`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch active academic year");
        }

        if (!data || !data.id || !data.name) {
          throw new Error("Active academic year not found");
        }

        setAcademicYearName(data.name);
        setValue("academicYearId", String(data.id));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Active academic year not found");
      }
    };

    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("Token missing. Please login again.");
        }

        let schoolId = localStorage.getItem("schoolId");
        if (!schoolId) {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              schoolId =
                parsedUser.schoolId || parsedUser.school_id ||
                parsedUser.school?.id || parsedUser.user?.schoolId ||
                parsedUser.user?.school_id;
            } catch {
              // ignore parse errors
            }
          }
        }

        if (!schoolId) {
          throw new Error("School ID missing. Unable to load classes.");
        }

        const response = await fetch(
          `/api/utilities/schools/${schoolId}/classes`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch classes");
        }

        if (!Array.isArray(data)) {
          throw new Error("Invalid classes data format");
        }

        setClasses(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load classes");
      }
    };

    fetchActiveAcademicYear();
    fetchClasses();
  }, [setValue]);

  useEffect(() => {
    const normalizedAadhaar = (aadhaarNo || "").replace(/\D/g, "");

    if (!normalizedAadhaar) {
      setLastValidatedAadhaar("");
      setIsValidatingAadhaar(false);
      clearErrors("aadhaarNo");
      return;
    }

    if (normalizedAadhaar.length < 12) {
      setLastValidatedAadhaar("");
      setIsValidatingAadhaar(false);
      if (errors.aadhaarNo?.type === "manual") {
        clearErrors("aadhaarNo");
      }
      return;
    }

    if (normalizedAadhaar.length !== 12) {
      setLastValidatedAadhaar("");
      setIsValidatingAadhaar(false);
      setError("aadhaarNo", {
        type: "manual",
        message: "Aadhaar must be 12 digits",
      });
      return;
    }

    const debounceTimer = window.setTimeout(() => {
      void validateAadhaarNumber(aadhaarNo || "");
    }, 500);

    return () => window.clearTimeout(debounceTimer);
  }, [aadhaarNo, clearErrors, errors.aadhaarNo?.type, setError]);

  // ================= SUBMIT =================
  const onSubmit = async (values: StudentFormValues) => {
    try {
      if (!values.academicYearId) {
        throw new Error("Active academic year not found. Cannot submit student registration.");
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Token missing. Please login again.");
        return;
      }

      const isAadhaarValid = await validateAadhaarNumber(values.aadhaarNo);
      if (!isAadhaarValid) {
        return;
      }


      const payload = {
        admissionNo: values.admissionNo,
        academicYearId: values.academicYearId,
        aadhaarNo: values.aadhaarNo.replace(/-/g, ""),
        fullName: values.fullName,
        dob: values.dob,
        admissionDate: values.admissionDate,
        placeOfBirth: values.placeOfBirth,
        gender: values.gender?.toUpperCase() || "",
        bloodGroup: values.bloodGroup,
        religion: values.religion?.trim() || "",
        caste: values.caste,
        subCaste: values.subCaste,
        category: values.category,
        permanentAddress: values.permanentAddress,
        currentAddress: values.currentAddress,
        phone: values.phone.replace(/-/g, "").replace(/^0+/, ""),
        email: values.email,
        admissionClassId: Number(values.admissionClassId),
        previousSchool: values.previousSchool,
        previousClass: values.previousClass,
        previousBoard: values.previousBoard,
        satsId: Number(values.satsId),
        guardians: values.relations.map((r) => ({
          name: r.name,
          phone: r.contact.replace(/-/g, "").replace(/^0+/, ""),
          occupation: r.occupation,
          email: r.email || null,
          relation: r.relation?.toUpperCase() || "",
        })),
      };

      const response = await fetch("/api/1/students/registerStudent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      // ========== REGISTRATION RESPONSE DEBUG ==========
      console.log("========== STUDENT REGISTRATION DEBUG ==========");
      console.log("Response Status:", response.status, response.ok ? "OK" : "ERROR");
      console.log("Full Response Object:", data);
      console.log("Response Structure:");
      console.log("  - student:", data.student);
      console.log("  - feeStructure:", data.feeStructure);
      if (data.enrollmentId) {
        console.log("  - enrollmentId:", data.enrollmentId);
      }
      if (data.student) {
        console.log("Student Details:");
        console.log("    - id:", data.student.id);
        console.log("    - name:", data.student.name);
        console.log("    - admissionNo:", data.student.admissionNo);
        console.log("    - admissionClassId:", data.student.admissionClassId);
        console.log("    - schoolId:", data.student.schoolId);
      }
      if (data.feeStructure) {
        console.log("Fee Structure Details:");
        console.log("    - id:", data.feeStructure.id);
        console.log("    - academicYearId:", data.feeStructure.academicYearId);
        console.log("    - items count:", data.feeStructure.items?.length);
      }

      console.log("========== END REGISTRATION DEBUG ==========");
      
      if (!response.ok) throw new Error(data.message);

      toast.success("🎉 Student registered successfully");

      setStudentData(data);
      setIsRegistered(true);

      // Set the generated admission number in the form
      if (data.student?.admissionNo) {
        setValue("admissionNo", data.student.admissionNo);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error occurred");
    }
  };

//
//  fee submit handler
const handleFeeSubmit = async () => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Token missing");
      return;
    }

    if (!studentData) return;

    const payload = {
      schoolId: studentData.student.schoolId,
      studentId: studentData.student.id,
      enrollmentId: studentData.enrollmentId, // confirm if correct
      academicYearId: studentData.feeStructure.academicYearId,
      feeStructureId: studentData.feeStructure.id,
      discountPercentage: discountPercent,
    };

    // ========== DEBUG LOGS ==========
    console.log("========== FEE FINALIZATION DEBUG ==========");
    console.log("Student Data:", studentData);
    console.log("Payload being sent to API:", payload);
    console.log("Individual values:");
    console.log("  - schoolId:", studentData.student.schoolId);
    console.log("  - studentId:", studentData.student.id);
    console.log("  - enrollmentId (admissionClassId):", studentData.enrollmentId);
    console.log("  - academicYearId:", studentData.feeStructure.academicYearId);
    console.log("  - feeStructureId:", studentData.feeStructure.id);
    console.log("  - discountPercentage:", discountPercent);
    console.log("API Endpoint:", "/api/student-fees-accounts/registerStudentFeeAccount");
    console.log("========== END DEBUG ==========");

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
    
    // ========== RESPONSE LOGS ==========
    console.log("========== API RESPONSE DEBUG ==========");
    console.log("Response Status:", response.status, response.ok ? "OK" : "ERROR");
    console.log("Response Data:", data);
    console.log("studentFeeObject in response:", data?.studentFeeObject);
    console.log("========== END RESPONSE DEBUG ==========");
    
    if (!response.ok) throw new Error(data.message);

    toast.success("✅ Fee submitted successfully");
    setIsFeeSubmitted(true);

    // Call onFeeFinalized callback with complete response data from API (includes studentFeeObject)
    if (onFeeFinalized) {
      onFeeFinalized(data);
    }

    // Close the form after 3 seconds if onClose callback is provided
    if (onClose) {
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  } catch (error) {
    console.error("========== ERROR DEBUG ==========");
    console.error("Error:", error);
    console.error("========== END ERROR DEBUG ==========");
    toast.error(error instanceof Error ? error.message : "Submit failed");
  }
};
//----






  // ================= CALCULATIONS =================
  const totalAmount = studentData
    ? studentData.feeStructure.items.reduce(
        (sum: number, item: any) => sum + item.amount,
        0
      )
    : 0;

  const totalDiscount = studentData
    ? studentData.feeStructure.items.reduce((sum: number, item: any) => {
        if (item.isDiscountAllowed) {
          return sum + (item.amount * discountPercent) / 100;
        }
        return sum;
      }, 0)
    : 0;

  const finalAmount = totalAmount - totalDiscount;



  // ================= UI =================
  return (
    <div className="flex gap-6 max-w-7xl mx-auto">
      {/* ---- LEFT: Form ---- */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`space-y-6 transition-all duration-500 ${
          isRegistered ? "w-1/2" : "w-full"
        }`}
      >
        {/* (NO CHANGE LEFT SIDE) */}

        {/* Admission Details */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Admission Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input {...register("admissionNo")} placeholder="Admission No" readOnly />
                  </TooltipTrigger>
                  <TooltipContent>
                    Admission No will be generated after student is registered
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input value={academicYearName || "Loading academic year..."} readOnly placeholder="Academic Year" />
              <Input type="hidden" {...register("academicYearId")} />
              <Controller
                name="admissionClassId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Admission Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((classItem) => (
                        <SelectItem key={classItem.id} value={String(classItem.id)}>
                          {classItem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Input type="date" {...register("admissionDate")} />
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input {...register("fullName")} placeholder="Full Name" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Name as per transfer certificate or Birth certificate
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Input 
                        type="date" 
                        {...register("dob", {
                          validate: {
                            notFuture: (value) => {
                              if (!value) return true;
                              return new Date(value) <= new Date() || "Date cannot be in the future";
                            },
                            minAge: (value) => {
                              if (!value) return true;
                              const dob = new Date(value);
                              const today = new Date();
                              const age = today.getFullYear() - dob.getFullYear();
                              const monthDiff = today.getMonth() - dob.getMonth();
                              const actualAge = monthDiff < 0 ? age - 1 : age;
                              return actualAge >= 4 || "Student must be at least 4 years old";
                            }
                          }
                        })} 
                        max={currentDate}
                        className={errors.dob ? "border-red-500" : ""}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      Date of birth as per Birth Certificate (minimum 4 years old, no future dates)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob.message}</p>}
              </div>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <Controller
                name="bloodGroup"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Blood Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <div>
                <Input 
                  {...register("aadhaarNo", {
                    pattern: {
                      value: /^\d{4}-\d{4}-\d{4}$/,
                      message: "Aadhaar must be in format: XXXX-XXXX-XXXX"
                    }
                  })} 
                  placeholder="Aadhaar No (XXXX-XXXX-XXXX)" 
                  maxLength={14}
                  className={errors.aadhaarNo ? "border-red-500" : ""}
                  onInput={(e) => {
                    // Remove all non-digits
                    let value = e.currentTarget.value.replace(/\D/g, '');
                    // Add hyphens after every 4 digits
                    if (value.length > 4) {
                      value = value.slice(0, 4) + '-' + value.slice(4);
                    }
                    if (value.length > 9) {
                      value = value.slice(0, 9) + '-' + value.slice(9);
                    }
                    e.currentTarget.value = value.slice(0, 14);
                  }}
                />
                {isValidatingAadhaar && !errors.aadhaarNo && (
                  <p className="text-muted-foreground text-sm mt-1">Validating Aadhaar number...</p>
                )}
                {errors.aadhaarNo && <p className="text-red-500 text-sm mt-1">{errors.aadhaarNo.message}</p>}
              </div>
              <Controller
                name="religion"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Religion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hindu">Hindu</SelectItem>
                      <SelectItem value="Christian">Christian</SelectItem>
                      <SelectItem value="Muslim">Muslim</SelectItem>
                      <SelectItem value="Jain">Jain</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Contact & Address</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Input 
                  {...register("phone", {
                    pattern: {
                      value: /^\d{5}-\d{5}$/,
                      message: "Phone must be in format: XXXXX-XXXXX"
                    }
                  })} 
                  placeholder="Phone (XXXXX-XXXXX)" 
                  maxLength={11}
                  className={errors.phone ? "border-red-500" : ""}
                  onInput={(e) => {
                    // Remove all non-digits
                    let value = e.currentTarget.value.replace(/\D/g, '');
                    // Add hyphen after 5 digits
                    if (value.length > 5) {
                      value = value.slice(0, 5) + '-' + value.slice(5);
                    }
                    e.currentTarget.value = value.slice(0, 11);
                  }}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                <Input 
                  {...register("email", {
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Please enter a valid email address"
                    }
                  })} 
                  placeholder="Email ID" 
                  type="email"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>
            </div>
            <Textarea {...register("permanentAddress")} placeholder="Permanent Address" />
            <Textarea {...register("currentAddress")} placeholder="Current Address" />
          </CardContent>
        </Card>

        {/* Guardians */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Guardians</h2>
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <Input {...register(`relations.${index}.name`)} placeholder="Name" />
                    <div>
                      <Input 
                        {...register(`relations.${index}.contact`, {
                          pattern: {
                            value: /^\d{5}-\d{5}$/,
                            message: "Phone must be in format: XXXXX-XXXXX"
                          }
                        })} 
                        placeholder="Phone (XXXXX-XXXXX)" 
                        maxLength={11}
                        className={errors.relations?.[index]?.contact ? "border-red-500" : ""}
                        onInput={(e) => {
                          let value = e.currentTarget.value.replace(/\D/g, '');
                          if (value.length > 5) {
                            value = value.slice(0, 5) + '-' + value.slice(5);
                          }
                          e.currentTarget.value = value.slice(0, 11);
                        }}
                      />
                      {errors.relations?.[index]?.contact && <p className="text-red-500 text-sm mt-1">{errors.relations[index]?.contact?.message}</p>}
                    </div>
                    <Input {...register(`relations.${index}.occupation`)} placeholder="Occupation" />
                    <div>
                      <Input 
                        {...register(`relations.${index}.email`, {
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Please enter a valid email address"
                          }
                        })} 
                        placeholder="Email" 
                        type="email"
                        className={errors.relations?.[index]?.email ? "border-red-500" : ""}
                      />
                      {errors.relations?.[index]?.email && <p className="text-red-500 text-sm mt-1">{errors.relations[index]?.email?.message}</p>}
                    </div>
                    <Controller
                      name={`relations.${index}.relation`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Relation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Father">Father</SelectItem>
                            <SelectItem value="Mother">Mother</SelectItem>
                            <SelectItem value="Guardian">Guardian</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <Button type="button" variant="destructive" onClick={() => remove(index)}>
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  name: "",
                  contact: "",
                  occupation: "",
                  email: "",
                  relation: "",
                  otherRelation: "",
                })
              }
            >
              ➕ Add Guardian
            </Button>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="submit"
            className="px-8"
            disabled={isValidatingAadhaar || (!!aadhaarNo && !!errors.aadhaarNo)}
          >
            {isValidatingAadhaar ? "Validating Aadhaar..." : "Register Student"}
          </Button>
        </div>
      </form>

      {/* ---- RIGHT: Fee Preview ---- */}
      {isRegistered && studentData && (
  <div className="w-1/2 transition-all duration-500 space-y-4">
    {/* Congratulations Message - Only after fee finalization */}
    {isFeeSubmitted && (
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎉</span>
            <div>
              <h3 className="text-lg font-bold text-green-700">Congratulations!</h3>
              <p className="text-sm text-green-600">Student admission completed successfully</p>
              <p className="text-xs text-green-700 mt-1">{studentData.student.fullName} has been registered and fee finalized</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Fee Structure Card */}
    <Card>
      <CardContent className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Fee Preview</h2>

        <table className="w-full border mt-4">
          <thead>
            <tr className="border bg-gray-100">
              <th className="p-2 border">Fee Head</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Discount</th>
              <th className="p-2 border">Final</th>
            </tr>
          </thead>

          <tbody>
            {studentData.feeStructure.items.map((item: any) => {
              const discount = item.isDiscountAllowed ? (item.amount * discountPercent) / 100 : 0;
              const final = item.amount - discount;

              return (
                <tr key={item.feeHeadId} className="border hover:bg-gray-50">
                  <td className="p-2 border">{item.name}</td>

                  <td className="p-2 border relative group cursor-pointer">
                    ₹ {item.amount}
                    <div className="absolute hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded -top-7 left-1/2 -translate-x-1/2">
                      {item.isDiscountAllowed
                        ? `Max Discount: ${item.maxDiscountPercentage}%`
                        : "Discount not applicable for this fee"}
                    </div>
                  </td>

                  <td className="p-2 border text-center">
                    ₹ {discount.toFixed(2)}
                  </td>

                  <td className="p-2 border">₹ {final.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className="text-right font-bold mt-2">
          Total: ₹ {totalAmount.toFixed(2)}
        </p>

        {!isFeeSubmitted && (
          <>
            <div className="text-right text-red-500 flex items-center justify-end gap-3">
              <span>Discount %</span>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                className="w-24"
                value={discountPercent}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setDiscountPercent(isNaN(val) ? 0 : Math.min(Math.max(val, 0), 100));
                }}
              />
            </div>

            <p className="text-right text-red-500">
              Discount: ₹ {totalDiscount.toFixed(2)}
            </p>

            <p className="text-right font-bold text-green-600">
              Final: ₹ {finalAmount.toFixed(2)}
            </p>

            <div className="flex justify-end mt-4">
              <Button
                className="bg-green-600 hover:bg-green-700 text-white px-6"
                onClick={handleFeeSubmit}
              >
                Finalise Fee
              </Button>
            </div>
          </>
        )}

        {isFeeSubmitted && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-700 font-semibold">✅ Fee Finalized Successfully</p>
            <p className="text-green-600 text-sm mt-1">Final Amount: ₹ {finalAmount.toFixed(2)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
)}
    </div>
  );
};

export default StudentForm;
