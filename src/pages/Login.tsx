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

const API_BASE_URL = 'https://my-school-services-api.onrender.com/api/auth/signin';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminLogin = location.pathname === '/admin-login';

  // Debug: Log route detection
  useEffect(() => {
    console.log('🔍 Login page - Current path:', location.pathname);
    console.log('🔍 Is Admin Login:', isAdminLogin);
    console.log('🔍 API URL will be:', isAdminLogin ? API_BASE_URL : 'Local login');
  }, [location.pathname, isAdminLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug: Log everything
    console.log('🚀 Form submitted!');
    console.log('🚀 Current path:', location.pathname);
    console.log('🚀 isAdminLogin:', isAdminLogin);
    console.log('🚀 Username:', username);
    console.log('🚀 Password length:', password.length);
    
    setIsLoading(true);

    try {
      // Always use API endpoint
      console.log('✅ API Login - Making API call to:', API_BASE_URL);
      console.log('🔐 Request body:', { 
        username: username.trim(), 
        password: password 
      });
      
      try {
          const requestBody = {
            username: username.trim(),
            password: password,
          };
          
          console.log('📡 Fetch call starting...', {
            url: API_BASE_URL,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });
          
          const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });
          
          console.log('✅ Fetch completed! Status:', response.status);

          console.log('📡 Response Status:', response.status, response.statusText);
          console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

          // Get response text first to handle both success and error
          const responseText = await response.text();
          console.log('📦 Raw Response:', responseText);
          console.log('📡 Response Status:', response.status);

          let data;
          try {
            data = JSON.parse(responseText);
            console.log('✅ Parsed Response:', data);
          } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError);
            console.error('Raw response:', responseText);
            toast.error('Invalid response format from server');
            setIsLoading(false);
            return;
          }

          // Check for success (200 OK with accessToken) - EXACT Postman format
          if (response.status === 200 && data.accessToken) {
            console.log('✅ Success! AccessToken received');
            
            // Store token exactly as Postman receives it
            localStorage.setItem('authToken', data.accessToken);
            localStorage.setItem('tokenType', data.tokenType || 'Bearer');
            
            // Store complete user data matching Postman response
            const userData = {
              id: data.id,
              username: data.username,
              email: data.email,
              roles: data.roles || [],
              isAuthenticated: true,
            };
            
            // Update Zustand store
            useAppStore.setState({ 
              user: {
                username: data.username,
                isAuthenticated: true,
              }
            });
            
            // Store in localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('userRoles', JSON.stringify(data.roles || []));
            
            console.log('✅ Login successful! User:', data.username);
            toast.success(`Welcome back, ${data.username}!`);
            navigate('/dashboard');
          } else {
            // Handle error response - extract error message from API
            console.error('❌ Login failed - Full response:', data);
            console.error('❌ Response status:', response.status);
            
            // Try different possible error message fields
            const errorMsg = 
              data.message || 
              data.error || 
              data.errorMessage ||
              (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
              `Invalid credentials (Status: ${response.status})`;
            
            console.error('❌ Error message:', errorMsg);
            toast.error(errorMsg);
          }
        } catch (networkError: any) {
          // Handle network/CORS errors
          console.error('❌❌❌ NETWORK ERROR CAUGHT ❌❌❌');
          console.error('Error type:', typeof networkError);
          console.error('Error name:', networkError?.name);
          console.error('Error message:', networkError?.message);
          console.error('Full error:', networkError);
          console.error('Error stack:', networkError?.stack);
          
          // Show detailed error
          const errorDetails = {
            name: networkError?.name,
            message: networkError?.message,
            stack: networkError?.stack,
          };
          console.table(errorDetails);
          
          if (networkError?.message?.includes('CORS') || networkError?.message?.includes('Failed to fetch')) {
            const errorMsg = 'CORS or Network Error: ' + networkError.message;
            console.error('🚨', errorMsg);
            toast.error(errorMsg + ' - Check Network tab and Console');
          } else {
            const errorMsg = `Network error: ${networkError?.message || 'Unknown error'}`;
            console.error('🚨', errorMsg);
            toast.error(errorMsg);
          }
        }
    } catch (error: any) {
      console.error('❌❌❌ OUTER CATCH ERROR ❌❌❌');
      console.error('Error type:', typeof error);
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Full error:', error);
      console.error('Error stack:', error?.stack);
      toast.error(`Login error: ${error?.message || 'Unknown error'} - Check console`);
    } finally {
      console.log('🏁 Finally block - setting loading to false');
      setIsLoading(false);
    }
  };
  
  // Test function to manually trigger API call
  const testAPICall = async () => {
    console.log('🧪 TEST: Manual API call triggered');
    setIsLoading(true);
    
    try {
      const testBody = {
        username: '',
        password: '',
      };
      
      console.log('🧪 TEST: Calling API with:', testBody);
      console.log('🧪 TEST: URL:', API_BASE_URL);
      
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testBody),
      });
      
      console.log('🧪 TEST: Response status:', response.status);
      const data = await response.json();
      console.log('🧪 TEST: Response data:', data);
      
      if (response.ok && data.accessToken) {
        toast.success('✅ Test API call successful!');
      } else {
        toast.error('❌ Test API call failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('🧪 TEST: Error:', error);
      toast.error('❌ Test failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      {/* Background hero image */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(120deg, rgba(9, 9, 11, 0.92), rgba(8, 47, 73, 0.78)), url(${loginBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
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
          {/* Logo & Title */}
          <div className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-primary to-accent mb-4 glow"
            >
              <GraduationCap className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gradient">School Management</h1>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 animate-glow-pulse" />
              AI-Powered Admin Panel
            </p>
            {isAdminLogin && (
              <div className="mt-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                🔐 API Login Mode - Check Network Tab
              </div>
            )}
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder={isAdminLogin ? 'test1' : 'admin'}
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="glass"
              />
            </div>

            <Button type="submit" className="w-full glow" disabled={isLoading}>
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="h-5 w-5" />
                </motion.div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          {/* Test API Button - Remove in production */}
          {isAdminLogin && (
            <Button 
              type="button" 
              variant="outline" 
              className="w-full mt-2 text-xs"
              onClick={testAPICall}
              disabled={isLoading}
            >
              🧪 Test API Call (Check Network Tab)
            </Button>
          )}

        </div>

        {/* AI greeting message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 glass-card p-4"
        >
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-semibold">AI Assistant:</span> Welcome! I'm here to help you manage your school efficiently. Sign in to get started!
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
