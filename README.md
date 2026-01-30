# OUT Town | اوت تاون - Website

طريقة التشغيل محلياً:

1. انسخ الملفات أعلاه إلى مجلد مشروع جديد.
2. ضع صورة الخلفية في public/hero-bg.jpg (يمكن استخدام نفس صورة الهيرو التي تملكها).
3. انسخ `.env.example` إلى `.env` واملأ القيم:
   - CLIENT_ID, CLIENT_SECRET, REDIRECT_URI (مثال: https://your-domain.com/callback أو http://localhost:3000/callback)
   - BOT_CLIENT_ID و SESSION_SECRET
4. ثبّت الحزم:
   npm install
5. شغّل السيرفر:
   npm start
6. افتح المتصفح على http://localhost:3000

ملاحظات:
- لا ترفع ملف .env إلى المستودع العام.
- لتغيير الشعار الموجود في أعلى يمين الصفحة (لو أردت)، ضع ملف شعار باسم مناسب في public واستبدل الرابط في layout.ejs أو أضف عنصر صورة هناك.
