import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentAgency } from "@/lib/auth/agency";
import { auth } from "@clerk/nextjs/server";
import { 
  LayoutDashboard, 
  FileText, 
  FileSignature, 
  Users, 
  BarChart3, 
  CreditCard, 
  Settings,
  Receipt
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Proposals", href: "/proposals", icon: FileText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Contracts", href: "/contracts", icon: FileSignature },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Invoices", href: "/invoices", icon: CreditCard },
  { name: "Billing", href: "/billing", icon: Receipt },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { orgId } = await auth();
  const agency = await getCurrentAgency();
  
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || "/";
  
  // If no agency and we're not on onboarding, redirect
  if (!agency && pathname !== "/onboarding") {
    redirect("/onboarding");
  }

  // If on onboarding, render without sidebar
  if (pathname === "/onboarding") {
    return <div className="min-h-screen bg-surface">{children}</div>;
  }
  
  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-white flex flex-col fixed inset-y-0 left-0">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-brand tracking-tighter">AGENCY SUITE</Link>
        </div>
        
        <div className="p-4 border-b border-border">
          <OrganizationSwitcher 
            appearance={{
              elements: {
                rootBox: "w-full",
                organizationSwitcherTrigger: "w-full justify-between"
              }
            }}
          />
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded-lg ${
                  isActive 
                    ? "text-brand bg-brand/5 font-medium" 
                    : "text-mid hover:text-dark hover:bg-surface"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-brand" : "text-mid"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border flex items-center justify-between">
          <UserButton />
          <span className="text-xs text-mid uppercase font-medium">Agency Suite</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col ml-64 relative">
        <div className="bg-brand/10 border-b border-brand/20 px-4 py-2 flex items-center justify-between z-20">
          <p className="text-xs font-semibold text-brand tracking-wide">
            TRIAL ACTIVE: 1 of 5 reports used
          </p>
          <Link href="/billing" className="text-xs font-semibold bg-brand text-white px-3 py-1 rounded hover:opacity-90">
            Upgrade Agency
          </Link>
        </div>
        <header className="h-16 border-b border-border bg-white px-8 flex items-center justify-between sticky top-0 z-10">
           <h1 className="text-sm font-medium text-dark uppercase tracking-widest">
             {navItems.find(i => pathname.startsWith(i.href))?.name || "Dashboard"}
           </h1>
           <div className="flex items-center gap-4">
             {/* Header actions can go here */}
           </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
