import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  MoreHorizontal,
  Users,
  Shield,
  ShieldOff,
  Loader2,
  UserCheck,
  UserX,
} from 'lucide-react';

// User/Profile type
interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  user_roles: { role: string }[];
}

export default function UsersPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');

  // Fetch users with their roles
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users', searchQuery],
    queryFn: async (): Promise<UserProfile[]> => {
      // First, fetch all profiles
      let profileQuery = supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          phone,
          avatar_url,
          is_active,
          created_at
        `)
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchQuery) {
        profileQuery = profileQuery.or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);
      }

      const { data: profiles, error: profileError } = await profileQuery;
      if (profileError) throw profileError;
      
      if (!profiles || profiles.length === 0) {
        return [];
      }

      // Fetch user roles separately
      const userIds = profiles.map(p => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);
      
      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      // Combine profiles with their roles
      const usersWithRoles: UserProfile[] = profiles.map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.id).map(r => ({ role: r.role })) || []
      }));

      return usersWithRoles;
    },
  });

  // Log errors for debugging
  if (error) {
    console.error('Error fetching users:', error);
  }

  // Toggle user active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: t('admin.userUpdated', 'User status updated') });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: error.message,
      });
    },
  });

  // Add/Remove admin role
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      if (isAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) throw error;
      } else {
        // Add admin role
        const { error } = await supabase.from('user_roles').insert({
          user_id: userId,
          role: 'admin',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: t('admin.roleUpdated', 'User role updated') });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: error.message,
      });
    },
  });

  // Check if user is admin
  const isAdmin = (user: UserProfile) => {
    return user.user_roles?.some((r) => r.role === 'admin');
  };

  // Get initials from name or email
  const getInitials = (user: UserProfile) => {
    if (user.full_name) {
      return user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('admin.users', 'Users')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.usersDescription', 'Manage user accounts and roles')}
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              placeholder={t('admin.searchUsers', 'Search by name or email...')}
              className={isRTL ? 'pr-10' : 'pl-10'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('admin.allUsers', 'All Users')}
            {users && (
              <Badge variant="secondary" className="ml-2">
                {users.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users?.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t('admin.noUsers', 'No users found')}
              </h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>{t('admin.user', 'User')}</TableHead>
                    <TableHead>{t('admin.email', 'Email')}</TableHead>
                    <TableHead>{t('admin.phone', 'Phone')}</TableHead>
                    <TableHead>{t('admin.role', 'Role')}</TableHead>
                    <TableHead>{t('admin.status', 'Status')}</TableHead>
                    <TableHead>{t('admin.joined', 'Joined')}</TableHead>
                    <TableHead className={isRTL ? 'text-left' : 'text-right'}>{t('admin.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {user.full_name || t('admin.noName', 'No name')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        {isAdmin(user) ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            <Shield className="h-3 w-3 mr-1" />
                            {t('admin.admin', 'Admin')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {t('admin.customer', 'Customer')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'destructive'}>
                          {user.is_active
                            ? t('admin.active', 'Active')
                            : t('admin.inactive', 'Inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                            <DropdownMenuItem
                              onClick={() =>
                                toggleActiveMutation.mutate({
                                  id: user.id,
                                  is_active: user.is_active,
                                })
                              }
                            >
                            {user.is_active ? (
                                <span className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                                  <UserX className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                  {t('admin.deactivate', 'Deactivate')}
                                </span>
                              ) : (
                                <span className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                                  <UserCheck className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                  {t('admin.activate', 'Activate')}
                                </span>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                toggleAdminMutation.mutate({
                                  userId: user.id,
                                  isAdmin: isAdmin(user),
                                })
                              }
                            >
                            {isAdmin(user) ? (
                                <span className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                                  <ShieldOff className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                  {t('admin.removeAdmin', 'Remove Admin')}
                                </span>
                              ) : (
                                <span className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                                  <Shield className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                  {t('admin.makeAdmin', 'Make Admin')}
                                </span>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
