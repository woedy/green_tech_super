import React, { useState } from 'react';
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
  MoreHorizontal
} from 'lucide-react';
import { db } from '../data/db';
import type { User, UserProfile } from '../types';

interface UserManagementProps {
  onUserSelect?: (user: User) => void;
}

export default function UserManagement({ onUserSelect }: UserManagementProps) {
  const [users, setUsers] = useState(db.listUsers());
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());

  const regions = db.listRegions();

  // Filter users based on search and filters
  const applyFilters = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(user => user.active === isActive);
    }

    setFilteredUsers(filtered);
  };

  // Apply filters when dependencies change
  React.useEffect(() => {
    applyFilters();
  }, [searchTerm, roleFilter, statusFilter, users]);

  const handleUserToggle = (userId: number, field: 'active' | 'verified') => {
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        const updated = { ...user, [field]: !user[field] };
        db.updateUser(userId, { [field]: updated[field] });
        return updated;
      }
      return user;
    });
    setUsers(updatedUsers);
    applyFilters();
  };

  const handleRoleChange = (userId: number, newRole: User['role']) => {
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        const updated = { ...user, role: newRole };
        db.updateUser(userId, { role: newRole });
        return updated;
      }
      return user;
    });
    setUsers(updatedUsers);
    applyFilters();
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedUserIds.size === 0) return;

    const updates = Array.from(selectedUserIds).map(id => {
      let patch: Partial<Omit<User, 'id'>> = {};
      
      switch (bulkAction) {
        case 'activate':
          patch = { active: true };
          break;
        case 'deactivate':
          patch = { active: false };
          break;
        case 'verify':
          patch = { verified: true };
          break;
        case 'unverify':
          patch = { verified: false };
          break;
      }
      
      return { id, patch };
    });

    const result = db.bulkUpdateUsers(updates);
    
    if (result.success.length > 0) {
      setUsers(db.listUsers());
      applyFilters();
      setSelectedUserIds(new Set());
      setBulkAction('');
    }
  };

  const handleUserEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUserSave = (updatedUser: User) => {
    db.updateUser(updatedUser.id, updatedUser);
    setUsers(db.listUsers());
    applyFilters();
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

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
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    applyFilters();
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={(value) => {
              setRoleFilter(value);
              applyFilters();
            }}>
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

            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              applyFilters();
            }}>
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
              regions={regions}
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
  regions: Array<{ code: string; name: string }>;
  onSave: (user: User) => void;
  onCancel: () => void;
}

function UserEditForm({ user, regions, onSave, onCancel }: UserEditFormProps) {
  const [formData, setFormData] = useState<User>({
    ...user,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="role">Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value: User['role']) => setFormData(prev => ({ ...prev, role: value }))}
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
            checked={formData.active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
          />
          <Label>Active</Label>
        </div>
        
        <div className="flex items-center space-x-2 pt-6">
          <Switch
            checked={formData.verified || false}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, verified: checked }))}
          />
          <Label>Verified</Label>
        </div>
      </div>

      {(formData.role === 'agent' || formData.role === 'builder') && (
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">Professional Information</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.profile?.company || ''}
                onChange={(e) => updateProfile({ company: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="license">License Number</Label>
              <Input
                id="license"
                value={formData.profile?.license_number || ''}
                onChange={(e) => updateProfile({ license_number: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="specializations">Specializations (comma-separated)</Label>
            <Input
              id="specializations"
              value={formData.profile?.specializations?.join(', ') || ''}
              onChange={(e) => updateProfile({ 
                specializations: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
            />
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