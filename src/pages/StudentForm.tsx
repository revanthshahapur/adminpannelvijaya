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
import StudentFeePreview from "@/components/StudentFeePreview";

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
  penNo: string;
  casteCertificateNo: string;
  relations: Relation[];
};

const StudentForm = ({ onClose, onFeeFinalized }: { onClose?: () => void; onFeeFinalized?: (studentData: any) => void }) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [isValidatingAadhaar, setIsValidatingAadhaar] = useState(false);
  const [lastValidatedAadhaar, setLastValidatedAadhaar] = useState<string>("");
  const [isSavingStudent, setIsSavingStudent] = useState(false);

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
        placeOfBirth: "",
        caste: "",
        subCaste: "",
        category: "",
        previousSchool: "",
        previousClass: "",
        previousBoard: "",
        satsId: "",
        penNo: "",
        casteCertificateNo: "",
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

      const { token, schoolId } = getSessionContext();
      if (!token) {
        toast.error("Token missing. Please login again.");
        return;
      }

      if (!schoolId) {
        toast.error("School ID missing. Please login again.");
        return;
      }

      const isAadhaarValid = await validateAadhaarNumber(values.aadhaarNo);
      if (!isAadhaarValid) {
        return;
      }

      setIsSavingStudent(true);

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
        satsId: values.satsId?.trim() ? Number(values.satsId) : null,
        penNo: values.penNo,
        casteCertificateNo: values.casteCertificateNo,
        guardians: values.relations.map((r) => ({
          name: r.name,
          phone: r.contact.replace(/-/g, "").replace(/^0+/, ""),
          occupation: r.occupation,
          email: r.email || null,
          relation: r.relation?.toUpperCase() || "",
        })),
      };

      const response = await fetch(`/api/${schoolId}/students/registerStudent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast.success("Student registered successfully");
      setStudentData(data);
      setIsRegistered(true);

      // Set the generated admission number in the form
      if (data.student?.admissionNo) {
        setValue("admissionNo", data.student.admissionNo);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error occurred");
    } finally {
      setIsSavingStudent(false);
    }
  };

  const onUpdate = async (values: StudentFormValues) => {
    try {
      if (!studentData?.student) {
        toast.error("Student data missing. Please register the student first.");
        return;
      }

      if (!values.academicYearId) {
        throw new Error("Active academic year not found. Cannot update student.");
      }

      const { token, schoolId } = getSessionContext();
      if (!token) {
        toast.error("Token missing. Please login again.");
        return;
      }

      if (!schoolId) {
        toast.error("School ID missing. Please login again.");
        return;
      }

      const isAadhaarValid = await validateAadhaarNumber(values.aadhaarNo);
      if (!isAadhaarValid) {
        return;
      }

      setIsSavingStudent(true);

      // Backend expects same request body as registerStudent for update.
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
        satsId: values.satsId?.trim() ? Number(values.satsId) : null,
        penNo: values.penNo,
        casteCertificateNo: values.casteCertificateNo,
        guardians: values.relations.map((r) => ({
          name: r.name,
          phone: r.contact.replace(/-/g, "").replace(/^0+/, ""),
          occupation: r.occupation,
          email: r.email || null,
          relation: r.relation?.toUpperCase() || "",
        })),
      };

      const response = await fetch(
        `/api/${schoolId}/students/updateStudent`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Failed to update student (HTTP ${response.status})`
        );
      }

      toast.success("Student updated successfully");
      setStudentData(data);

      if (data?.student?.admissionNo) {
        setValue("admissionNo", data.student.admissionNo);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setIsSavingStudent(false);
    }
  };








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
              <Input
                {...register("placeOfBirth")}
                placeholder="Place of Birth"
              />
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
              <Input {...register("caste")} placeholder="Caste" />
              <Input {...register("subCaste")} placeholder="Sub Caste" />
              <Input {...register("category")} placeholder="Category" />
            </div>
          </CardContent>
        </Card>

        {/* Previous School details */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Previous School details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Input
                  {...register("previousSchool", {
                    maxLength: {
                      value: 100,
                      message: "School Name must be at most 100 characters",
                    },
                  })}
                  placeholder="School Name"
                  maxLength={100}
                  className={errors.previousSchool ? "border-red-500" : ""}
                />
                {errors.previousSchool && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.previousSchool.message}
                  </p>
                )}
              </div>
              <div>
                <Input
                  {...register("previousClass", {
                    maxLength: {
                      value: 10,
                      message: "Class must be at most 10 characters",
                    },
                  })}
                  placeholder="Class"
                  maxLength={10}
                  className={errors.previousClass ? "border-red-500" : ""}
                />
                {errors.previousClass && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.previousClass.message}
                  </p>
                )}
              </div>
              <div>
                <Input
                  {...register("previousBoard", {
                    maxLength: {
                      value: 100,
                      message: "Board must be at most 100 characters",
                    },
                  })}
                  placeholder="Board"
                  maxLength={100}
                  className={errors.previousBoard ? "border-red-500" : ""}
                />
                {errors.previousBoard && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.previousBoard.message}
                  </p>
                )}
              </div>
              <Input
                {...register("satsId")}
                placeholder="SATS NO"
                inputMode="numeric"
                onInput={(e) => {
                  // Keep SATS as digits-only; payload converts to number/null.
                  e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
                }}
              />
              <Input {...register("penNo")} placeholder="PEN NO" />
              <Input
                {...register("casteCertificateNo")}
                placeholder="CasteCertificateNo"
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
          {!isRegistered ? (
            <Button
              type="submit"
              className="px-8"
              disabled={
                isSavingStudent ||
                isValidatingAadhaar ||
                (!!aadhaarNo && !!errors.aadhaarNo)
              }
            >
              {isSavingStudent
                ? "Registering..."
                : isValidatingAadhaar
                  ? "Validating Aadhaar..."
                  : "Register Student"}
            </Button>
          ) : (
            <Button
              type="button"
              className="px-8"
              onClick={handleSubmit(onUpdate)}
              disabled={
                isSavingStudent ||
                isValidatingAadhaar ||
                (!!aadhaarNo && !!errors.aadhaarNo)
              }
            >
              {isSavingStudent
                ? "Updating..."
                : isValidatingAadhaar
                  ? "Validating Aadhaar..."
                  : "Update Student"}
            </Button>
          )}
        </div>
      </form>

      {/* ---- RIGHT: Fee Preview ---- */}
      {isRegistered && studentData && (
        <div className="w-1/2 transition-all duration-500">
          <StudentFeePreview
            studentData={studentData}
            onFeeFinalized={onFeeFinalized}
          />
        </div>
      )}
    </div>
  );
};

export default StudentForm;



