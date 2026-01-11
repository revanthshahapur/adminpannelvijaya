import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import {
  ArrowLeft,
  BadgeCheck,
  Bus,
  FileUp,
  Home,
  IdCard,
  School,
  User,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

type FacilityToggle = {
  enabled: boolean;
  details: {
    transportRoute?: string;
    busNumber?: string;
    hostelRoomType?: string;
    messPreference?: string;
  };
};

type UploadedDoc = {
  fileName: string;
  fileType: string;
  url: string;
};

type Relation = {
  relation: string;
  otherRelation?: string;
  name: string;
  occupation: string;
  contact: string;
};

type StudentFormValues = {
  fullName: string;
  aadhaarNumber?: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  nationality: string;
  religion?: string;
  category?: string;
  subCaste?: string;
  disability: boolean;

  permanentAddress: string;
  permanentState: string;
  permanentDistrict: string;
  permanentCity: string;
  permanentPinCode: string;
  currentAddress: string;
  currentState: string;
  currentDistrict: string;
  currentCity: string;
  currentPinCode: string;
  sameAsPermanent: boolean;

  fatherName: string;
  fatherOccupation: string;
  fatherContact: string;
  motherName: string;
  motherOccupation: string;
  motherContact: string;
  guardianName?: string;
  guardianOccupation?: string;
  guardianContact?: string;

  admissionNumber: string;
  courseClass: string;
  admissionYear: string;
  previousInstitute?: string;
  previousClass?: string;
  previousMarks?: string;
  boardUniversity?: string;

  transport: FacilityToggle;
  hostel: FacilityToggle;

  relations: Relation[];

  documents: {
    studentPhoto?: UploadedDoc;
    aadhaarCard?: UploadedDoc;
    transferCertificate?: UploadedDoc;
    previousMarksheet?: UploadedDoc;
    birthCertificate?: UploadedDoc;
    migrationCertificate?: UploadedDoc;
    casteCertificate?: UploadedDoc;
  };
};

const SECTION_KEYS = [
  'personal',
  'academic',
  'contact',
  'parents',
  'facilities',
  'documents',
] as const;

type SectionKey = (typeof SECTION_KEYS)[number];

const StudentForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { addStudent, updateStudent, getStudent } = useAppStore();

  const [activeSection, setActiveSection] = useState<SectionKey>('personal');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const existingStudent = useMemo(
    () => (isEdit && id ? getStudent(parseInt(id, 10)) : undefined),
    [id, isEdit, getStudent],
  );

  const currentYear = new Date().getFullYear().toString();

  const form = useForm<StudentFormValues>({
    mode: 'onBlur',
    defaultValues: {
      fullName: existingStudent?.name ?? '',
      aadhaarNumber: existingStudent?.aadhaar ?? '',
      dateOfBirth: existingStudent?.dob ?? '',
      gender: (existingStudent?.gender as StudentFormValues['gender']) ?? 'Male',
      bloodGroup: '',
      nationality: 'Indian',
      religion: '',
      category: existingStudent?.caste ?? '',
      subCaste: '',
      disability: false,

      permanentAddress: existingStudent?.address ?? '',
      permanentState: '',
      permanentDistrict: '',
      permanentCity: '',
      permanentPinCode: '',
      currentAddress: existingStudent?.address ?? '',
      currentState: '',
      currentDistrict: '',
      currentCity: '',
    currentPinCode: '',
    sameAsPermanent: true,

    fatherName: existingStudent?.father ?? '',
    fatherOccupation: '',
    fatherContact: existingStudent?.phone ?? '',
    motherName: existingStudent?.mother ?? '',
    motherOccupation: '',
    motherContact: '',
    guardianName: '',
    guardianOccupation: '',
    guardianContact: '',

    admissionNumber: existingStudent?.regNo ?? '',
      courseClass: existingStudent?.class ?? '',
      admissionYear: currentYear,
      previousInstitute: existingStudent?.previousSchool ?? '',
      previousClass: '',
      previousMarks: '',
      boardUniversity: '',

      transport: {
        enabled: false,
        details: {},
      },
      hostel: {
        enabled: existingStudent?.hostel ?? false,
        details: {},
      },

      relations: [
        {
          relation: 'father',
          name: existingStudent?.father ?? '',
          occupation: '',
          contact: existingStudent?.phone ?? '',
        },
        {
          relation: 'mother',
          name: existingStudent?.mother ?? '',
          occupation: '',
          contact: '',
        },
      ],

      documents: {},
    },
  });

  const relations = useFieldArray({
    control: form.control,
    name: 'relations',
  });

  const watchSameAddress = form.watch('sameAsPermanent');
  const watchPermanentAddress = form.watch('permanentAddress');
  const watchPermanentState = form.watch('permanentState');
  const watchPermanentDistrict = form.watch('permanentDistrict');
  const watchPermanentCity = form.watch('permanentCity');
  const watchPermanentPinCode = form.watch('permanentPinCode');
  const watchCourseClass = form.watch('courseClass');
  const watchTransport = form.watch('transport.enabled');
  const watchHostel = form.watch('hostel.enabled');

  useEffect(() => {
    if (watchSameAddress) {
      form.setValue('currentAddress', watchPermanentAddress);
      form.setValue('currentState', watchPermanentState);
      form.setValue('currentDistrict', watchPermanentDistrict);
      form.setValue('currentCity', watchPermanentCity);
      form.setValue('currentPinCode', watchPermanentPinCode);
    }
  }, [watchSameAddress, watchPermanentAddress, watchPermanentState, watchPermanentDistrict, watchPermanentCity, watchPermanentPinCode, form]);

  useEffect(() => {
    if (watchCourseClass) {
      const admissionNumber = form.getValues('admissionNumber');
      if (!admissionNumber || !isEdit) {
        const generated = generateAdmissionNumber(watchCourseClass);
        form.setValue('admissionNumber', generated);
      }
    }
  }, [watchCourseClass, isEdit, form]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!form.formState.isDirty) return;
      const values = form.getValues();
      console.debug('Auto-saving draft student form', values);
      setLastSavedAt(new Date());
      form.reset(values, { keepDirty: false });
    }, 10_000);

    return () => clearInterval(interval);
  }, [form]);

  const progress = useMemo(() => {
    const index = SECTION_KEYS.indexOf(activeSection);
    return Math.round(((index + 1) / SECTION_KEYS.length) * 100);
  }, [activeSection]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof StudentFormValues['documents'],
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const doc: UploadedDoc = {
      fileName: file.name,
      fileType: file.type,
      url: URL.createObjectURL(file),
    };

    const docs = form.getValues('documents');
    form.setValue('documents', { ...docs, [key]: doc }, { shouldDirty: true });
  };

  const handleRemoveFile = (key: keyof StudentFormValues['documents']) => {
    const docs = form.getValues('documents');
    const updated = { ...docs, [key]: undefined };
    form.setValue('documents', updated, { shouldDirty: true });
  };

  const generateAdmissionNumber = (courseClass: string) => {
    const year = new Date().getFullYear().toString();
    const classCode = courseClass
      ? courseClass.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
      : 'GEN';
    const randomId = Math.floor(1000 + Math.random() * 9000).toString();
    return `${year}${classCode}${randomId}`;
  };

  const onSubmit = (values: StudentFormValues) => {
    const admissionNo =
      values.admissionNumber || generateAdmissionNumber(values.courseClass);

    const coreStudent = {
      name: values.fullName,
      regNo: admissionNo,
      class: values.courseClass,
      phone: values.fatherContact || values.motherContact || '',
      status: 'Active',
      father: values.fatherName,
      mother: values.motherName,
      aadhaar: values.aadhaarNumber || '',
      address: values.permanentAddress,
      dob: values.dateOfBirth,
      gender: values.gender,
      marks: 0,
      previousSchool: values.previousInstitute || '',
      hostel: values.hostel.enabled,
      caste: values.category || '',
      income: 0,
    };

    const jsonPayload = {
      ...coreStudent,
      extended: {
        personal: {
          bloodGroup: values.bloodGroup,
          nationality: values.nationality,
          religion: values.religion,
          category: values.category,
          subCaste: values.subCaste,
          disability: values.disability,
        },
        contact: {
          permanentAddress: values.permanentAddress,
          permanentState: values.permanentState,
          permanentDistrict: values.permanentDistrict,
          permanentCity: values.permanentCity,
          permanentPinCode: values.permanentPinCode,
          currentAddress: values.currentAddress,
          currentState: values.currentState,
          currentDistrict: values.currentDistrict,
          currentCity: values.currentCity,
          currentPinCode: values.currentPinCode,
        },
        parents: {
          father: {
            name: values.fatherName,
            occupation: values.fatherOccupation,
            contact: values.fatherContact,
          },
          mother: {
            name: values.motherName,
            occupation: values.motherOccupation,
            contact: values.motherContact,
          },
          guardian: {
            name: values.guardianName,
            occupation: values.guardianOccupation,
            contact: values.guardianContact,
          },
        },
        academic: {
          admissionNumber: admissionNo,
          courseClass: values.courseClass,
          admissionYear: values.admissionYear,
          previousInstitute: values.previousInstitute,
          previousClass: values.previousClass,
          previousMarks: values.previousMarks,
          boardUniversity: values.boardUniversity,
        },
        facilities: {
          transport: values.transport,
          hostel: values.hostel,
        },
        documents: values.documents,
      },
    };

    console.log('Submitting student payload', jsonPayload);

    if (isEdit && existingStudent) {
      updateStudent(existingStudent.id, coreStudent);
      toast.success('Student profile updated successfully');
      navigate(`/students/${existingStudent.id}`);
    } else {
      addStudent(coreStudent);
      const allStudents = useAppStore.getState().students;
      const created = allStudents[allStudents.length - 1];
      toast.success('Student profile created successfully');
      navigate(`/students/${created.id}`);
    }
  };

  const handleReset = () => {
    form.reset();
  };

  const lastSavedLabel = lastSavedAt
    ? `Auto-saved at ${lastSavedAt.toLocaleTimeString()}`
    : 'Draft not yet saved';

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/students">Students</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{isEdit ? 'Edit Student' : 'Add New Student'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => navigate('/students')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">
                {isEdit ? 'Edit Student Profile' : 'Add New Student'}
              </h1>
              <p className="text-xs text-muted-foreground">{lastSavedLabel}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {SECTION_KEYS.map((key, index) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSection(key)}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2.5 py-1 transition-all',
                    activeSection === key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                  )}
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/10 text-[10px]">
                    {index + 1}
                  </span>
                  <span className="capitalize text-[11px]">{key}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium">{progress}% complete</span>
              <Progress value={progress} className="h-1.5 w-40" />
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Student Admission Form</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Capture all key details before confirming admission.
                  </p>
                </div>
              </div>
              <BadgeCheck className="h-5 w-5 text-primary" />
            </CardHeader>

            <CardContent>
              <Accordion
                type="single"
                collapsible
                value={activeSection}
                onValueChange={(val) => setActiveSection((val as SectionKey) || 'personal')}
                className="space-y-2"
              >
                {/* 1. Personal Details */}
                <AccordionItem value="personal" className="border-none">
                  <AccordionTrigger className="rounded-2xl bg-secondary px-4 py-3 hover:bg-secondary/80">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <IdCard className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold">1. Personal Details</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fullName"
                        rules={{ required: 'Full name is required' }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Full Name <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Student full name"
                                className="glass"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="aadhaarNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Aadhaar Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                inputMode="numeric"
                                maxLength={12}
                                className="glass"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        rules={{ required: 'Date of birth is required' }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Date of Birth <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} type="date" className="glass" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <FormControl>
                              <RadioGroup
                                className="flex flex-wrap gap-4"
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                {['Male', 'Female', 'Other'].map((g) => (
                                  <label
                                    key={g}
                                    className="flex cursor-pointer items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs"
                                  >
                                    <RadioGroupItem value={g as any} />
                                    <span>{g}</span>
                                  </label>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bloodGroup"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Blood Group</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., B+" className="glass" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nationality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nationality</FormLabel>
                            <FormControl>
                              <Input {...field} className="glass" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="religion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Religion</FormLabel>
                            <FormControl>
                              <Select value={field.value || ''} onValueChange={field.onChange}>
                                <SelectTrigger className="glass">
                                  <SelectValue placeholder="Select religion" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Hindu">Hindu</SelectItem>
                                  <SelectItem value="Muslim">Muslim</SelectItem>
                                  <SelectItem value="Christian">Christian</SelectItem>
                                  <SelectItem value="Sikh">Sikh</SelectItem>
                                  <SelectItem value="Buddhist">Buddhist</SelectItem>
                                  <SelectItem value="Jain">Jain</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="e.g., General / OBC / SC / ST / EWS"
                                className="glass" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subCaste"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sub-caste</FormLabel>
                            <FormControl>
                              <Input {...field} className="glass" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="disability"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2 flex items-center justify-between rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3">
                            <div>
                              <FormLabel>Disability (if any)</FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Enable if the student needs special assistance.
                              </p>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>


                {/* 2. Academic / Admission Information */}
                <AccordionItem value="academic" className="border-none">
                  <AccordionTrigger className="rounded-2xl bg-secondary px-4 py-3 hover:bg-secondary/80">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <School className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold">2. Academic / Admission Information</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="courseClass"
                        rules={{ required: 'Course / Class is required' }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Course / Class <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  const generated = generateAdmissionNumber(val);
                                  form.setValue('admissionNumber', generated, {
                                    shouldDirty: true,
                                  });
                                }}
                              >
                                <SelectTrigger className="glass">
                                  <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1</SelectItem>
                                  <SelectItem value="VI">VI</SelectItem>
                                  <SelectItem value="VII">VII</SelectItem>
                                  <SelectItem value="VIII">VIII</SelectItem>
                                  <SelectItem value="IX">IX</SelectItem>
                                  <SelectItem value="X">X</SelectItem>
                                  <SelectItem value="I PUC Science">I PUC Science</SelectItem>
                                  <SelectItem value="II PUC Science">II PUC Science</SelectItem>
                                  <SelectItem value="I PUC Commerce">I PUC Commerce</SelectItem>
                                  <SelectItem value="II PUC Commerce">II PUC Commerce</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="admissionNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Admission Number <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} readOnly className="glass bg-muted/60" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="admissionYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admission Year</FormLabel>
                            <FormControl>
                              <Input {...field} className="glass" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch('courseClass') && form.watch('courseClass') !== '1' && (
                        <div className="md:col-span-2 space-y-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
                          <h4 className="text-sm font-semibold text-primary">Previous Academic Details</h4>
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="previousInstitute"
                              rules={{ required: 'Previous School / College is required' }}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Previous School / College <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input {...field} className="glass" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="previousClass"
                              rules={{ required: 'Previous Class is required' }}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Previous Class <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input {...field} className="glass" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="previousMarks"
                              rules={{ required: 'Percentage or Marks is required' }}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Percentage or Marks <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input {...field} className="glass" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="boardUniversity"
                              rules={{ required: 'Board / University is required' }}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Board / University <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input {...field} className="glass" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 3. Contact & Address */}
                <AccordionItem value="contact" className="border-none">
                  <AccordionTrigger className="rounded-2xl bg-secondary px-4 py-3 hover:bg-secondary/80">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Home className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold">3. Address Information</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-6">
                      {/* Permanent Address Section */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-primary">Permanent Address</h4>
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="permanentAddress"
                            rules={{ required: 'Permanent address is required' }}
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>
                                  Address Line <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Textarea {...field} rows={3} className="glass" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="permanentState"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State</FormLabel>
                                <FormControl>
                                  <Input {...field} className="glass" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="permanentDistrict"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>District</FormLabel>
                                <FormControl>
                                  <Input {...field} className="glass" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="permanentCity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City / Town / Village</FormLabel>
                                <FormControl>
                                  <Input {...field} className="glass" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="permanentPinCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>PIN Code</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    inputMode="numeric"
                                    maxLength={6}
                                    className="glass"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Toggle */}
                      <FormField
                        control={form.control}
                        name="sameAsPermanent"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
                            <div>
                              <FormLabel>Current address same as permanent</FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Turn off if the student is staying in a hostel or rented house.
                              </p>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Current Address Section */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-primary">Current Address</h4>
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="currentAddress"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Address Line</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    rows={3}
                                    className="glass"
                                    disabled={watchSameAddress}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="currentState"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State</FormLabel>
                                <FormControl>
                                  <Input {...field} className="glass" disabled={watchSameAddress} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="currentDistrict"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>District</FormLabel>
                                <FormControl>
                                  <Input {...field} className="glass" disabled={watchSameAddress} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="currentCity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City / Town / Village</FormLabel>
                                <FormControl>
                                  <Input {...field} className="glass" disabled={watchSameAddress} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="currentPinCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>PIN Code</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    inputMode="numeric"
                                    maxLength={6}
                                    className="glass"
                                    disabled={watchSameAddress}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

            {/* 3. Parent / Guardian */}
<AccordionItem value="parents" className="border-none">
  <AccordionTrigger className="rounded-2xl bg-secondary px-4 py-3 hover:bg-secondary/80">
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Users className="h-4 w-4" />
      </div>
      <span className="text-sm font-semibold">
        4. Parent / Guardian Information
      </span>
    </div>
  </AccordionTrigger>

  <AccordionContent className="pt-4">
    <div className="space-y-6">
      {relations.fields.map((item, index) => (
        <div key={item.id} className="space-y-4 rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-primary">
              Relation {index + 1}
            </h4>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {/* Relation Dropdown */}
            <FormField
              control={form.control}
              name={`relations.${index}.relation`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relation</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="glass h-10 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="">Select</option>
                      <option value="father">Father</option>
                      <option value="mother">Mother</option>
                      <option value="guardian">Guardian</option>
                      <option value="other">Other</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Other Relation Name */}
            {form.watch(`relations.${index}.relation`) === "other" && (
              <FormField
                control={form.control}
                name={`relations.${index}.otherRelation`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify Relation</FormLabel>
                    <FormControl>
                      <Input {...field} className="glass" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Name */}
            <FormField
              control={form.control}
              name={`relations.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} className="glass" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Occupation */}
            <FormField
              control={form.control}
              name={`relations.${index}.occupation`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupation</FormLabel>
                  <FormControl>
                    <Input {...field} className="glass" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact */}
            <FormField
              control={form.control}
              name={`relations.${index}.contact`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" className="glass" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ))}

      {/* Add Relation Button */}
      <Button
        type="button"
        variant="outline"
        className="flex items-center gap-2"
        onClick={() =>
          relations.append({
            relation: "",
            otherRelation: "",
            name: "",
            occupation: "",
            contact: "",
          })
        }
      >
        + Add Relation
      </Button>
    </div>
  </AccordionContent>
</AccordionItem>

                {/* 5. Facilities */}
                <AccordionItem value="facilities" className="border-none">
                  <AccordionTrigger className="rounded-2xl bg-secondary px-4 py-3 hover:bg-secondary/80">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Bus className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold">5. Transport & Hostel</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="transport.enabled"
                      render={({ field }) => (
                        <FormItem className="rounded-2xl bg-secondary px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <FormLabel>Transport Facility</FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Enable if the student uses school/college bus.
                              </p>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />

                    {watchTransport && (
                      <div className="grid gap-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="transport.details.transportRoute"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Transport Route</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g., Route 3 – Vijayanagar"
                                  className="glass"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="transport.details.busNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bus Number</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g., KA-02-1234"
                                  className="glass"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="hostel.enabled"
                      render={({ field }) => (
                        <FormItem className="rounded-2xl bg-secondary px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <FormLabel>Hostel Facility</FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Enable if the student is a hostel resident.
                              </p>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />

                    {watchHostel && (
                      <div className="grid gap-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="hostel.details.hostelRoomType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hostel Room Type</FormLabel>
                              <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger className="glass">
                                    <SelectValue placeholder="Select room type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="2-sharing">2-sharing</SelectItem>
                                    <SelectItem value="3-sharing">3-sharing</SelectItem>
                                    <SelectItem value="dormitory">Dormitory</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="hostel.details.messPreference"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mess Preference</FormLabel>
                              <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger className="glass">
                                    <SelectValue placeholder="Select mess type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="veg">Veg</SelectItem>
                                    <SelectItem value="non-veg">Non-Veg</SelectItem>
                                    <SelectItem value="special">
                                      Special (as per doctor)
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* 6. Documents - COMMENTED OUT FOR FUTURE USE */}
                {/*
                <AccordionItem value="documents" className="border-none">
                  <AccordionTrigger className="rounded-2xl bg-secondary px-4 py-3 hover:bg-secondary/80">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileUp className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold">6. Documents Upload</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {(
                        [
                          ['studentPhoto', 'Student Photo'],
                          ['aadhaarCard', 'Aadhaar Card'],
                          ['transferCertificate', 'Transfer Certificate'],
                          ['previousMarksheet', 'Previous Marksheet / Report Card'],
                          ['birthCertificate', 'Birth Certificate'],
                          ['migrationCertificate', 'Migration Certificate'],
                          ['casteCertificate', 'Caste Certificate'],
                        ] as [keyof StudentFormValues['documents'], string][]
                      ).map(([key, label]) => {
                        const docs = form.getValues('documents');
                        const file = docs?.[key];
                        return (
                          <div
                            key={key}
                            className="rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/40 p-3"
                          >
                            <p className="mb-2 text-xs font-medium">{label}</p>
                            {!file ? (
                              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 bg-background/60 px-4 py-6 text-center text-xs text-muted-foreground hover:border-primary/50 hover:bg-background">
                                <FileUp className="h-4 w-4 text-primary" />
                                <span>
                                  Drag & drop or{' '}
                                  <span className="font-semibold">click to upload</span>
                                </span>
                                <Input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => handleFileChange(e, key)}
                                />
                              </label>
                            ) : (
                              <div className="flex items-center justify-between gap-2 rounded-xl bg-background px-3 py-2 text-xs">
                                <div className="flex flex-col">
                                  <span className="font-medium">{file.fileName}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {file.fileType}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 text-[10px]"
                                    onClick={() => handleRemoveFile(key)}
                                  >
                                    ✕
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                */}
              </Accordion>
            </CardContent>
          </Card>

          <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-secondary px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Progress value={progress} className="h-1.5 w-32" />
              <span>{progress}% completed</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  const values = form.getValues();
                  console.debug('Saving draft student form', values);
                  toast.success('Draft saved locally');
                  setLastSavedAt(new Date());
                }}
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={handleReset}
              >
                Reset
              </Button>
              <Button type="submit" className="rounded-full glow">
                Submit Student Profile
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default StudentForm;
