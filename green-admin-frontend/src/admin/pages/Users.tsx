import { useNavigate } from 'react-router-dom';
import UserManagement from '../components/UserManagement';
import type { User } from '../types';

export default function Users() {
  const navigate = useNavigate();

  const handleUserSelect = (user: User) => {
    navigate(`/admin/users/${user.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">User Management</h2>
      </div>
      
      <UserManagement onUserSelect={handleUserSelect} />
    </div>
  );
}
