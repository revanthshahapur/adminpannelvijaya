import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StudentFeePreview from "@/components/StudentFeePreview";
import RegistrationStudentDetails from "@/components/RegistrationStudentDetails";

const getSessionContext = () => {
  const token = localStorage.getItem("authToken");

  let schoolId = localStorage.getItem("schoolId");
  if (!schoolId) {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        schoolId =
          parsedUser.schoolId ||
          parsedUser.school_id ||
          parsedUser.school?.id ||
          parsedUser.user?.schoolId ||
          parsedUser.user?.school_id;
      } catch {
        // ignore parse errors
      }
    }
  }

  return { token, schoolId: schoolId ? String(schoolId) : "" };
};

const RegistrationPreview = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchPreview = async () => {
      if (!studentId) {
        setError("Student ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const { token, schoolId } = getSessionContext();
        if (!token) {
          throw new Error("Token missing. Please login again.");
        }

        if (!schoolId) {
          throw new Error("School ID missing. Please login again.");
        }

        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/${schoolId}/students/registration-preview/${studentId}`,
          {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            data?.message ||
            data?.error ||
            `Failed to load registration preview (HTTP ${response.status})`;
          throw new Error(message);
        }

        setStudentData(data);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : "Failed to load registration preview";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchPreview();
  }, [studentId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading registration preview...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !studentData) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Registration Preview Unavailable</h2>
            <p className="text-sm text-muted-foreground">
              {error || "Unable to load registration preview."}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/students">Back to Students</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registration Preview</h1>
          <p className="text-sm text-muted-foreground">
            Review and finalize the student fee details.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/students">Back to Students</Link>
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        <div className="lg:w-1/2">
          <RegistrationStudentDetails
            student={studentData.student}
            feeStructure={studentData.feeStructure}
            enrollmentId={studentData.enrollmentId}
          />
        </div>
        <div className="lg:w-1/2 space-y-4">
          <StudentFeePreview studentData={studentData} />
        </div>
      </div>
    </div>
  );
};

export default RegistrationPreview;
