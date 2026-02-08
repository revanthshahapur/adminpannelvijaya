import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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

const StudentForm = () => {
  const { control, register, handleSubmit, reset } =
    useForm<StudentFormValues>({
      defaultValues: {
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

  // ================= SUBMIT HANDLER (UNCHANGED) =================
  const onSubmit = async (values: StudentFormValues) => {
    try {
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
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error occurred");
    }
  };

  // ================= UI =================
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-6xl">

      {/* Admission Details */}
      <Card className="glass-card">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Admission Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Input {...register("admissionNo")} placeholder="Admission No" />
            <Input {...register("academicYearId")} placeholder="Academic Year ID" />
            <Input type="date" {...register("admissionDate")} />
            <Input {...register("admissionClassId")} placeholder="Admission Class ID" />
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card className="glass-card">
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

      {/* Contact & Address */}
      <Card className="glass-card">
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

      {/* Academic History */}
      <Card className="glass-card">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Academic History</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Input {...register("previousSchool")} placeholder="Previous School" />
            <Input {...register("previousClass")} placeholder="Previous Class" />
            <Input {...register("previousBoard")} placeholder="Previous Board" />
            <Input {...register("satsId")} placeholder="SATS ID" />
          </div>
        </CardContent>
      </Card>

      {/* Guardians */}
      <Card className="glass-card">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Guardians</h2>

          {fields.map((field, index) => (
            <Card key={field.id} className="border">
              <CardContent className="p-4 space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <Input {...register(`relations.${index}.name`)} placeholder="Name" />
                  <Input {...register(`relations.${index}.contact`)} placeholder="Phone" />
                  <Input {...register(`relations.${index}.occupation`)} placeholder="Occupation" />
                  <Input {...register(`relations.${index}.email`)} placeholder="Email" />
                  <Input {...register(`relations.${index}.relation`)} placeholder="Relation" />
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  Remove Guardian
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
      <div className="flex justify-end">
        <Button type="submit" className="px-8">
          Register Student
        </Button>
      </div>
    </form>
  );
};

export default StudentForm;
