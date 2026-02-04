import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Wifi, Loader2 } from 'lucide-react';
import { useLogin } from "@/hooks/useAuth";
export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();



  const { mutate, isPending, isError, error } = useLogin();
  

 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   

    try {
mutate(
  {
    username: username,
    password: password,
  },
  {
    onSuccess: (data) => {

      navigate("/dashboard");
   
    },
    onError: (error) => {
      console.error(error);
    },
  },
);
      } catch {
      toast({
        title: 'Login failed',
        description: 'Invalid credentials. Try admin/password or manager/password',
        variant: 'destructive',
      });
    } 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Wifi className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">ISP Manager</h1>
          <p className="text-muted-foreground">
            Wireless Service Provider Management
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Demo Credentials:</p>
              <p className="text-xs text-muted-foreground">
                Admin: admin / admin123
              </p>
              <p className="text-xs text-muted-foreground">
                Manager: manager / password
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
