import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Plan from "@/models/Plan";
import { getUserId } from "@/lib/auth";
import { canEditDaily, canEditMonthly, canEditYearly } from "@/lib/tashkent";

function isEditable(type, period) {
  if (type === "daily") return canEditDaily(period);
  if (type === "monthly") return canEditMonthly(period);
  if (type === "yearly") return canEditYearly(period);
  return false;
}

function validPeriod(type, period) {
  if (typeof period !== "string") return false;
  if (type === "daily") return /^\d{4}-\d{2}-\d{2}$/.test(period);
  if (type === "monthly") return /^\d{4}-\d{2}$/.test(period);
  if (type === "yearly") return /^\d{4}$/.test(period);
  return false;
}

export async function GET(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const period = searchParams.get("period");

  if (!validPeriod(type, period)) {
    return NextResponse.json({ error: "Noto'g'ri davr" }, { status: 400 });
  }

  await dbConnect();
  const plan = await Plan.findOne({ user: userId, type, periodKey: period });

  return NextResponse.json({
    type,
    period,
    editable: isEditable(type, period),
    items: plan ? plan.items.map((it) => ({ id: it._id, text: it.text, done: it.done })) : [],
  });
}

export async function POST(req) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: "Avtorizatsiya yo'q" }, { status: 401 });

  const body = await req.json();
  const { type, period, op } = body;

  if (!validPeriod(type, period)) {
    return NextResponse.json({ error: "Noto'g'ri davr" }, { status: 400 });
  }
  if (!isEditable(type, period)) {
    return NextResponse.json(
      { error: "Bu davrni tahrirlab bo'lmaydi (o'tib ketgan yoki yopilgan)" },
      { status: 403 }
    );
  }

  await dbConnect();
  let plan = await Plan.findOne({ user: userId, type, periodKey: period });
  if (!plan) {
    plan = await Plan.create({ user: userId, type, periodKey: period, items: [] });
  }

  if (op === "add") {
    const text = (body.text || "").trim();
    if (!text) return NextResponse.json({ error: "Matn bo'sh" }, { status: 400 });
    plan.items.push({ text, done: false });
  } else if (op === "toggle") {
    const it = plan.items.id(body.itemId);
    if (it) it.done = !it.done;
  } else if (op === "edit") {
    const it = plan.items.id(body.itemId);
    if (it && (body.text || "").trim()) it.text = body.text.trim();
  } else if (op === "delete") {
    const it = plan.items.id(body.itemId);
    if (it) it.deleteOne();
  } else {
    return NextResponse.json({ error: "Noma'lum amal" }, { status: 400 });
  }

  await plan.save();

  return NextResponse.json({
    items: plan.items.map((it) => ({ id: it._id, text: it.text, done: it.done })),
  });
}
