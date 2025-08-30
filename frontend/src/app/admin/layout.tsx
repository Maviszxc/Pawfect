import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="md:pl-64 lg:pl-72">
        <AdminHeader />
        <main className="px-4 pb-6">{children}</main>
      </div>
    </div>
  );
}
