import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }) {
  const id = getUserId();
  if (!id) redirect("/login");

  await dbConnect();
  const user = await User.findById(id).select("name username");
  if (!user) redirect("/login");

  return (
    <div className="shell">
      <Sidebar name={user.name} username={user.username} />
      <main className="main">{children}</main>
    </div>
  );
}
