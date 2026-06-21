import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyPendingToken, signToken, setAuthCookie } from "@/lib/auth";

function normalize(flat) {
  const lm = [];
  for (let i = 0; i < 21; i++) {
    lm.push({ x: flat[i * 3], y: flat[i * 3 + 1], z: flat[i * 3 + 2] });
  }
  const wx = lm[0].x, wy = lm[0].y, wz = lm[0].z;
  const c = lm.map((p) => ({ x: p.x - wx, y: p.y - wy, z: p.z - wz }));
  const scale = Math.sqrt(c[9].x ** 2 + c[9].y ** 2 + c[9].z ** 2) || 1;
  return c.flatMap((p) => [p.x / scale, p.y / scale, p.z / scale]);
}

function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function POST(req) {
  try {
    const { pendingToken, landmarks } = await req.json();
    if (!pendingToken || !Array.isArray(landmarks) || landmarks.length !== 63) {
      return NextResponse.json({ error: "Noto'g'ri ma'lumot" }, { status: 400 });
    }

    const decoded = verifyPendingToken(pendingToken);
    if (!decoded?.id) {
      return NextResponse.json({ error: "Token eskirgan, qaytadan kiring" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(decoded.id).select("handLandmarks handScanEnabled name phone username");
    if (!user || !user.handScanEnabled || !user.handLandmarks?.length) {
      return NextResponse.json({ error: "Skaner sozlanmagan" }, { status: 400 });
    }

    const stored = normalize(user.handLandmarks);
    const incoming = normalize(landmarks);
    const sim = cosineSimilarity(stored, incoming);

    if (sim < 0.985) {
      return NextResponse.json({ error: "Qo'l tanilmadi. Qaytadan urinib ko'ring." }, { status: 401 });
    }

    const token = signToken({ id: user._id.toString() });
    setAuthCookie(token);

    return NextResponse.json({
      user: { id: user._id, name: user.name, phone: user.phone, username: user.username },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Xatolik" }, { status: 500 });
  }
}
