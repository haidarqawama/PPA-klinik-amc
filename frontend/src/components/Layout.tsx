'use client'

import {
  LayoutDashboard,
  Package,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Building2,
  Tags,
  Menu,
  X
} from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

export function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const activeHref = pathname.replace(/\/$/, "") || "/";

  function isActive(href: string): boolean {
    if (!activeHref) return false;
    const h = href.replace(/\/$/, "") || "/";
    if (h === "/") return activeHref === "/";
    return activeHref.startsWith(h);
  }

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Data Barang", href: "/inventory", icon: Package },
    { name: "Tambah Barang", href: "/add-item", icon: PlusCircle },
    { name: "Barang Masuk", href: "/stock-in", icon: TrendingUp },
    { name: "Barang Keluar", href: "/stock-out", icon: TrendingDown },
    { name: "Monitoring Stok", href: "/monitoring", icon: Activity },
    { name: "Master Data", href: "/master-data", icon: Tags },
    { name: "Supplier", href: "/supplier", icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar border-r border-sidebar-border px-6 pb-4">
          <div className="flex h-20 shrink-0 items-center">
            <div className="flex items-center gap-3">
              <Image
                src="/logo/logo.png"
                alt="Ampelgading Medical Centre"
                width={48}
                height={48}
                className="h-12 w-auto object-contain"
              />
              <div>
                <h1 className="text-sm font-semibold text-sidebar-foreground">Ampelgading Medical Centre</h1>
                <p className="text-xs text-muted-foreground">Inventory System</p>
              </div>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-1">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className={`
                        group flex gap-x-3 rounded-xl px-4 py-3 transition-all duration-200
                        ${active
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }
                      `}
                    >
                      <item.icon className={`h-5 w-5 shrink-0 ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                      {item.name}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-sidebar border-b border-sidebar-border px-4 py-4 shadow-sm lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-sidebar-foreground lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <Image
            src="/logo/logo.png"
            alt="Ampelgading Medical Centre"
            width={32}
            height={32}
            className="h-8 w-auto object-contain"
          />
          <span className="text-sm font-semibold">Ampelgading Medical Centre</span>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-sidebar border-r border-sidebar-border p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo/logo.png"
                  alt="Ampelgading Medical Centre"
                  width={40}
                  height={40}
                  className="h-10 w-auto object-contain"
                />
                <div>
                  <h1 className="text-sm font-semibold">Ampelgading Medical Centre</h1>
                  <p className="text-xs text-muted-foreground">Inventory System</p>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-y-1">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex gap-x-3 rounded-xl px-4 py-3 transition-all duration-200
                      ${active
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                      }
                    `}
                  >
                    <item.icon className={`h-5 w-5 ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    {item.name}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-72">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
