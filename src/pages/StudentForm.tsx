import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

const StudentForm = ({ onClose }: { onClose?: () => void }) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [isFeeSubmitted, setIsFeeSubmitted] = useState(false);

  // ✅ NEW STATES (overall discount only)
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [academicYearName, setAcademicYearName] = useState<string>("");
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);

  const currentDate = new Date().toISOString().slice(0, 10);

  const { control, register, handleSubmit, setValue } =
    useForm<StudentFormValues>({
      defaultValues: {
        academicYearId: "",
        admissionDate: currentDate,
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


      const payload = {
        admissionNo: values.admissionNo,
        academicYearId: values.academicYearId,
        aadhaarNo: values.aadhaarNo,
        fullName: values.fullName,
        dob: values.dob,
        admissionDate: values.admissionDate,
        placeOfBirth: values.placeOfBirth,
        gender: values.gender.toUpperCase(),
        bloodGroup: values.bloodGroup,
        religion: values.religion.trim(),
        caste: values.caste,
        subCaste: values.subCaste,
        category: values.category,
        permanentAddress: values.permanentAddress,
        currentAddress: values.currentAddress,
        phone: values.phone.replace(/^0+/, ""),
        email: values.email,
        admissionClassId: Number(values.admissionClassId),
        previousSchool: values.previousSchool,
        previousClass: values.previousClass,
        previousBoard: values.previousBoard,
        satsId: Number(values.satsId),
        guardians: values.relations.map((r) => ({
          name: r.name,
          phone: r.contact.replace(/^0+/, ""),
          occupation: r.occupation,
          email: r.email || null,
          relation: r.relation.toUpperCase(),
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
      enrollmentId: studentData.student.admissionClassId, // confirm if correct
      academicYearId: studentData.feeStructure.academicYearId,
      feeStructureId: studentData.feeStructure.id,
      discountPercentage: discountPercent,
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
    if (!response.ok) throw new Error(data.message);

    toast.success("✅ Fee submitted successfully");
    setIsFeeSubmitted(true);

    // Close the form after 2 seconds if onClose callback is provided
    if (onClose) {
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  } catch (error) {
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
              <Input {...register("admissionNo")} placeholder="Admission No" readOnly={isRegistered} />
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
              <Input {...register("fullName")} placeholder="Full Name" />
              <Input type="date" {...register("dob")} />
              <Input {...register("gender")} placeholder="Gender" />
              <Input {...register("bloodGroup")} placeholder="Blood Group" />
              <Input {...register("aadhaarNo")} placeholder="Aadhaar No" />
              <Input {...register("religion")} placeholder="Religion" />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Contact & Address</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Input {...register("phone")} placeholder="Phone" />
              <Input {...register("email")} placeholder="Email" />
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
                    <Input {...register(`relations.${index}.contact`)} placeholder="Phone" />
                    <Input {...register(`relations.${index}.occupation`)} placeholder="Occupation" />
                    <Input {...register(`relations.${index}.email`)} placeholder="Email" />
                    <Input {...register(`relations.${index}.relation`)} placeholder="Relation" />
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
          <Button type="submit" className="px-8">
            Register Student
          </Button>
        </div>
      </form>

      {/* ---- RIGHT: Fee Preview ---- */}
      {isRegistered && studentData && (
  <div className="w-1/2 transition-all duration-500">
    <Card>
      <CardContent className="p-6 space-y-4">
        <h2 className="text-lg font-semibold"> Fee Preview</h2>

        <p><b>Student Name:</b> {studentData.student.name}</p>
        <p><b>Admission No:</b> {studentData.student.admissionNo}</p>

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

        {/* ✅ ADD BUTTON HERE */}
        <div className="flex justify-end mt-4">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white px-6"
            onClick={handleFeeSubmit}
            disabled={isFeeSubmitted}
          >
            {isFeeSubmitted ? "Fee Finalised" : "Finalise Fee"}
          </Button>
        </div>

      </CardContent>
    </Card>
  </div>
)}
    </div>
  );
};

export default StudentForm;