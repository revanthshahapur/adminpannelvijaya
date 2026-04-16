import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import StudentForm from './StudentForm';

import { formatINR } from '@/lib/utils';

type StudentSearchResult = {
  studentId: number;
  name: string;
  admissionNo: string;
  studentFeeAccountId: number;
  studentEnrollmentClassName: string;
};

type Guardian = {
  guardianId: number;
  name: string;
  phone: string;
  email: string;
  relation: string;
  occupation: string;
  aadhaarNo?: string | null;
};

type StudentFeeObject = {
  studentFeeAccountId: number;
  enrollmentId: number;
  studentClassName: string;
  academicYearName: string;
  totalAmount: number;
  totalAmountPaid: number;
};

type StudentDetails = {
  studentId: number;
  name: string;
  gender?: string;
  aadhaarNo?: string;
  bloodGroup?: string;
  religion?: string;
  caste?: string | null;
  phone?: string;
  email?: string;
  permanentAddress?: string;
  currentAddress?: string;
  guardians: Guardian[];
  studentFeeObject?: StudentFeeObject | null;
};

const Students = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState<StudentSearchResult[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const trimmedSearch = search.trim();

  useEffect(() => {
    if (!trimmedSearch || trimmedSearch.length < 3) {
      setStudents([]);
      setLoading(false);
      return;
    }

    const fetchStudents = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('authToken');
        if (!token) {
          toast.error('Token missing. Please login again.');
          return;
        }

        let schoolId = localStorage.getItem('schoolId');
        if (!schoolId) {
          const storedUser = localStorage.getItem('user');
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
          toast.error('School ID missing. Unable to search students.');
          return;
        }

        const url = `/api/${schoolId}/students/search?q=${encodeURIComponent(trimmedSearch)}`;
        console.log('Fetching students from:', url);

        const response = await fetch(
          url,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        console.log('Response status:', response.ok, 'Data:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch students');
        }

        setStudents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Unable to load students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [trimmedSearch]);

  const handleSelectStudent = async (student: StudentSearchResult) => {
    try {
      setLoadingDetails(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Token missing. Please login again.');
        return;
      }

      const response = await fetch(
        `/api/1/students/getStudent/${student.studentId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch student details');
      }

      setSelectedStudent(data);
      setShowAddForm(false);
      setStudents([]);
      setSearch('');
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast.error('Unable to load student details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedStudent(null);
  };

  return (
    <div className="w-full space-y-6">
      {/* Search Bar */}
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="relative w-[650px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />

          <Input
            placeholder="Search by name or admission number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-xl border border-border shadow-sm"
          />

          {/* Suggestions */}
          {search && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute mt-2 w-full bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50"
            >
              {loading && (
                <div className="p-4 text-sm text-muted-foreground">
                  Loading...
                </div>
              )}

              {!loading && trimmedSearch.length > 0 && trimmedSearch.length < 3 && (
                <div className="p-4 text-sm text-muted-foreground">
                  Type at least 3 characters
                </div>
              )}

              {!loading && trimmedSearch.length >= 3 && students.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">
                  No students found
                </div>
              )}

              {students.map((student) => (
                <div
                  key={student.studentId}
                  onClick={() => handleSelectStudent(student)}
                  className="px-5 py-3 hover:bg-muted cursor-pointer transition border-b last:border-b-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{student.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {student.admissionNo}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {student.studentEnrollmentClassName}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      ID: {student.studentFeeAccountId}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Add Button */}
        <Button
          onClick={() => {
            setShowAddForm(true);
            setSelectedStudent(null);
          }}
          className="rounded-full px-8 h-11"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Student
        </Button>
      </div>

      {/* Student Details */}
      {selectedStudent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Alert for unfinalised fee */}
          {!selectedStudent.studentFeeObject && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start gap-3">
              <div className="text-amber-600 mt-0.5">⚠️</div>
              <div>
                <p className="font-semibold text-amber-900">Fee Not Finalized</p>
                <p className="text-sm text-amber-800">
                  Fee is not finalized for this student. Please complete the fee registration to view fee details.{" "}
                  <Link
                    to={`/registration-preview/${selectedStudent.studentId}`}
                    className="font-medium underline underline-offset-2 hover:text-amber-900"
                  >
                    Finalize fee
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Student Info + Fee Details */}
          <div className="grid gap-6 grid-cols-3">
            {/* Student Personal Details - Left side */}
            <div className="col-span-2">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSelection}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium">{selectedStudent.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Aadhaar No</p>
                      <p className="font-medium">{selectedStudent.aadhaarNo || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Blood Group</p>
                      <p className="font-medium">{selectedStudent.bloodGroup || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Religion</p>
                      <p className="font-medium">{selectedStudent.religion || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Caste</p>
                      <p className="font-medium">{selectedStudent.caste || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedStudent.phone || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedStudent.email || 'N/A'}</p>
                  </div>

                  {selectedStudent.permanentAddress && (
                    <div className="mt-6">
                      <p className="text-sm text-muted-foreground">Permanent Address</p>
                      <p className="font-medium">{selectedStudent.permanentAddress}</p>
                    </div>
                  )}

                  {selectedStudent.currentAddress && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Current Address</p>
                      <p className="font-medium">{selectedStudent.currentAddress}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Fee Details - Right side */}
            {selectedStudent.studentFeeObject && (
              <div>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-4">Fee Details</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Class</p>
                        <p className="font-medium">{selectedStudent.studentFeeObject.studentClassName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Academic Year</p>
                        <p className="font-medium">{selectedStudent.studentFeeObject.academicYearName || 'N/A'}</p>
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="font-bold text-lg">{formatINR(selectedStudent.studentFeeObject.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Amount Paid</p>
                        <p className="font-bold text-green-600">{formatINR(selectedStudent.studentFeeObject.totalAmountPaid)}</p>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">Balance Due</p>
                        <p className="font-bold text-red-600">
                          {formatINR(selectedStudent.studentFeeObject.totalAmount - selectedStudent.studentFeeObject.totalAmountPaid)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!selectedStudent.studentFeeObject && (
              <div>
                <Card className="bg-gray-50 border-gray-300">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-400">Fee Details</h3>
                    <div className="space-y-4">
                      <div className="bg-white p-3 rounded border border-dashed border-gray-300 text-center">
                        <p className="text-sm text-gray-500">Not Available</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-dashed border-gray-300 text-center">
                        <p className="text-sm text-gray-500">Not Available</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-dashed border-gray-300 text-center">
                        <p className="text-sm text-gray-500">Not Available</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-dashed border-gray-300 text-center">
                        <p className="text-sm text-gray-500">Not Available</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-dashed border-gray-300 text-center">
                        <p className="text-sm text-gray-500">Not Available</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Guardians List - Below */}
          {selectedStudent.guardians && selectedStudent.guardians.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Guardians</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-semibold">Relation</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Phone</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Occupation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.guardians.map((guardian) => (
                        <tr key={guardian.guardianId} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 text-sm">{guardian.relation}</td>
                          <td className="py-3 px-4 text-sm">{guardian.name}</td>
                          <td className="py-3 px-4 text-sm">{guardian.phone}</td>
                          <td className="py-3 px-4 text-sm">{guardian.email}</td>
                          <td className="py-3 px-4 text-sm">{guardian.occupation || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Add New Student Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Add New Student</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <StudentForm 
                onClose={() => {
                  setShowAddForm(false);
                  setSearch('');
                }}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Students;
