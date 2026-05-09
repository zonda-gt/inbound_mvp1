import { isAuthenticated } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import ConciergeInbox from "@/components/admin/ConciergeInbox";

export default async function AdminChatPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-white">
      <AdminNav breadcrumb="Chat" />
      <ConciergeInbox />
    </div>
  );
}
