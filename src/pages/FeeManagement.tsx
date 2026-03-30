import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader } from "lucide-react";
import { toast } from "sonner";

type StudentSearchResult = {
  studentId: number;
  name: string;
  admissionNo: string;
  studentEnrollmentClassName: string;
};

const FeeManagement = () => {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<StudentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Fetch students on search
  useEffect(() => {
    if (!search.trim()) {
      setStudents([]);
      return;
    }

    const fetchStudents = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("authToken");
        if (!token) {
          toast.error("Token missing. Please login again.");
          return;
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
          toast.error("School ID missing. Unable to search students.");
          return;
        }

        const url = `/api/${schoolId}/students/search?q=${encodeURIComponent(search)}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch students");
        }

        setStudents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching students:", error);
        toast.error("Unable to load students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [search]);

  // Handle student selection
  const handleSelectStudent = async (selectedStudent: StudentSearchResult) => {
    try {
      setPaymentLoading(true);
      setStudent(selectedStudent);
      setStudents([]);
      setSearch("");

      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Token missing. Please login again.");
        return;
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
        toast.error("School ID missing.");
        return;
      }

      // Fetch payment data using /api/payments endpoint
      const url = `/api/payments?schoolId=${schoolId}&studentId=${selectedStudent.studentId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch payment details");
      }

      setPaymentData(data);
      console.log("Payment Data:", data);
    } catch (error) {
      console.error("Error fetching payment data:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load payment details");
      setStudent(null);
      setPaymentData(null);
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">

      {/* 🔍 Search */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-3">
            <Input
              placeholder="Search Student by Name or Admission No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {loading && <Loader className="w-5 h-5 animate-spin" />}
          </div>

          {/* Search Results Dropdown */}
          {students.length > 0 && (
            <div className="border rounded-md bg-white shadow-lg max-h-64 overflow-y-auto">
              {students.map((s) => (
                <div
                  key={s.studentId}
                  onClick={() => handleSelectStudent(s)}
                  className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                >
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-gray-600">Admission No: {s.admissionNo}</p>
                  <p className="text-xs text-gray-500">{s.studentEnrollmentClassName}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!student && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            🔍 Search student to view payment details
          </CardContent>
        </Card>
      )}

      {student && paymentLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading payment details...
          </CardContent>
        </Card>
      )}

      {student && !paymentLoading && paymentData && (
        <>
          {/* 👤 Student Info */}
          <Card>
            <CardContent className="p-4 grid grid-cols-3 gap-4">
              <p><b>Name:</b> {student.name}</p>
              <p><b>Admission No:</b> {student.admissionNo}</p>
              <p><b>Class:</b> {student.studentEnrollmentClassName}</p>
            </CardContent>
          </Card>

          {/* 📊 Fee Details */}
          <Card>
            <CardContent className="p-4 overflow-x-auto">
              <h3 className="font-semibold mb-3">Fee Details</h3>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(paymentData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default FeeManagement;