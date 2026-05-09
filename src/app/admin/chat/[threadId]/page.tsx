import { isAuthenticated } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import ConciergeThreadView from "@/components/admin/ConciergeThread";

type Params = { threadId: string };

export default async function AdminChatThreadPage({
  params,
}: {
  params: Promise<Params>;
}) {
  if (!(await isAuthenticated())) redirect("/admin/login");
  const { threadId } = await params;

  return (
    <div className="min-h-screen bg-white">
      <AdminNav breadcrumb="Chat" breadcrumbHref="/admin/chat" subbreadcrumb={threadId.slice(0, 8)} />
      <ConciergeThreadView threadId={threadId} />
    </div>
  );
}
