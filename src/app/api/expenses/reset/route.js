import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Expense from "@/models/Expense";
import { getUserId } from "@/lib/auth";

export async function POST() {
    const userId = getUserId();
    if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

    await dbConnect();
    await Expense.deleteMany({ user: userId });

    return NextResponse.json({ ok: true });
}
