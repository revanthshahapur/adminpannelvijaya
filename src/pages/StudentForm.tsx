import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";

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

  // ================= SUBMIT HANDLER =================
  const onSubmit = async (values: StudentFormValues) => {
    try {
      console.log("🔥 SUBMIT CLICKED", values);

      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Token missing. Please login again.");
        return;
      }

const payload = {
  admissionNo: values.admissionNo,
  admissionAcademicYearId: Number(values.academicYearId),
  aadhaarNo: values.aadhaarNo,
  fullName: values.fullName,

  dob: values.dob, // MUST be yyyy-MM-dd
  admissionDate: values.admissionDate, // yyyy-MM-dd

  placeOfBirth: values.placeOfBirth,
  gender: values.gender.toUpperCase(),
  bloodGroup: values.bloodGroup,
  religion: values.religion.trim(),
  caste: values.caste,
  subCaste: values.subCaste,
  category: values.category,

  permanentAddress: values.permanentAddress,
  currentAddress: values.currentAddress,

  phone: values.phone.replace(/^0+/, ""), // remove leading zero
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
    relation: r.relation.toUpperCase(), // 🔥 IMPORTANT
  })),
};

      const response = await fetch(
  "/api/1/students/registerStudent", // ✅ PROXY URL
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
  throw new Error(data.message || "Student registration failed");
}

toast.success("🎉 Student registered successfully");
reset();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  // ================= UI =================
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{ padding: "20px", maxWidth: "900px" }}
    >
      <input {...register("admissionNo")} placeholder="Admission No" />
      <input {...register("academicYearId")} placeholder="Academic Year ID" />
      <input {...register("aadhaarNo")} placeholder="Aadhaar No" />
      <input {...register("fullName")} placeholder="Full Name" />
      <input type="date" {...register("dob")} />
      <input {...register("placeOfBirth")} placeholder="Place of Birth" />
      <input {...register("gender")} placeholder="Gender" />
      <input {...register("bloodGroup")} placeholder="Blood Group" />
      <input {...register("religion")} placeholder="Religion" />
      <input {...register("caste")} placeholder="Caste" />
      <input {...register("subCaste")} placeholder="Sub Caste" />
      <input {...register("category")} placeholder="Category" />
      <textarea {...register("permanentAddress")} placeholder="Permanent Address" />
      <textarea {...register("currentAddress")} placeholder="Current Address" />
      <input {...register("phone")} placeholder="Phone" />
      <input {...register("email")} placeholder="Email" />
      <input type="date" {...register("admissionDate")} />
      <input {...register("admissionClassId")} placeholder="Admission Class ID" />
      <input {...register("previousSchool")} placeholder="Previous School" />
      <input {...register("previousClass")} placeholder="Previous Class" />
      <input {...register("previousBoard")} placeholder="Previous Board" />
      <input {...register("satsId")} placeholder="SATS ID" />

      <hr />

      <h3>Guardians</h3>

      {fields.map((field, index) => (
        <div key={field.id} style={{ border: "1px solid #ddd", padding: "10px" }}>
          <input {...register(`relations.${index}.name`)} placeholder="Name" />
          <input {...register(`relations.${index}.contact`)} placeholder="Phone" />
          <input
            {...register(`relations.${index}.occupation`)}
            placeholder="Occupation"
          />
          <input {...register(`relations.${index}.email`)} placeholder="Email" />
          <input {...register(`relations.${index}.relation`)} placeholder="Relation" />
          <input
            {...register(`relations.${index}.otherRelation`)}
            placeholder="Other Relation"
          />
          <button type="button" onClick={() => remove(index)}>
            ❌ Remove
          </button>
        </div>
      ))}

      {/* BUTTON FIX */}
      <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
        <button
          type="button"
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
          style={{
            padding: "8px 16px",
            background: "#6366f1",
            color: "#fff",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
          }}
        >
          ➕ Add Guardian
        </button>

        <button
          type="submit"
          style={{
            padding: "8px 20px",
            background: "#16a34a",
            color: "#fff",
            borderRadius: "6px",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          ✅ Submit Student
        </button>
      </div>
    </form>
  );
};

export default StudentForm;
