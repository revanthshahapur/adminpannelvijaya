import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";

const StudentForm = () => {
  const { control, register, handleSubmit, reset } = useForm<StudentFormValues>({
    defaultValues: { relations: [{ name: "", contact: "", occupation: "", email: "", relation: "", otherRelation: "" }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "relations" });

  const onSubmit = async (values: StudentFormValues) => {
    try {
      console.log("🔥 SUBMIT CLICKED", values);
      const token = localStorage.getItem("authToken");
      if (!token) return toast.error("Token missing. Please login again.");

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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Student registration failed");

      toast.success("🎉 Student registered successfully");
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl mx-auto p-4 space-y-6">
      
      {/* 1️⃣ Student Basic Details */}
      <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
        <h2 className="font-poppins font-semibold text-lg">Student Information</h2>
        <input {...register("admissionNo")} placeholder="Admission No" readOnly className="input-field" />
        <input {...register("academicYearId")} placeholder="Academic Year" className="input-field" />
        <input type="date" {...register("admissionDate")} className="input-field" />
        <input {...register("admissionClassId")} placeholder="Admission Class ID" className="input-field" />
      </div>

      {/* 2️⃣ Personal Details */}
      <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
        <h2 className="font-poppins font-semibold text-lg">Personal Details</h2>
        <input {...register("fullName")} placeholder="Full Name" className="input-field" />
        <input type="date" {...register("dob")} className="input-field" />
        <input {...register("placeOfBirth")} placeholder="Place of Birth" className="input-field" />
        <select {...register("gender")} className="input-field">
          <option value="">Select Gender</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
        <input {...register("bloodGroup")} placeholder="Blood Group" className="input-field" />
        <input {...register("aadhaarNo")} placeholder="XXXX XXXX 9012" className="input-field" />
      </div>

      {/* 3️⃣ Social & Category Details */}
      <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
        <h2 className="font-poppins font-semibold text-lg">Community Information</h2>
        <input {...register("religion")} placeholder="Religion" className="input-field" />
        <input {...register("caste")} placeholder="Caste" className="input-field" />
        <input {...register("subCaste")} placeholder="Sub-Caste" className="input-field" />
        <input {...register("category")} placeholder="Category" className="input-field" />
      </div>

      {/* 4️⃣ Contact & Address */}
      <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
        <h2 className="font-poppins font-semibold text-lg">Contact Information</h2>
        <input {...register("phone")} placeholder="Phone" className="input-field" />
        <input {...register("email")} placeholder="Email" className="input-field" />
        <textarea {...register("permanentAddress")} placeholder="Permanent Address" className="input-field" />
        <textarea {...register("currentAddress")} placeholder="Current Address" className="input-field" />
      </div>

      {/* 5️⃣ Previous Academic Details */}
      <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
        <h2 className="font-poppins font-semibold text-lg">Previous School Details</h2>
        <input {...register("previousSchool")} placeholder="Previous School" className="input-field" />
        <input {...register("previousClass")} placeholder="Previous Class" className="input-field" />
        <input {...register("previousBoard")} placeholder="Previous Board" className="input-field" />
        <input {...register("satsId")} placeholder="SATS ID" className="input-field" />
      </div>

      {/* 6️⃣ Guardian Details */}
      <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
        <h2 className="font-poppins font-semibold text-lg">Guardian Details</h2>
        {fields.map((field, index) => (
          <div key={field.id} className="border border-gray-200 p-3 rounded-md space-y-2">
            <input {...register(`relations.${index}.name`)} placeholder="Name" className="input-field" />
            <input {...register(`relations.${index}.contact`)} placeholder="Phone" className="input-field" />
            <input {...register(`relations.${index}.occupation`)} placeholder="Occupation" className="input-field" />
            <input {...register(`relations.${index}.email`)} placeholder="Email" className="input-field" />
            <input {...register(`relations.${index}.relation`)} placeholder="Relation" className="input-field" />
            <input {...register(`relations.${index}.otherRelation`)} placeholder="Other Relation" className="input-field" />
            <button type="button" onClick={() => remove(index)} className="btn-red">❌ Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => append({ name: "", contact: "", occupation: "", email: "", relation: "", otherRelation: "" })} className="btn-blue">
          ➕ Add Guardian
        </button>
      </div>

      {/* Submit */}
      <div className="flex gap-3 mt-4">
        <button type="submit" className="btn-green">✅ Submit Student</button>
      </div>
    </form>
  );
};

export default StudentForm;
