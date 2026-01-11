import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Plus, Search, Edit, Trash2, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const Faculty = () => {
  const { faculty, addFaculty, updateFaculty, deleteFaculty } = useAppStore();

  // TODO: Replace with API fetch
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any>(null);

  const [sameAsPermanent, setSameAsPermanent] = useState(true);

  const [formData, setFormData] = useState({
    employeeType: '',
    name: '',
    department: '',
    experience: '',
    phone: '',
    aadhaar: '',
    qualifications: [
      { level: '', degreeName: '', otherDegree: '', year: '', board: '' },
    ],
    permanentAddress: '',
    permanentState: '',
    permanentDistrict: '',
    permanentCity: '',
    permanentPinCode: '',
    currentAddress: '',
    currentState: '',
    currentDistrict: '',
    currentCity: '',
    currentPinCode: '',
  });

  const handleQualificationChange = (index: number, key: string, value: string) => {
    const updated = [...formData.qualifications];
    updated[index] = { ...updated[index], [key]: value };
    setFormData({ ...formData, qualifications: updated });
  };

  const addQualification = () => {
    setFormData({
      ...formData,
      qualifications: [
        ...formData.qualifications,
        { level: '', degreeName: '', otherDegree: '', year: '', board: '' },
      ],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.employeeType || !formData.phone || !formData.aadhaar) {
      toast.error('Please fill all required fields');
      return;
    }

    const payload = {
      ...formData,
      currentAddress: sameAsPermanent ? formData.permanentAddress : formData.currentAddress,
      currentState: sameAsPermanent ? formData.permanentState : formData.currentState,
      currentDistrict: sameAsPermanent
        ? formData.permanentDistrict
        : formData.currentDistrict,
      currentCity: sameAsPermanent ? formData.permanentCity : formData.currentCity,
      currentPinCode: sameAsPermanent
        ? formData.permanentPinCode
        : formData.currentPinCode,
    };

    // TODO: Submit payload to API
    editingFaculty
      ? updateFaculty(editingFaculty.id, payload)
      : addFaculty(payload);

    toast.success(editingFaculty ? 'Faculty updated' : 'Faculty added');
    handleClose();
  };

  const handleClose = () => {
    setIsAddOpen(false);
    setEditingFaculty(null);
  };

  const filteredFaculty = faculty.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Faculty</h1>
          <p className="text-muted-foreground">Manage teaching & non-teaching staff</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="glow">
              <Plus className="h-4 w-4 mr-2" />
              Add Faculty
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFaculty ? 'Edit Faculty' : 'Add Faculty'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* BASIC DETAILS */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Employee Type *</Label>
                  <select
                    className="glass h-10 w-full rounded-md border px-3 text-sm"
                    value={formData.employeeType}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeType: e.target.value })
                    }
                  >
                    <option value="">Select</option>
                    <option value="Teaching">Teaching</option>
                    <option value="Non-Teaching">Non Teaching</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Experience</Label>
                  <Input
                    placeholder="e.g. 6 Years"
                    value={formData.experience}
                    onChange={(e) =>
                      setFormData({ ...formData, experience: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Aadhaar Number *</Label>
                  <Input
                    value={formData.aadhaar}
                    onChange={(e) =>
                      setFormData({ ...formData, aadhaar: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* QUALIFICATIONS */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-primary">Qualifications</h4>

                {formData.qualifications.map((q, index) => (
                  <div key={index} className="grid gap-4 md:grid-cols-5">
                    <select
                      className="glass h-10 rounded-md border px-3 text-sm"
                      value={q.level}
                      onChange={(e) =>
                        handleQualificationChange(index, 'level', e.target.value)
                      }
                    >
                      <option value="">Level</option>
                      <option value="SSLC">SSLC</option>
                      <option value="PUC">PUC</option>
                      <option value="UG">UG</option>
                      <option value="PG">PG</option>
                      <option value="Other">Other</option>
                    </select>

                    {(q.level === 'UG' || q.level === 'PG') && (
                      <Input
                        placeholder="Degree Name"
                        value={q.degreeName}
                        onChange={(e) =>
                          handleQualificationChange(index, 'degreeName', e.target.value)
                        }
                        className="glass"
                      />
                    )}

                    {q.level === 'Other' && (
                      <Input
                        placeholder="Specify Degree"
                        value={q.otherDegree}
                        onChange={(e) =>
                          handleQualificationChange(index, 'otherDegree', e.target.value)
                        }
                        className="glass"
                      />
                    )}

                    <Input
                      placeholder="Year"
                      value={q.year}
                      onChange={(e) =>
                        handleQualificationChange(index, 'year', e.target.value)
                      }
                      className="glass"
                    />

                    <Input
                      placeholder="Board / University"
                      value={q.board}
                      onChange={(e) =>
                        handleQualificationChange(index, 'board', e.target.value)
                      }
                      className="glass"
                    />
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addQualification}>
                  + Add Qualification
                </Button>
              </div>

              {/* ADDRESS ACCORDION */}
              <Accordion type="single" collapsible>
                <AccordionItem value="contact" className="border-none">
                  <AccordionTrigger className="rounded-2xl bg-secondary px-4 py-3 hover:bg-secondary/80">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Home className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold">Address Information</span>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pt-4">
                    <div className="space-y-4">
                      <Input
                        placeholder="Permanent Address"
                        className="glass"
                        value={formData.permanentAddress}
                        onChange={(e) =>
                          setFormData({ ...formData, permanentAddress: e.target.value })
                        }
                      />

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={sameAsPermanent}
                          onChange={() => setSameAsPermanent(!sameAsPermanent)}
                        />
                        Current address same as permanent
                      </label>

                      {!sameAsPermanent && (
                        <Input
                          placeholder="Current Address"
                          className="glass"
                          value={formData.currentAddress}
                          onChange={(e) =>
                            setFormData({ ...formData, currentAddress: e.target.value })
                          }
                        />
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingFaculty ? 'Update' : 'Add'} Faculty
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* TABLE */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="glass-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Qualifications</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredFaculty.map((fac) => (
                  <TableRow key={fac.id}>
                    <TableCell>{fac.name}</TableCell>
                    <TableCell>{fac.employeeType}</TableCell>
                    <TableCell>{fac.department}</TableCell>
                    <TableCell>
                      {Array.isArray(fac.qualification) && fac.qualification.map((q: any, i: number) => (
                        <div key={i} className="text-xs">
                          {q.level} {q.degreeName || q.otherDegree} ({q.year})
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>{fac.experience}</TableCell>
                    <TableCell>{fac.phone}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingFaculty(fac);
                          setFormData({
                            employeeType: fac.employeeType || '',
                            name: fac.name || '',
                            department: fac.department || '',
                            experience: fac.experience || '',
                            phone: fac.phone || '',
                            aadhaar: fac.aadhaar || '',
                            qualifications: Array.isArray(fac.qualification) ? fac.qualification : [{ level: '', degreeName: '', otherDegree: '', year: '', board: '' }],
                            permanentAddress: fac.permanentAddress || '',
                            permanentState: fac.permanentState || '',
                            permanentDistrict: fac.permanentDistrict || '',
                            permanentCity: fac.permanentCity || '',
                            permanentPinCode: fac.permanentPinCode || '',
                            currentAddress: fac.currentAddress || '',
                            currentState: fac.currentState || '',
                            currentDistrict: fac.currentDistrict || '',
                            currentCity: fac.currentCity || '',
                            currentPinCode: fac.currentPinCode || '',
                          });
                          setIsAddOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteFaculty(fac.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Faculty;
