import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const Courses = () => {
  const [courses] = useState([
    { id: 1, name: 'Mathematics', class: '10-A', teacher: 'Dr. Suresh Kumar' },
    { id: 2, name: 'Science', class: '9-B', teacher: 'Priya Menon' },
    { id: 3, name: 'English', class: '10-A', teacher: 'Sarah Johnson' },
    { id: 4, name: 'Social Studies', class: '9-A', teacher: 'Ramesh Kumar' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Courses</h1>
          <p className="text-muted-foreground">Manage courses and class subjects</p>
        </div>
        <Button className="glow">
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-card hover:glow transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">Class {course.class}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Teacher</p>
                    <p className="font-medium">{course.teacher}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Courses;
