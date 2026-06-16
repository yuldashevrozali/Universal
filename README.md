# Universal

Bitta veb-sayt — **Grind** (vaqt boshqaruvi), **Maqsadlar** (kunlik/oylik/yillik rejalar), **Chat** (matnli yozishuv) va **Kitoblar** (tez orada).

Texnologiyalar: Next.js 14 (App Router) · MongoDB Atlas (Mongoose) · JWT auth (httpOnly cookie) · bcrypt.

## O'rnatish

1. Bog'liqliklarni o'rnating:
   ```bash
   npm install
   ```

2. Loyiha ildizida `.env.local` faylini yarating (`.env.example` dan nusxa oling) va to'ldiring:
   ```env
   MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/universal?retryWrites=true&w=majority
   JWT_SECRET=uzun-tasodifiy-maxfiy-satr
   ```
   > MongoDB Atlas'da **Network Access** bo'limida o'z IP'ingizni (yoki `0.0.0.0/0`) ruxsat etishni unutmang.

3. Ishga tushirish:
   ```bash
   npm run dev
   ```
   So'ng brauzerda `http://localhost:3000`.

4. Production:
   ```bash
   npm run build
   npm start
   ```

## Imkoniyatlar

### Ro'yxatdan o'tish / Kirish
- Ro'yxatdan o'tishda: **ism**, **nomer**, **username** (ixtiyoriy — bo'sh bo'lishi mumkin), **parol**.
- Kirish: nomer + parol. Sessiya 30 kun saqlanadi.

### Grind (vaqt boshqaruvi)
- 25 yoki 50 daqiqalik sessiya tanlanadi.
- Boshlash / To'xtatib turish (pauza) / Tugatish.
- Tugaganda animatsiya + ovozli signal (Web Audio, fayl kerak emas).
- Har bir sessiya bazaga saqlanadi.
- **Bugun / shu hafta / shu oy / jami** sarflangan vaqt statistikasi.

### Maqsadlar
- **Kunlik**, **oylik**, **yillik** rejalar (todo ko'rinishida, bajarilganini belgilash mumkin).
- Vaqt **Toshkent (UTC+5)** bo'yicha hisoblanadi.
- **Kunlik reja** faqat o'sha kuni tahrirlanadi; kun tugagach yopiladi (faqat ko'rish). Har bir kun o'z sanasi bilan saqlanadi va keyin istalgan vaqt ko'rish mumkin.
- **Oylik / yillik** rejani faqat joriy yoki kelajakdagi davr uchun qo'shish mumkin — **o'tib ketgan oy/yil uchun reja qo'shib bo'lmaydi**.
- Cheklovlar serverda ham tekshiriladi (faqat frontendda emas).

### Chat
- Foydalanuvchilarni ism / username / nomer bo'yicha qidirish.
- **Faqat matn** xabar yuborish. Xabarlar 4 soniyada bir yangilanadi.

### Kitoblar
- Hozircha "Tez orada qo'shiladi" sahifasi.

## Tuzilma
```
src/
  lib/        mongodb, auth (JWT/bcrypt), tashkent (vaqt mantiq)
  models/     User, Message, Session, Plan
  app/
    login, register
    dashboard/  (grind, goals, chat, books)
    api/        auth, grind, plans, users, messages
  components/  Sidebar
```
