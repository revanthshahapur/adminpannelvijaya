import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Student = {
  id: number;
  admissionNo: string;
  name: string;
  dob?: string;
  gender?: string;
  aadhaarNo?: string;
  bloodGroup?: string;
  religion?: string;
  caste?: string;
};

const StudentView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem("authToken");

        if (!token) {
          toast.error("Session expired. Please login again.");
          navigate("/login");
          return;
        }

        const response = await fetch(
          `/api/1/students/getStudent/${id}`, // ✅ IMPORTANT: NO full URL
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || "Failed to fetch student");
        }

        const data = await response.json();
        setStudent(data);
      } catch (error: any) {
        console.error(error);
        toast.error(error.message || "Failed to load student");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id, navigate]);

  if (loading) {
    return <div className="p-10">Loading...</div>;
  }

  if (!student) {
    return (
      <div className="p-10 text-center space-y-4">
        <p className="text-lg font-medium">Student not found</p>
        <Button onClick={() => navigate("/students")}>
          Back to Students
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full px-12 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT SIDE */}
        <Card className="col-span-1 shadow-sm rounded-2xl">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-xl">
                  {student.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div>
                <h2 className="text-xl font-semibold">
                  {student.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Admission No: {student.admissionNo}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gender</span>
                <span>{student.gender || "-"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Date of Birth</span>
                <span>{student.dob || "-"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Aadhaar</span>
                <span>{student.aadhaarNo || "-"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Blood Group</span>
                <span>{student.bloodGroup || "-"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Religion</span>
                <span>{student.religion || "-"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Caste</span>
                <span>{student.caste || "-"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT SIDE */}
        <Card className="col-span-2 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-6">
              Fee Structure
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between p-4 rounded-lg bg-muted">
                <span>Tuition Fee</span>
                <span>₹ 25,000</span>
              </div>

              <div className="flex justify-between p-4 rounded-lg bg-muted">
                <span>Transport Fee</span>
                <span>₹ 8,000</span>
              </div>

              <div className="flex justify-between p-4 rounded-lg bg-muted">
                <span>Library Fee</span>
                <span>₹ 2,000</span>
              </div>

              <Separator />

              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>₹ 35,000</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default StudentView;