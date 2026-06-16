// Toshkent vaqti = UTC+5 (DST yo'q).
const TZ_OFFSET_MIN = 5 * 60;

function shifted(date = new Date()) {
  return new Date(date.getTime() + TZ_OFFSET_MIN * 60 * 1000);
}

// "YYYY-MM-DD" Toshkent sanasi
export function tashkentDateStr(date = new Date()) {
  return shifted(date).toISOString().slice(0, 10);
}

// "YYYY-MM" Toshkent oyi
export function tashkentMonthStr(date = new Date()) {
  return shifted(date).toISOString().slice(0, 7);
}

// "YYYY" Toshkent yili
export function tashkentYearStr(date = new Date()) {
  return shifted(date).toISOString().slice(0, 4);
}

// Hafta boshini (dushanba) Toshkent bo'yicha "YYYY-MM-DD" ko'rinishda qaytaradi
export function tashkentWeekStartStr(date = new Date()) {
  const t = shifted(date);
  const day = t.getUTCDay(); // 0=yakshanba
  const diff = (day === 0 ? 6 : day - 1); // dushanbagacha
  t.setUTCDate(t.getUTCDate() - diff);
  return t.toISOString().slice(0, 10);
}

// Tahrirlash ruxsati tekshiruvi
export function canEditDaily(periodKey) {
  return periodKey === tashkentDateStr();
}
export function canEditMonthly(periodKey) {
  return periodKey >= tashkentMonthStr(); // o'tib ketgan oyni tahrirlab bo'lmaydi
}
export function canEditYearly(periodKey) {
  return periodKey >= tashkentYearStr();
}
