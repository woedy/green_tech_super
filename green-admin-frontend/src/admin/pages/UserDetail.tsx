import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Phone, Calendar, Shield, User as UserIcon } from 'lucide-react';
import { adminApi } from '../api';
import type { User } from '../types';
import type { UserPayload, UserResponse } from '../types/api';
import { useEffect, useState } from 'react';

// Helper to convert API response to legacy User format
function toUser(apiUser: UserResponse): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    first_name: apiUser.first_name,
    last_name: apiUser.last_name,
    phone_number: apiUser.phone_number,
    user_type: apiUser.user_type,
    is_active: apiUser.is_active,
    is_verified: apiUser.is_verified,
    is_staff: apiUser.is_staff,
    is_superuser: apiUser.is_superuser,
    date_of_birth: apiUser.date_of_birth,
    profile_picture: apiUser.profile_picture,
    created_at: apiUser.created_at,
    updated_at: apiUser.updated_at,
    last_login: apiUser.last_login,
    profile: apiUser.profile || undefined,
    name: `${apiUser.first_name} ${apiUser.last_name}`.trim() || apiUser.email,
    role: apiUser.user_type.toLowerCase() as any,
    active: apiUser.is_active,
    phone: apiUser.phone_number,
    location: apiUser.profile?.city || undefined,
    verified: apiUser.is_verified,
  };
}

export function UserForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [form, setForm] = useState<Partial<User>>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    user_type: 'CUSTOMER',
    is_active: true,
    is_verified: false,
    profile: {},
  });

  // Fetch user if editing
  const { data: apiUser, isLoading } = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => adminApi.getUser(Number(id)),
    enabled: editing,
  });

  useEffect(() => {
    if (apiUser) {
      const user = toUser(apiUser);
      setForm(user);
    }
  }, [apiUser]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (payload: UserPayload) => adminApi.createUser(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'User created successfully' });
      navigate(`/admin/users/${data.id}`);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (payload: Partial<UserPayload>) => adminApi.updateUser(Number(id), payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'User updated successfully' });
      navigate(`/admin/users/${data.id}`);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.first_name || !form.last_name || !form.email) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const payload: Partial<UserPayload> = {
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      phone_number: form.phone_number || form.phone,
      user_type: form.user_type,
      is_active: form.is_active ?? form.active,
      is_verified: form.is_verified ?? form.verified,
      profile: form.profile ? {
        bio: form.profile.bio,
        company_name: form.profile.company_name || form.profile.company,
        license_number: form.profile.license_number,
        city: form.profile.city,
        country: form.profile.country,
      } : undefined,
    };

    if (editing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload as UserPayload);
    }
  };

  const roleMap: Record<string, User['role']> = {
    'ADMIN': 'admin',
    'AGENT': 'agent',
    'BUILDER': 'builder',
    'CUSTOMER': 'customer',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? 'Edit User' : 'New User'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input
                value={form.first_name}
                onChange={e => setForm({ ...form, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                value={form.last_name}
                onChange={e => setForm({ ...form, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone_number || form.phone || ''}
                onChange={e => setForm({ ...form, phone_number: e.target.value, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Role</Label>
              <Select
                value={roleMap[form.user_type!] || form.role}
                onValueChange={(value: User['role']) => {
                  const typeMap: Record<string, typeof form.user_type> = {
                    admin: 'ADMIN',
                    agent: 'AGENT',
                    builder: 'BUILDER',
                    customer: 'CUSTOMER',
                  };
                  setForm({ ...form, role: value, user_type: typeMap[value] });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="builder">Builder</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <Switch
                checked={form.is_active ?? form.active ?? true}
                onCheckedChange={v => setForm({ ...form, is_active: v, active: v })}
              />
              <Label>Active</Label>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <Switch
                checked={form.is_verified ?? form.verified ?? false}
                onCheckedChange={v => setForm({ ...form, is_verified: v, verified: v })}
              />
              <Label>Verified</Label>
            </div>
          </div>

          {(form.role === 'agent' || form.role === 'builder' || 
            form.user_type === 'AGENT' || form.user_type === 'BUILDER') && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Professional Information</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company</Label>
                  <Input
                    value={form.profile?.company_name || form.profile?.company || ''}
                    onChange={e => setForm({
                      ...form,
                      profile: { ...form.profile, company_name: e.target.value, company: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>License Number</Label>
                  <Input
                    value={form.profile?.license_number || ''}
                    onChange={e => setForm({
                      ...form,
                      profile: { ...form.profile, license_number: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={form.profile?.city || ''}
                    onChange={e => setForm({
                      ...form,
                      profile: { ...form.profile, city: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={form.profile?.country || 'Ghana'}
                    onChange={e => setForm({
                      ...form,
                      profile: { ...form.profile, country: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div>
                <Label>Bio</Label>
                <Textarea
                  value={form.profile?.bio || ''}
                  onChange={e => setForm({
                    ...form,
                    profile: { ...form.profile, bio: e.target.value }
                  })}
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editing ? 'Save' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/users')}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: apiUser, isLoading } = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => adminApi.getUser(Number(id)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteUser(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'User deleted successfully' });
      navigate('/admin/users');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!apiUser) {
    return <div>User not found.</div>;
  }

  const user = toUser(apiUser);

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'destructive';
      case 'agent': return 'default';
      case 'builder': return 'secondary';
      case 'customer': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold">{user.name}</h2>
          <Badge variant={getRoleBadgeVariant(user.user_type)}>
            {user.user_type}
          </Badge>
          {user.is_verified && (
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              Verified
            </Badge>
          )}
          <Badge variant={user.is_active ? 'default' : 'secondary'}>
            {user.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/admin/users/${user.id}/edit`)}>
            Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              if (confirm('Are you sure you want to delete this user?')) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Email:</span>
              <span>{user.email}</span>
            </div>
            {user.phone_number && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Phone:</span>
                <span>{user.phone_number}</span>
              </div>
            )}
            {user.profile?.city && (
              <div>
                <span className="font-medium">Location:</span>
                <span className="ml-2">{user.profile.city}{user.profile.country ? `, ${user.profile.country}` : ''}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium">Created:</span>
              <span className="ml-2">{new Date(user.created_at!).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="font-medium">Last Login:</span>
              <span className="ml-2">
                {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
              </span>
            </div>
            {user.is_staff && (
              <div>
                <Badge variant="outline">Staff Member</Badge>
              </div>
            )}
            {user.is_superuser && (
              <div>
                <Badge variant="destructive">Superuser</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(user.user_type === 'AGENT' || user.user_type === 'BUILDER') && user.profile && (
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.profile.company_name && (
              <div>
                <span className="font-medium">Company:</span>
                <span className="ml-2">{user.profile.company_name}</span>
              </div>
            )}
            {user.profile.license_number && (
              <div>
                <span className="font-medium">License Number:</span>
                <span className="ml-2">{user.profile.license_number}</span>
              </div>
            )}
            {user.profile.years_of_experience && (
              <div>
                <span className="font-medium">Years of Experience:</span>
                <span className="ml-2">{user.profile.years_of_experience}</span>
              </div>
            )}
            {user.profile.bio && (
              <div>
                <span className="font-medium">Bio:</span>
                <p className="mt-1 text-sm text-muted-foreground">{user.profile.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
