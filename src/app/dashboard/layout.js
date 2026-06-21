import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Sidebar from "@/components/Sidebar";

const ADMIN_PHONE = "+998912038995";

export default async function DashboardLayout({ children }) {
  const id = getUserId();
  if (!id) redirect("/login");

  await dbConnect();
  const user = await User.findByIdAndUpdate(
    id,
    { $set: { lastSeen: new Date() } },
    { new: true }
  ).select("name username phone blocked");

  if (!user || user.blocked) redirect("/login");

  const isAdmin = user.phone === ADMIN_PHONE;

  return (
    <div className="shell">
      <Sidebar name={user.name} username={user.username} isAdmin={isAdmin} />
      <main className="main">{children}</main>
    </div>
  );
}
