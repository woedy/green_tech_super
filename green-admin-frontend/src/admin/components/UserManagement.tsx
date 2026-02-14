import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Building, 
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { adminApi } from '../api';
import type { User, UserProfile } from '../types';
import type { UserResponse, UserPayload } from '../types/api';

interface UserManagementProps {
  onUserSelect?: (user: User) => void;
}

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
    // Legacy fields
    name: `${apiUser.first_name} ${apiUser.last_name}`.trim() || apiUser.email,
    role: apiUser.user_type.toLowerCase() as any,
    active: apiUser.is_active,
    phone: apiUser.phone_number,
    location: apiUser.profile?.city || undefined,
    verified: apiUser.is_verified,
  };
}

export default function UserManagement({ onUserSelect }: UserManagementProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());

  // Fetch users
  const { data: apiUsers = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.listUsers(),
  });

  const users = apiUsers.map(toUser);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.active) ||
      (statusFilter === 'inactive' && !user.active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Mutations
  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => adminApi.toggleUserActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'User status updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const toggleVerifiedMutation = useMutation({
    mutationFn: (id: number) => adminApi.toggleUserVerified(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'User verification updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserPayload> }) => 
      adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'User updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: adminApi.bulkUpdateUsers,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ 
        title: 'Bulk update completed', 
        description: `${result.success.length} users updated${result.errors.length ? `, ${result.errors.length} errors` : ''}` 
      });
      setSelectedUserIds(new Set());
      setBulkAction('');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleUserToggle = (userId: number, field: 'active' | 'verified') => {
    if (field === 'active') {
      toggleActiveMutation.mutate(userId);
    } else {
      toggleVerifiedMutation.mutate(userId);
    }
  };

  const handleRoleChange = (userId: number, newRole: User['role']) => {
    const userTypeMap: Record<string, UserResponse['user_type']> = {
      admin: 'ADMIN',
      agent: 'AGENT',
      builder: 'BUILDER',
      customer: 'CUSTOMER',
    };
    
    updateUserMutation.mutate({
      id: userId,
      data: { user_type: userTypeMap[newRole!] },
    });
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedUserIds.size === 0) return;

    const updates = Array.from(selectedUserIds).map(id => {
      let patch: any = {};
      
      switch (bulkAction) {
        case 'activate':
          patch = { is_active: true };
          break;
        case 'deactivate':
          patch = { is_active: false };
          break;
        case 'verify':
          patch = { is_verified: true };
          break;
        case 'unverify':
          patch = { is_verified: false };
          break;
      }
      
      return { id, patch };
    });

    bulkUpdateMutation.mutate(updates);
  };

  const handleUserEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUserSave = (updatedUser: User) => {
    const userTypeMap: Record<string, UserResponse['user_type']> = {
      admin: 'ADMIN',
      agent: 'AGENT',
      builder: 'BUILDER',
      customer: 'CUSTOMER',
    };

    const payload: Partial<UserPayload> = {
      email: updatedUser.email,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      phone_number: updatedUser.phone_number || updatedUser.phone,
      user_type: userTypeMap[updatedUser.role!] || updatedUser.user_type,
      is_active: updatedUser.is_active ?? updatedUser.active,
      is_verified: updatedUser.is_verified ?? updatedUser.verified,
      profile: updatedUser.profile ? {
        bio: updatedUser.profile.bio,
        company_name: updatedUser.profile.company_name || updatedUser.profile.company,
        license_number: updatedUser.profile.license_number,
        city: updatedUser.profile.city,
        country: updatedUser.profile.country,
      } : undefined,
    };

    updateUserMutation.mutate({ id: updatedUser.id, data: payload });
    setIsEditDialogOpen(false);
    setSelectedUser(null);
  };

  const getRoleBadgeVariant = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'agent': return 'default';
      case 'builder': return 'secondary';
      case 'customer': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="builder">Builder</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUserIds.size > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {selectedUserIds.size} users selected
              </span>
              
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Choose bulk action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activate">Activate Users</SelectItem>
                  <SelectItem value="deactivate">Deactivate Users</SelectItem>
                  <SelectItem value="verify">Verify Users</SelectItem>
                  <SelectItem value="unverify">Unverify Users</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={handleBulkAction}
                disabled={!bulkAction}
                size="sm"
              >
                Apply Action
              </Button>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedUserIds(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Users ({filteredUsers.length})</span>
            <Button onClick={() => handleUserEdit({} as User)} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
                      } else {
                        setSelectedUserIds(new Set());
                      }
                    }}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow 
                  key={user.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onUserSelect?.(user)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.has(user.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedUserIds);
                        if (e.target.checked) {
                          newSelected.add(user.id);
                        } else {
                          newSelected.delete(user.id);
                        }
                        setSelectedUserIds(newSelected);
                      }}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      {user.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={user.role}
                      onValueChange={(value: User['role']) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="builder">Builder</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.active}
                        onCheckedChange={() => handleUserToggle(user.id, 'active')}
                      />
                      <span className="text-sm">
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUserToggle(user.id, 'verified')}
                        className="h-8 w-8 p-0"
                      >
                        {user.verified ? (
                          <ShieldCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <Shield className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <span className="text-sm">
                        {user.verified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {user.location && (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {user.location}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(user.last_login)}
                    </div>
                  </TableCell>
                  
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUserEdit(user)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.id ? 'Edit User' : 'Add New User'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <UserEditForm
              user={selectedUser}
              onSave={handleUserSave}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface UserEditFormProps {
  user: User;
  onSave: (user: User) => void;
  onCancel: () => void;
}

function UserEditForm({ user, onSave, onCancel }: UserEditFormProps) {
  const [formData, setFormData] = useState<User>({
    ...user,
    first_name: user.first_name || user.name?.split(' ')[0] || '',
    last_name: user.last_name || user.name?.split(' ').slice(1).join(' ') || '',
    phone_number: user.phone_number || user.phone || '',
    user_type: user.user_type || (user.role?.toUpperCase() as any) || 'CUSTOMER',
    is_active: user.is_active ?? user.active ?? true,
    is_verified: user.is_verified ?? user.verified ?? false,
    profile: user.profile || {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setFormData(prev => ({
      ...prev,
      profile: { ...prev.profile, ...updates }
    }));
  };

  const roleMap: Record<string, User['role']> = {
    'ADMIN': 'admin',
    'AGENT': 'agent',
    'BUILDER': 'builder',
    'CUSTOMER': 'customer',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="phone_number">Phone</Label>
          <Input
            id="phone_number"
            value={formData.phone_number || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="user_type">Role</Label>
          <Select
            value={roleMap[formData.user_type] || formData.role}
            onValueChange={(value: User['role']) => {
              const typeMap: Record<string, typeof formData.user_type> = {
                admin: 'ADMIN',
                agent: 'AGENT',
                builder: 'BUILDER',
                customer: 'CUSTOMER',
              };
              setFormData(prev => ({ 
                ...prev, 
                role: value,
                user_type: typeMap[value]
              }));
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
        
        <div className="flex items-center space-x-2 pt-6">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked, active: checked }))}
          />
          <Label>Active</Label>
        </div>
        
        <div className="flex items-center space-x-2 pt-6">
          <Switch
            checked={formData.is_verified || false}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_verified: checked, verified: checked }))}
          />
          <Label>Verified</Label>
        </div>
      </div>

      {(formData.role === 'agent' || formData.role === 'builder' || 
        formData.user_type === 'AGENT' || formData.user_type === 'BUILDER') && (
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">Professional Information</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Company</Label>
              <Input
                id="company_name"
                value={formData.profile?.company_name || formData.profile?.company || ''}
                onChange={(e) => updateProfile({ company_name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="license_number">License Number</Label>
              <Input
                id="license_number"
                value={formData.profile?.license_number || ''}
                onChange={(e) => updateProfile({ license_number: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.profile?.city || ''}
                onChange={(e) => updateProfile({ city: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.profile?.country || 'Ghana'}
                onChange={(e) => updateProfile({ country: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.profile?.bio || ''}
              onChange={(e) => updateProfile({ bio: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {user.id ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}