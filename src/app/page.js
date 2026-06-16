import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";

export default function Home() {
  if (getUserId()) redirect("/dashboard");
  redirect("/login");
}
