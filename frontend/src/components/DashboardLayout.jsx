import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardSidebar from './DashboardSidebar';

const roleGradient = {
  superadmin: 'linear-gradient(135deg,#2563EB,#818CF8)',
  citymanager: 'linear-gradient(135deg,#2563EB,#22D3EE)',
  advertiser: 'linear-gradient(135deg,#4F46E5,#22D3EE)',
};

const roleLabel = {
  superadmin: 'Network-wide access',
  citymanager: 'City Manager',
  advertiser: 'Advertiser',
};

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function DashboardLayout({ title, navItems }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = getInitials(user?.name);

  return (
    <div className="min-h-screen" style={{ background: '#EFF2F8', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <DashboardSidebar
        navItems={navItems}
        userName={user?.name || title}
        userRole={roleLabel[user?.role] || title}
        initials={initials}
        gradient={roleGradient[user?.role] || roleGradient.superadmin}
        onLogout={handleLogout}
      />
      <main className="min-h-screen px-5 pb-8 pt-[68px] md:ml-[230px] md:px-8 md:pt-6">
        <Outlet />
      </main>
    </div>
  );
}
