import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import Image from 'next/image';

export function AdminNav() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useSidebar();

  const navItems = [
    { name: 'Overview', href: '/admin/overview' },
    { name: 'Store', href: '/admin/store' },
    { name: 'Site Configuration', href: '/admin/site-config' },
  ];

  const handleNavClick = () => {
    // Only close sidebar on mobile
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside className={`
      fixed md:relative 
      top-0 left-0 h-screen md:h-auto
      bg-black
      transition-[width] duration-200 ease-in-out
      md:w-64 md:min-h-full
      ${sidebarOpen ? 'w-64' : 'w-0'}
      shadow-lg md:shadow-none
      overflow-hidden
      flex-shrink-0
      z-50
      border-r border-white/20
    `}>
      <div className="h-full flex flex-col w-64">
        {/* Logo Section - Only visible on mobile */}
        <div className="flex justify-center w-full pt-6 pb-2 md:hidden">
          <Image
            src="/contact/famous-logo.png"
            alt="Famous Since logo"
            width={70}
            height={70}
            className="object-contain"
          />
        </div>
        
        <div className="flex-1 p-6 md:p-8 pt-2 md:pt-6">
          <div className="flex items-center justify-between mb-8">
            <h2 
              className="text-white text-xl"
              style={{ fontFamily: 'Chalkduster, fantasy' }}
            >
              Admin Panel
            </h2>
          </div>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
} 