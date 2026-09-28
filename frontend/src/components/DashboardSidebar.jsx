import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';

export default function DashboardSidebar({
  navItems,
  userName,
  userRole,
  initials,
  gradient = 'linear-gradient(135deg,#2563EB,#818CF8)',
  onSelect,
  onLogout,
}) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    if (location.pathname === path) return true;
    // Only multi-segment paths match their descendants.
    // A single-segment path (e.g. /manager) is the layout's own Overview route.
    const segments = path.split('/').filter(Boolean);
    return segments.length >= 2 && location.pathname.startsWith(`${path}/`);
  };

  const renderItems = () =>
    navItems.map(({ icon: Icon, label, path, active }) => {
      const activeState = path ? isActive(path) : active;
      const className =
        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors';
      const style = {
        background: activeState ? '#EAF1FF' : 'transparent',
        color: activeState ? '#2563EB' : '#6B7386',
        cursor: 'pointer',
      };
      return path ? (
        <Link key={label} to={path} className={className} style={style}>
          <Icon size={16} strokeWidth={2.2} />
          {label}
        </Link>
      ) : (
        <button key={label} onClick={() => onSelect && onSelect(label)} className={className} style={style}>
          <Icon size={16} strokeWidth={2.2} />
          {label}
        </button>
      );
    });

  const brand = () => (
    <div className="mb-8 flex items-center gap-2 px-2">
      <img src="/truereach_logo.png" alt="TrueReach" className="h-9 w-9 rounded-lg object-contain" />
      <span className="font-display text-[16px] font-bold" style={{ color: '#161B23' }}>
        TrueReach
      </span>
    </div>
  );

  const userCard = () => (
    <div className="mb-6 flex items-center gap-3 rounded-xl px-3 py-3" style={{ background: '#F5F7FB' }}>
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ background: gradient }}
      >
        {initials}
      </div>
      <div>
        <div className="text-[13px] font-semibold" style={{ color: '#161B23' }}>
          {userName}
        </div>
        <div className="text-[11.5px]" style={{ color: '#8B93A7' }}>
          {userRole}
        </div>
      </div>
    </div>
  );

  const logoutButton = () => (
    <button
      onClick={onLogout}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors hover:bg-[#FDEBEB]"
      style={{ color: '#DC2626', cursor: 'pointer' }}
    >
      <LogOut size={16} strokeWidth={2.2} />
      Logout
    </button>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="fixed bottom-0 left-0 top-0 z-40 hidden w-[230px] shrink-0 flex-col overflow-y-auto bg-white px-3 py-6 md:flex"
        style={{ borderRight: '1px solid #E7EAF3' }}
      >
        {brand()}
        {userCard()}
        <nav className="flex flex-col gap-1">{renderItems()}</nav>
        <div className="mt-auto pt-4" style={{ borderTop: '1px solid #E7EAF3' }}>
          {logoutButton()}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header
        className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between bg-white px-4 py-3 md:hidden"
        style={{ borderBottom: '1px solid #E7EAF3' }}
      >
        <div className="flex items-center gap-2">
          <img src="/truereach_logo.png" alt="TrueReach" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-display text-[15px] font-bold" style={{ color: '#161B23' }}>
            TrueReach
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: '#F5F7FB', cursor: 'pointer' }}
          aria-label="Open menu"
        >
          <Menu size={18} style={{ color: '#6B7386' }} />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside
            className="absolute bottom-0 left-0 top-0 flex w-[240px] flex-col overflow-y-auto bg-white px-3 py-5"
            style={{ borderRight: '1px solid #E7EAF3' }}
          >
            <div className="mb-2 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: '#F5F7FB', cursor: 'pointer' }}
                aria-label="Close menu"
              >
                <X size={16} style={{ color: '#6B7386' }} />
              </button>
            </div>
            {brand()}
            {userCard()}
            <nav className="flex flex-col gap-1">{renderItems()}</nav>
            <div className="mt-auto pt-4" style={{ borderTop: '1px solid #E7EAF3' }}>
              {logoutButton()}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
