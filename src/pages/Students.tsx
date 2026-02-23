import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('authToken');
        if (!token) {
          toast.error('Token missing. Please login again.');
          return;
        }

        const response = await fetch('/api/1/students/getStudents', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch students');
        }

        setStudents(data);
      } catch (error) {
        toast.error('Unable to load students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filteredStudents =
    search.trim() === ''
      ? []
      : students.filter(
          (student) =>
            student.fullName.toLowerCase().includes(search.toLowerCase()) ||
            student.admissionNo.toLowerCase().includes(search.toLowerCase())
        );

  return (
    <div className="w-full  ">
      {/* Top Row */}
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

              {!loading && filteredStudents.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">
                  No students found
                </div>
              )}

              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => navigate(`/students/${student.id}`)}
                  className="px-5 py-3 hover:bg-muted cursor-pointer transition flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{student.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.admissionNo}
                    </p>
                  </div>

                  <span className="text-xs text-muted-foreground">
                    {student.className}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Add Button */}
        <Button
          onClick={() => navigate('/students/new')}
          className="rounded-full px-8 h-11"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Student
        </Button>
      </div>
    </div>
  );
};

export default Students;
