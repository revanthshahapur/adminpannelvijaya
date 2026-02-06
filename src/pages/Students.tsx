import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Eye, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

type Student = {
  id: number;
  admissionNo: string;
  fullName: string;
  className: string;
  sectionName: string | null;
};

const Students = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // ✅ SAME STYLE AS registerStudent
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('authToken');
        if (!token) {
          toast.error('Token missing. Please login again.');
          return;
        }

        const response = await fetch(
          '/api/1/students/getStudents', // ✅ PROXY URL
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch students');
        }

        setStudents(data);
      } catch (error) {
        console.error(error);
        toast.error('Unable to load students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // 🔍 SEARCH + FILTER
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.fullName.toLowerCase().includes(search.toLowerCase()) ||
      student.admissionNo.toLowerCase().includes(search.toLowerCase());

    const matchesClass =
      classFilter === 'all' || student.className === classFilter;

    return matchesSearch && matchesClass;
  });

  const classes = [...new Set(students.map((s) => s.className))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Students</h1>
          <p className="text-muted-foreground">
            Manage student records and information
          </p>
        </div>
        <Button
          onClick={() => navigate('/students/new')}
          className="rounded-full px-5 glow"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Student
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or admission number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 glass"
              />
            </div>

            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full sm:w-40 glass">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profile</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                          {student.fullName.charAt(0)}
                        </div>
                      </TableCell>

                      <TableCell className="font-medium">
                        {student.fullName}
                      </TableCell>

                      <TableCell>{student.admissionNo}</TableCell>
                      <TableCell>{student.className}</TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              navigate(`/students/${student.id}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              navigate(`/students/${student.id}/edit`)
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {loading && (
              <div className="text-center py-10 text-muted-foreground">
                Loading students...
              </div>
            )}

            {!loading && filteredStudents.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No students found
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredStudents.length} of {students.length} students
      </div>
    </div>
  );
};

export default Students;
