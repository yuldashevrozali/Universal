export default function ExpensesPage() {
  return (
    <div>
      <h1 className="page-title">Xarajat</h1>
      <p className="page-sub">Daromad va xarajatlaringizni kuzatib boring.</p>

      <div className="card center" style={{ padding: 60 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>💰</div>
        <h2 style={{ margin: "0 0 8px" }}>Tez orada qo'shiladi</h2>
        <p className="muted" style={{ maxWidth: 420, margin: "0 auto" }}>
          Bu bo'lim hozircha tayyorlanmoqda. Tez orada bu yerda xarajatlaringizni
          kiritish va tahlil qilish imkoniyati paydo bo'ladi.
        </p>
        <div className="badge" style={{ marginTop: 18 }}>Coming soon</div>
      </div>
    </div>
  );
}
