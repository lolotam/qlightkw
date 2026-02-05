import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  User,
  Lock,
  Globe,
  Moon,
  Sun,
  Monitor,
  Loader2,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Profile {
  full_name: string | null;
  full_name_ar: string | null;
  phone: string | null;
  email: string | null;
  preferred_language: string | null;
  preferred_theme: string | null;
}

export default function AccountSettings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    full_name_ar: '',
    phone: '',
    email: '',
    preferred_language: 'en',
    preferred_theme: 'system',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, full_name_ar, phone, email, preferred_language, preferred_theme')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          full_name: data.full_name || user.user_metadata?.full_name || '',
          full_name_ar: data.full_name_ar || '',
          phone: data.phone || '',
          email: data.email || user.email || '',
          preferred_language: data.preferred_language || 'en',
          preferred_theme: data.preferred_theme || 'system',
        });
      } else {
        setProfile({
          full_name: user.user_metadata?.full_name || '',
          full_name_ar: '',
          phone: '',
          email: user.email || '',
          preferred_language: 'en',
          preferred_theme: 'system',
        });
      }

      setIsLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        full_name_ar: profile.full_name_ar,
        phone: profile.phone,
        preferred_language: profile.preferred_language,
        preferred_theme: profile.preferred_theme,
      })
      .eq('id', user.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: t('common.error', 'Error'),
        description: t('account.profileUpdateFailed', 'Failed to update profile.'),
      });
    } else {
      // Update local preferences
      if (profile.preferred_language && profile.preferred_language !== language) {
        setLanguage(profile.preferred_language as 'en' | 'ar');
      }
      if (profile.preferred_theme && profile.preferred_theme !== theme) {
        setTheme(profile.preferred_theme as 'light' | 'dark' | 'system');
      }

      toast({
        title: t('common.success', 'Success'),
        description: t('account.profileUpdated', 'Profile updated successfully.'),
      });
    }

    setIsSaving(false);
  };

  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast({
        variant: 'destructive',
        title: t('common.error', 'Error'),
        description: t('auth.passwordsDoNotMatch', 'Passwords do not match.'),
      });
      return;
    }

    if (passwordData.new.length < 6) {
      toast({
        variant: 'destructive',
        title: t('common.error', 'Error'),
        description: t('auth.passwordTooShort', 'Password must be at least 6 characters.'),
      });
      return;
    }

    setIsChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: passwordData.new,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: t('common.error', 'Error'),
        description: error.message,
      });
    } else {
      toast({
        title: t('common.success', 'Success'),
        description: t('account.passwordChanged', 'Password changed successfully.'),
      });
      setPasswordData({ current: '', new: '', confirm: '' });
    }

    setIsChangingPassword(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('account.settings', 'Settings')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('account.settingsDescription', 'Manage your account settings and preferences.')}
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('account.profileInformation', 'Profile Information')}
          </CardTitle>
          <CardDescription>
            {t('account.profileDescription', 'Update your personal details.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">{t('account.fullNameEn', 'Full Name (English)')}</Label>
              <Input
                id="full_name"
                value={profile.full_name || ''}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name_ar">{t('account.fullNameAr', 'Full Name (Arabic)')}</Label>
              <Input
                id="full_name_ar"
                dir="rtl"
                value={profile.full_name_ar || ''}
                onChange={(e) => setProfile({ ...profile, full_name_ar: e.target.value })}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('account.email', 'Email')}</Label>
              <Input id="email" value={profile.email || ''} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                {t('account.emailCannotChange', 'Email cannot be changed.')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('account.phone', 'Phone')}</Label>
              <Input
                id="phone"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+965 XXXX XXXX"
              />
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {t('common.saveChanges', 'Save Changes')}
          </Button>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('account.preferences', 'Preferences')}
          </CardTitle>
          <CardDescription>
            {t('account.preferencesDescription', 'Customize your experience.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('account.language', 'Language')}</Label>
              <Select
                value={profile.preferred_language || 'en'}
                onValueChange={(value) => setProfile({ ...profile, preferred_language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">
                    <span className="flex items-center gap-2">🇺🇸 English</span>
                  </SelectItem>
                  <SelectItem value="ar">
                    <span className="flex items-center gap-2">🇰🇼 العربية</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('account.theme', 'Theme')}</Label>
              <Select
                value={profile.preferred_theme || 'system'}
                onValueChange={(value) => setProfile({ ...profile, preferred_theme: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <span className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      {t('theme.light', 'Light')}
                    </span>
                  </SelectItem>
                  <SelectItem value="dark">
                    <span className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      {t('theme.dark', 'Dark')}
                    </span>
                  </SelectItem>
                  <SelectItem value="system">
                    <span className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      {t('theme.system', 'System')}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {t('common.saveChanges', 'Save Changes')}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t('account.changePassword', 'Change Password')}
          </CardTitle>
          <CardDescription>
            {t('account.passwordDescription', 'Update your password to keep your account secure.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new_password">{t('account.newPassword', 'New Password')}</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showPasswords ? 'text' : 'password'}
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">{t('account.confirmPassword', 'Confirm Password')}</Label>
            <Input
              id="confirm_password"
              type={showPasswords ? 'text' : 'password'}
              value={passwordData.confirm}
              onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
            />
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={isChangingPassword || !passwordData.new || !passwordData.confirm}
          >
            {isChangingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('account.updatePassword', 'Update Password')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
