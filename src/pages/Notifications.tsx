import { Bell, UserPlus, GraduationCap, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

type NotificationCategory = 'students' | 'faculty' | 'fees' | 'all';

interface Notification {
  id: number;
  type: NotificationCategory;
  title: string;
  description: string;
  time: string;
  meta: string;
}

const notifications: Notification[] = [
  {
    id: 1,
    type: 'students',
    title: 'New student admitted',
    description: 'Arjun M (Class 10) has been added to the student database.',
    time: '5 minutes ago',
    meta: 'Reg No: VC2025-0341',
  },
  {
    id: 2,
    type: 'fees',
    title: 'Fee payment received',
    description: '₹45,000 received from Priya S towards 2nd semester tuition fees.',
    time: '18 minutes ago',
    meta: 'UPI • TXN ID: #TXN482019',
  },
  {
    id: 3,
    type: 'faculty',
    title: 'New faculty joined',
    description: 'Mr. Karthik Rao has joined as Assistant Professor, Computer Science.',
    time: '2 hours ago',
    meta: 'Employee ID: FAC-1093',
  },
  {
    id: 4,
    type: 'fees',
    title: 'Bulk fee collection',
    description: '₹3,20,000 collected from 12 students (II PUC Science).',
    time: 'Yesterday • 4:15 PM',
    meta: 'Section: BBA-B • Due date: 10 Dec',
  },
  {
    id: 5,
    type: 'students',
    title: 'New transfer student',
    description: 'Sneha P has transferred from another branch into I PUC Commerce.',
    time: 'Yesterday • 10:32 AM',
    meta: 'Transfer approved by Principal',
  },
];

const categoryConfig: Record<NotificationCategory, { label: string; icon: React.ElementType }> = {
  all: { label: 'All updates', icon: Bell },
  students: { label: 'Students', icon: UserPlus },
  faculty: { label: 'Faculty', icon: GraduationCap },
  fees: { label: 'Fees & Finance', icon: DollarSign },
};

const Notifications = () => {
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');

  const filtered = activeCategory === 'all'
    ? notifications
    : notifications.filter((n) => n.type === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Live updates when students join, faculty onboard, or fees are collected.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-card px-3 py-2 text-xs text-muted-foreground shadow-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bell className="h-3 w-3" />
          </span>
          <span>These are sample notifications for demo purposes.</span>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader className="flex flex-col gap-4 border-b border-[hsl(var(--border))] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-lg">Activity Centre</CardTitle>
              <p className="text-xs text-muted-foreground">
                Track admissions, staff onboarding and fee Finance in one place.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(categoryConfig) as NotificationCategory[]).map((key) => {
              const { label, icon: Icon } = categoryConfig[key];
              const isActive = activeCategory === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCategory(key)}
                  className={[
                    'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                  ].join(' ')}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                  {key !== 'all' && (
                    <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px]">
                      {notifications.filter((n) => n.type === key).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-2 pt-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <Bell className="h-8 w-8 opacity-40" />
              <p className="text-sm font-medium">You&apos;re all caught up</p>
              <p className="text-xs">No notifications in this category yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => {
                const Icon =
                  item.type === 'students' ? UserPlus : item.type === 'faculty' ? GraduationCap : DollarSign;
                const tone =
                  item.type === 'students'
                    ? 'bg-primary/10 text-primary'
                    : item.type === 'faculty'
                    ? 'bg-accent/10 text-accent'
                    : 'bg-success/10 text-success';
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-2xl bg-[hsl(var(--secondary))] px-4 py-3 hover:bg-[hsl(var(--secondary))]/90 transition-colors"
                  >
                    <div className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full ${tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <span className="text-[11px] text-muted-foreground">{item.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Badge variant="outline" className="rounded-full border-dashed text-[11px]">
                          {item.meta}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;


