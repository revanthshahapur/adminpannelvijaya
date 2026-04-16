import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Guardian = {
  id?: number;
  name?: string;
  phone?: string;
  occupation?: string;
  email?: string | null;
  relation?: string;
  aadhaarNo?: string | null;
};

type RegistrationStudentDetailsProps = {
  student: any;
  feeStructure?: any;
  enrollmentId?: number | null;
};

const safe = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }
  return String(value);
};

const RegistrationStudentDetails = ({
  student,
  feeStructure,
  enrollmentId,
}: RegistrationStudentDetailsProps) => {
  if (!student) {
    return null;
  }

  const guardians: Guardian[] = Array.isArray(student.guardians) ? student.guardians : [];

  return (
    <div className="space-y-6">
      {/* Admission Details */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Admission Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Admission No</span>
              <Input value={safe(student.admissionNo)} readOnly />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Admission Date</span>
              <Input value={safe(student.admissionDate)} readOnly />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Admission Class</span>
              <Input
                value={feeStructure?.className ? String(feeStructure.className) : safe(student.admissionClassId)}
                readOnly
              />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Academic Year</span>
              <Input
                value={safe(student.admissionAcademicYearId ?? feeStructure?.academicYearId)}
                readOnly
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <span className="text-sm text-muted-foreground">Enrollment ID</span>
              <Input value={safe(enrollmentId)} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Personal Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Full Name</span>
              <Input value={safe(student.name ?? student.fullName)} readOnly />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Date of Birth</span>
              <Input value={safe(student.dob)} readOnly />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Gender</span>
              <Input value={safe(student.gender)} readOnly />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Aadhaar No</span>
              <Input value={safe(student.aadhaarNo)} readOnly />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Blood Group</span>
              <Input value={safe(student.bloodGroup)} readOnly />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Religion</span>
              <Input value={safe(student.religion)} readOnly />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Caste</span>
              <Input value={safe(student.caste)} readOnly />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Sub Caste</span>
              <Input value={safe(student.subCaste)} readOnly />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Category</span>
              <Input value={safe(student.category)} readOnly />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Place Of Birth</span>
              <Input value={safe(student.placeOfBirth)} readOnly />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">SATS ID</span>
              <Input value={safe(student.satsId)} readOnly />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Previous School</span>
              <Input value={safe(student.previousSchool)} readOnly />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Previous Class</span>
              <Input value={safe(student.previousClass)} readOnly />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Previous Board</span>
              <Input value={safe(student.previousBoard)} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact & Address */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Contact & Address</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Phone</span>
              <Input value={safe(student.phone)} readOnly />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Email</span>
              <Input value={safe(student.email)} readOnly />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Permanent Address</span>
              <Textarea value={safe(student.permanentAddress)} readOnly className="min-h-[88px]" />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Current Address</span>
              <Textarea value={safe(student.currentAddress)} readOnly className="min-h-[88px]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guardians */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Guardians</h2>

          {guardians.length === 0 ? (
            <div className="text-sm text-muted-foreground">No guardians found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border">
                <thead>
                  <tr className="border bg-gray-100">
                    <th className="p-2 border text-left">Relation</th>
                    <th className="p-2 border text-left">Name</th>
                    <th className="p-2 border text-left">Phone</th>
                    <th className="p-2 border text-left">Email</th>
                    <th className="p-2 border text-left">Occupation</th>
                  </tr>
                </thead>
                <tbody>
                  {guardians.map((g, idx) => (
                    <tr key={g.id ?? `${g.relation ?? "guardian"}-${idx}`} className="border hover:bg-gray-50">
                      <td className="p-2 border">{safe(g.relation)}</td>
                      <td className="p-2 border">{safe(g.name)}</td>
                      <td className="p-2 border">{safe(g.phone)}</td>
                      <td className="p-2 border">{safe(g.email)}</td>
                      <td className="p-2 border">{safe(g.occupation)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationStudentDetails;

