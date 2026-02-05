import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, Loader2, Sun, Moon, Languages } from 'lucide-react';
import { z } from 'zod';
import logo from '@/assets/logo.png';
import AIAssistant from '@/components/AIAssistant';

// Google icon component
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithGoogle, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  // Prevent hammering signup when Supabase email sending rate limit kicks in
  const [signupCooldownUntil, setSignupCooldownUntil] = useState<number | null>(null);
  const [signupCooldownSeconds, setSignupCooldownSeconds] = useState(0);

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Update signup cooldown countdown
  useEffect(() => {
    if (!signupCooldownUntil) {
      setSignupCooldownSeconds(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((signupCooldownUntil - Date.now()) / 1000));
      setSignupCooldownSeconds(remaining);
      if (remaining <= 0) setSignupCooldownUntil(null);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [signupCooldownUntil]);

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const result = loginSchema.safeParse(loginForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginForm.email, loginForm.password);
    setIsLoading(false);

    if (error) {
      // Handle specific error messages
      let message = 'Login failed. Please try again.';
      if (error.message.includes('Invalid login credentials')) {
        message = 'Invalid email or password.';
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Please verify your email before logging in.';
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/');
    }
  };

  // Handle signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (signupCooldownUntil && Date.now() < signupCooldownUntil) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please wait a moment before trying to sign up again.',
      });
      return;
    }

    // Validate
    const result = signupSchema.safeParse(signupForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupForm.email, signupForm.password, signupForm.fullName);
    setIsLoading(false);

    if (error) {
      const errAny = error as any;
      let message = 'Sign up failed. Please try again.';
      if (error.message.includes('already registered')) {
        message = 'This email is already registered. Please login instead.';
      } else if (
        errAny?.code === 'over_email_send_rate_limit' ||
        errAny?.status === 429 ||
        /email rate limit exceeded/i.test(error.message)
      ) {
        message = 'Too many signup attempts. Please wait 1-2 minutes and try again.';

        // Cooldown UI to avoid repeated failing attempts
        setSignupCooldownUntil(Date.now() + 90_000);
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    } else {
      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
      });
      setActiveTab('login');
    }
  };

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    
    if (error) {
      setIsGoogleLoading(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sign in with Google. Please try again.',
      });
    }
    // Don't setIsGoogleLoading(false) on success - redirect will happen
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { resolvedTheme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4 relative">
      {/* Theme & Language Toggle Buttons */}
      <div className="absolute top-4 end-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLanguage}
          className="rounded-full"
          title={language === 'en' ? 'العربية' : 'English'}
        >
          <Languages className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full"
          title={resolvedTheme === 'dark' ? t('common.lightMode', 'Light Mode') : t('common.darkMode', 'Dark Mode')}
        >
          {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/">
            <img src={logo} alt="Quality Light" className="h-16 w-auto" />
          </Link>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">
              {t('common.welcome', 'Welcome')}
            </CardTitle>
            <CardDescription>
              {t('auth.login.subtitle', 'Sign in to your account or create a new one')}
            </CardDescription>
          </CardHeader>

          {/* Google Sign In Button */}
          <div className="px-6 pb-4">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-3 h-11"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {t('auth.google.continue', 'Continue with Google')}
            </Button>

            <div className="relative my-4">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                {t('common.or', 'or')}
              </span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mx-6" style={{ width: 'calc(100% - 3rem)' }}>
              <TabsTrigger value="login">{t('nav.login', 'Login')}</TabsTrigger>
              <TabsTrigger value="signup">{t('nav.register', 'Sign Up')}</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t('auth.login.email', 'Email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="email@example.com"
                        className="pl-10"
                        value={loginForm.email}
                        onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t('auth.login.password', 'Password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={loginForm.password}
                        onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>
                </CardContent>

                <CardFooter className="flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.loading', 'Logging in...')}
                      </>
                    ) : (
                      t('auth.login.submit', 'Sign In')
                    )}
                  </Button>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t('auth.login.forgotPassword', 'Forgot your password?')}
                  </Link>
                </CardFooter>
              </form>
            </TabsContent>

            {/* Signup Form */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{t('auth.register.fullName', 'Full Name')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10"
                        value={signupForm.fullName}
                        onChange={e => setSignupForm({ ...signupForm, fullName: e.target.value })}
                      />
                    </div>
                    {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t('auth.register.email', 'Email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="email@example.com"
                        className="pl-10"
                        value={signupForm.email}
                        onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t('auth.register.password', 'Password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={signupForm.password}
                        onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">{t('auth.register.confirmPassword', 'Confirm Password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10"
                        value={signupForm.confirmPassword}
                        onChange={e => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>
                </CardContent>

                <CardFooter className="flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={isLoading || signupCooldownSeconds > 0}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.loading', 'Creating account...')}
                      </>
                    ) : signupCooldownSeconds > 0 ? (
                      `Please wait ${signupCooldownSeconds}s`
                    ) : (
                      t('auth.register.submit', 'Create Account')
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    {t('auth.register.terms', 'By signing up, you agree to our Terms of Service and Privacy Policy.')}
                  </p>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Back to home */}
        <div className="mt-6 flex justify-center">
          <Button asChild variant="outline" size="sm">
            <Link to="/">{t('common.back', 'Back to home')}</Link>
          </Button>
        </div>
      </div>
      
      {/* AI Assistant - available for all visitors */}
      <AIAssistant />
    </div>
  );
}
