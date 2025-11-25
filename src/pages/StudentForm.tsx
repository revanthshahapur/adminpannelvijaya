import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const StudentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addStudent, updateStudent, getStudent } = useAppStore();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    father: '',
    mother: '',
    dob: '',
    gender: 'Male',
    aadhaar: '',
    address: '',
    phone: '',
    class: '',
    marks: '',
    previousSchool: '',
    hostel: false,
    caste: 'GM',
    income: '',
    status: 'Active',
  });

  useEffect(() => {
    if (isEdit && id) {
      const student = getStudent(parseInt(id));
      if (student) {
        setFormData({
          name: student.name,
          father: student.father,
          mother: student.mother,
          dob: student.dob || '',
          gender: student.gender || 'Male',
          aadhaar: student.aadhaar,
          address: student.address,
          phone: student.phone,
          class: student.class,
          marks: student.marks.toString(),
          previousSchool: student.previousSchool,
          hostel: student.hostel,
          caste: student.caste,
          income: student.income.toString(),
          status: student.status,
        });
      }
    }
  }, [id, isEdit, getStudent]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.class || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    const studentData = {
      name: formData.name,
      regNo: isEdit
        ? getStudent(parseInt(id!))?.regNo || ''
        : `STU${Math.floor(1000 + Math.random() * 9000)}`,
      class: formData.class,
      phone: formData.phone,
      status: formData.status,
      father: formData.father,
      mother: formData.mother,
      aadhaar: formData.aadhaar,
      address: formData.address,
      dob: formData.dob,
      gender: formData.gender,
      marks: parseInt(formData.marks) || 0,
      previousSchool: formData.previousSchool,
      hostel: formData.hostel,
      caste: formData.caste,
      income: parseInt(formData.income) || 0,
    };

    if (isEdit) {
      updateStudent(parseInt(id!), studentData);
      toast.success('Student updated successfully');
    } else {
      addStudent(studentData);
      toast.success('Student added successfully');
    }

    navigate('/students');
  };

  const handleReset = () => {
    if (isEdit) {
      const student = getStudent(parseInt(id!));
      if (student) {
        setFormData({
          name: student.name,
          father: student.father,
          mother: student.mother,
          dob: student.dob || '',
          gender: student.gender || 'Male',
          aadhaar: student.aadhaar,
          address: student.address,
          phone: student.phone,
          class: student.class,
          marks: student.marks.toString(),
          previousSchool: student.previousSchool,
          hostel: student.hostel,
          caste: student.caste,
          income: student.income.toString(),
          status: student.status,
        });
      }
    } else {
      setFormData({
        name: '',
        father: '',
        mother: '',
        dob: '',
        gender: 'Male',
        aadhaar: '',
        address: '',
        phone: '',
        class: '',
        marks: '',
        previousSchool: '',
        hostel: false,
        caste: 'GM',
        income: '',
        status: 'Active',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/students')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isEdit ? 'Edit Student' : 'Add New Student'}</h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Update student information' : 'Fill in the student details below'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Student Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  className="glass"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleChange('dob', e.target.value)}
                  className="glass"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="father">Father's Name</Label>
                <Input
                  id="father"
                  value={formData.father}
                  onChange={(e) => handleChange('father', e.target.value)}
                  className="glass"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mother">Mother's Name</Label>
                <Input
                  id="mother"
                  value={formData.mother}
                  onChange={(e) => handleChange('mother', e.target.value)}
                  className="glass"
                />
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) => handleChange('gender', value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Male" id="male" />
                    <Label htmlFor="male" className="cursor-pointer">
                      Male
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Female" id="female" />
                    <Label htmlFor="female" className="cursor-pointer">
                      Female
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhaar">Aadhaar Number</Label>
                <Input
                  id="aadhaar"
                  value={formData.aadhaar}
                  onChange={(e) => handleChange('aadhaar', e.target.value)}
                  maxLength={12}
                  className="glass"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  required
                  className="glass"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caste">Category</Label>
                <Select value={formData.caste} onValueChange={(value) => handleChange('caste', value)}>
                  <SelectTrigger className="glass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GM">General</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="ST">ST</SelectItem>
                    <SelectItem value="OBC">OBC</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  rows={3}
                  className="glass"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card mt-6">
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="class">
                  Class Applying For <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.class} onValueChange={(value) => handleChange('class', value)}>
                  <SelectTrigger className="glass">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-A">Class 1-A</SelectItem>
                    <SelectItem value="2-A">Class 2-A</SelectItem>
                    <SelectItem value="3-A">Class 3-A</SelectItem>
                    <SelectItem value="4-A">Class 4-A</SelectItem>
                    <SelectItem value="5-A">Class 5-A</SelectItem>
                    <SelectItem value="6-A">Class 6-A</SelectItem>
                    <SelectItem value="7-A">Class 7-A</SelectItem>
                    <SelectItem value="8-A">Class 8-A</SelectItem>
                    <SelectItem value="9-A">Class 9-A</SelectItem>
                    <SelectItem value="9-B">Class 9-B</SelectItem>
                    <SelectItem value="10-A">Class 10-A</SelectItem>
                    <SelectItem value="10-B">Class 10-B</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marks">Marks Obtained</Label>
                <Input
                  id="marks"
                  type="number"
                  value={formData.marks}
                  onChange={(e) => handleChange('marks', e.target.value)}
                  className="glass"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previousSchool">Previous School Name</Label>
                <Input
                  id="previousSchool"
                  value={formData.previousSchool}
                  onChange={(e) => handleChange('previousSchool', e.target.value)}
                  className="glass"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="income">Annual Family Income (₹)</Label>
                <Input
                  id="income"
                  type="number"
                  value={formData.income}
                  onChange={(e) => handleChange('income', e.target.value)}
                  className="glass"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hostel"
                  checked={formData.hostel}
                  onCheckedChange={(checked) => handleChange('hostel', checked)}
                />
                <Label htmlFor="hostel" className="cursor-pointer">
                  Hostel Facility Required
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button type="submit" className="glow">
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? 'Update Student' : 'Save Student'}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default StudentForm;
