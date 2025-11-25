import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Download, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getStudent, getFeeRecord } = useAppStore();

  const student = getStudent(parseInt(id!));
  const feeRecord = getFeeRecord(parseInt(id!));

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Student not found</p>
        <Button onClick={() => navigate('/students')} className="mt-4">
          Back to Students
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/students')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{student.name}</h1>
            <p className="text-muted-foreground">{student.regNo}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/students/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student Name:</span>
              <span className="font-medium">{student.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Register No:</span>
              <span className="font-medium">{student.regNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Father's Name:</span>
              <span className="font-medium">{student.father}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mother's Name:</span>
              <span className="font-medium">{student.mother}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date of Birth:</span>
              <span className="font-medium">{student.dob || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gender:</span>
              <span className="font-medium">{student.gender || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aadhaar:</span>
              <span className="font-medium">{student.aadhaar}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium">{student.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address:</span>
              <span className="font-medium">{student.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  student.status === 'Active'
                    ? 'bg-success/10 text-success'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {student.status}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Class:</span>
              <span className="font-medium">{student.class}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Marks Obtained:</span>
              <span className="font-medium">{student.marks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Previous School:</span>
              <span className="font-medium">{student.previousSchool}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hostel Facility:</span>
              <span className="font-medium">{student.hostel ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium">{student.caste}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Annual Family Income:</span>
              <span className="font-medium">₹{student.income.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {feeRecord && (
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Fee Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-primary/10">
                  <p className="text-sm text-muted-foreground mb-1">Total Fee</p>
                  <p className="text-2xl font-bold text-primary">
                    ₹{feeRecord.totalFee.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-success/10">
                  <p className="text-sm text-muted-foreground mb-1">Paid</p>
                  <p className="text-2xl font-bold text-success">
                    ₹{feeRecord.paid.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-warning/10">
                  <p className="text-sm text-muted-foreground mb-1">Balance</p>
                  <p className="text-2xl font-bold text-warning">
                    ₹{feeRecord.balance.toLocaleString()}
                  </p>
                </div>
              </div>

              {feeRecord.payments.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Payment History</h3>
                  <div className="space-y-2">
                    {feeRecord.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">₹{payment.amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {payment.method} • {payment.date}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{payment.receiptNo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
};

export default StudentProfile;
