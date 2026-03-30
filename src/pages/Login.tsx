import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import loginBackground from '@/assets/login.webp';

// ============================================================================
// API CONFIGURATION
// ============================================================================
const API_BASE_URL = '/api/auth/signin';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminLogin = location.pathname === '/admin-login';

  useEffect(() => {
    console.log('🔍 Login page path:', location.pathname);
  }, [location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const requestBody = {
        username: username.trim(),
        password: password,
      };

      console.log('📡 Signing in with:', requestBody);

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('📦 Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        toast.error('Invalid server response');
        return;
      }

      if (response.ok && data.accessToken) {
        // ============================
        // STORE TOKEN
        // ============================
        localStorage.setItem('authToken', data.accessToken);
        localStorage.setItem('tokenType', data.tokenType || 'Bearer');

        // ============================
        // STORE USER
        // ============================
        const userData = {
          id: data.id,
          username: data.username,
          email: data.email,
          schoolName:
            data.schoolName ||
            data.school_name ||
            data.school?.name ||
            data.school?.schoolName ||
            null,
          schoolId:
            data.schoolId ||
            data.school_id ||
            data.school?.id ||
            data.user?.schoolId ||
            data.user?.school_id ||
            null,
          roles: data.roles || [],
          isAuthenticated: true,
        };

        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userName', data.username || '');
        localStorage.setItem('userRoles', JSON.stringify(data.roles || []));

        // ============================
        // STORE SCHOOL ID FOR SESSION WIDE USAGE
        // ============================
        const schoolId =
          data.schoolId ||
          data.school_id ||
          data.school?.id ||
          data.user?.schoolId ||
          data.user?.school_id;

        if (schoolId) {
          localStorage.setItem('schoolId', String(schoolId));
        }

        const schoolName =
          data.schoolName ||
          data.school_name ||
          data.school?.name ||
          data.school?.schoolName;

        if (schoolName) {
          localStorage.setItem('schoolName', String(schoolName));
        }

        // ============================
        // UPDATE STORE
        // ============================
        useAppStore.setState({
          user: {
            username: data.username,
            isAuthenticated: true,
          },
        });

        toast.success(`Welcome back, ${data.username}!`);
        navigate('/dashboard');
      } else {
        const errorMsg =
          data.message ||
          data.error ||
          'Invalid username or password';

        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      toast.error('Network or server error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(120deg, rgba(9, 9, 11, 0.92), rgba(8, 47, 73, 0.78)), url(${loginBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-primary to-accent mb-4 glow">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gradient">School Management</h1>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 animate-glow-pulse" />
              AI-Powered Admin Panel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="glass"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="glass"
              />
            </div>

            <Button type="submit" className="w-full glow" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
