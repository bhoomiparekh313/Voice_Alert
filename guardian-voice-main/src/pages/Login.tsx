import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useLocalStorage';
import { Shield, Mic, MapPin, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginSchema } from '@/lib/validation';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse({
      email,
      password,
      name: isRegister ? name : undefined,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    login(result.data.email, result.data.password, result.data.name);
    navigate('/dashboard');
  };

  const features = [
    { icon: Mic, label: 'Voice-Activated Detection', desc: 'Hands-free emergency alerts' },
    { icon: MapPin, label: 'Real-Time Location', desc: 'GPS & IP-based tracking' },
    { icon: Bell, label: 'Multi-Channel Alerts', desc: 'SMS, Call, WhatsApp, Email' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-sidebar relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emergency blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-info blur-[80px]" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-emergency flex items-center justify-center shadow-emergency">
              <Shield className="w-7 h-7 text-emergency-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">VANI</h1>
              <p className="text-xs font-mono tracking-widest text-muted-foreground uppercase">Voice Alert & Navigation Interface</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <h2 className="text-4xl font-bold leading-tight text-foreground">
            Your Voice is Your<br />
            <span className="text-gradient-emergency">Shield.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-md">
            AI-powered emergency detection that listens, detects distress, and sends alerts — even when you can't reach your phone.
          </p>
          <div className="space-y-4">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border/50">
                <div className="w-10 h-10 rounded-lg bg-emergency/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-emergency" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-muted-foreground">
          © 2025 VANI — Designed for your safety
        </p>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-emergency flex items-center justify-center">
              <Shield className="w-6 h-6 text-emergency-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">VANI</h1>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isRegister ? 'Set up your emergency profile' : 'Sign in to your safety dashboard'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div className="space-y-2 animate-slide-up">
                <Label htmlFor="name" className="text-foreground">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-emergency"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-emergency"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-emergency"
              />
            </div>

            {error && (
              <p className="text-sm text-emergency animate-fade-in">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-emergency text-emergency-foreground font-semibold text-base shadow-emergency hover:opacity-90 transition-opacity"
            >
              {isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-emergency font-medium hover:underline"
            >
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
