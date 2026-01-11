import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
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
import { Plus, Edit, Trash2, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const Faculty = () => {
  const { faculty, addFaculty, updateFaculty, deleteFaculty } = useAppStore();

  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any>(null);

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
    addressDetails: {
      permanentAddress: {
        addressLine: '',
        state: '',
        district: '',
        city: '',
        pinCode: '',
      },
      currentAddressSameAsPermanent: true,
      currentAddress: {
        addressLine: '',
        state: '',
        district: '',
        city: '',
        pinCode: '',
      },
    },
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
      addressDetails: {
        ...formData.addressDetails,
        currentAddress: formData.addressDetails.currentAddressSameAsPermanent
          ? { ...formData.addressDetails.permanentAddress }
          : { ...formData.addressDetails.currentAddress },
      },
    };

    // TODO: Replace with API call
    editingFaculty
      ? updateFaculty(editingFaculty.id, payload)
      : addFaculty(payload);

    toast.success(editingFaculty ? 'Faculty updated' : 'Faculty added');
    handleClose();
  };

  const handleClose = () => {
    setIsAddOpen(false);
    setEditingFaculty(null);
    setFormData({
      employeeType: '',
      name: '',
      department: '',
      experience: '',
      phone: '',
      aadhaar: '',
      qualifications: [{ level: '', degreeName: '', otherDegree: '', year: '', board: '' }],
      addressDetails: {
        permanentAddress: { addressLine: '', state: '', district: '', city: '', pinCode: '' },
        currentAddressSameAsPermanent: true,
        currentAddress: { addressLine: '', state: '', district: '', city: '', pinCode: '' },
      },
    });
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
              <DialogTitle>{editingFaculty ? 'Edit Faculty' : 'Add Faculty'}</DialogTitle>
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
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Aadhaar Number *</Label>
                  <Input
                    value={formData.aadhaar}
                    onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
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

                  <AccordionContent className="pt-4 space-y-4">
                    {/* Permanent Address */}
                    <h4 className="text-sm font-semibold">Permanent Address</h4>
                    <Input
                      placeholder="Address Line"
                      className="glass"
                      value={formData.addressDetails.permanentAddress.addressLine}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addressDetails: {
                            ...formData.addressDetails,
                            permanentAddress: {
                              ...formData.addressDetails.permanentAddress,
                              addressLine: e.target.value,
                            },
                          },
                        })
                      }
                    />
                    <Input
                      placeholder="State"
                      className="glass"
                      value={formData.addressDetails.permanentAddress.state}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addressDetails: {
                            ...formData.addressDetails,
                            permanentAddress: {
                              ...formData.addressDetails.permanentAddress,
                              state: e.target.value,
                            },
                          },
                        })
                      }
                    />
                    <Input
                      placeholder="District"
                      className="glass"
                      value={formData.addressDetails.permanentAddress.district}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addressDetails: {
                            ...formData.addressDetails,
                            permanentAddress: {
                              ...formData.addressDetails.permanentAddress,
                              district: e.target.value,
                            },
                          },
                        })
                      }
                    />
                    <Input
                      placeholder="City"
                      className="glass"
                      value={formData.addressDetails.permanentAddress.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addressDetails: {
                            ...formData.addressDetails,
                            permanentAddress: {
                              ...formData.addressDetails.permanentAddress,
                              city: e.target.value,
                            },
                          },
                        })
                      }
                    />
                    <Input
                      placeholder="PIN Code"
                      className="glass"
                      value={formData.addressDetails.permanentAddress.pinCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addressDetails: {
                            ...formData.addressDetails,
                            permanentAddress: {
                              ...formData.addressDetails.permanentAddress,
                              pinCode: e.target.value,
                            },
                          },
                        })
                      }
                    />

                    {/* Current Address Same as Permanent */}
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.addressDetails.currentAddressSameAsPermanent}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            addressDetails: {
                              ...formData.addressDetails,
                              currentAddressSameAsPermanent:
                                !formData.addressDetails.currentAddressSameAsPermanent,
                            },
                          })
                        }
                      />
                      Current address same as permanent
                    </label>

                    {!formData.addressDetails.currentAddressSameAsPermanent && (
                      <>
                        <h4 className="text-sm font-semibold">Current Address</h4>
                        <Input
                          placeholder="Address Line"
                          className="glass"
                          value={formData.addressDetails.currentAddress.addressLine}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              addressDetails: {
                                ...formData.addressDetails,
                                currentAddress: {
                                  ...formData.addressDetails.currentAddress,
                                  addressLine: e.target.value,
                                },
                              },
                            })
                          }
                        />
                        <Input
                          placeholder="State"
                          className="glass"
                          value={formData.addressDetails.currentAddress.state}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              addressDetails: {
                                ...formData.addressDetails,
                                currentAddress: {
                                  ...formData.addressDetails.currentAddress,
                                  state: e.target.value,
                                },
                              },
                            })
                          }
                        />
                        <Input
                          placeholder="District"
                          className="glass"
                          value={formData.addressDetails.currentAddress.district}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              addressDetails: {
                                ...formData.addressDetails,
                                currentAddress: {
                                  ...formData.addressDetails.currentAddress,
                                  district: e.target.value,
                                },
                              },
                            })
                          }
                        />
                        <Input
                          placeholder="City"
                          className="glass"
                          value={formData.addressDetails.currentAddress.city}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              addressDetails: {
                                ...formData.addressDetails,
                                currentAddress: {
                                  ...formData.addressDetails.currentAddress,
                                  city: e.target.value,
                                },
                              },
                            })
                          }
                        />
                        <Input
                          placeholder="PIN Code"
                          className="glass"
                          value={formData.addressDetails.currentAddress.pinCode}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              addressDetails: {
                                ...formData.addressDetails,
                                currentAddress: {
                                  ...formData.addressDetails.currentAddress,
                                  pinCode: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit">{editingFaculty ? 'Update' : 'Add'} Faculty</Button>
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
                      {Array.isArray(fac.qualification) &&
                        fac.qualification.map((q: any, i: number) => (
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
                            qualifications: Array.isArray(fac.qualification)
                              ? fac.qualification
                              : [{ level: '', degreeName: '', otherDegree: '', year: '', board: '' }],
                            addressDetails: fac.addressDetails || {
                              permanentAddress: { addressLine: '', state: '', district: '', city: '', pinCode: '' },
                              currentAddressSameAsPermanent: true,
                              currentAddress: { addressLine: '', state: '', district: '', city: '', pinCode: '' },
                            },
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
