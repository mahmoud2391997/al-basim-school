# نظام إدارة مدارس البسام الأهلية | Al-Bassam School Management System

<div align="center">

![Al-Bassam School Logo](./artifacts/al-bassam-school/public/al-bassam-logo-trim.png)

**منصة متكاملة وشاملة لإدارة العمليات المدرسية، شؤون الطلاب، الكادر التعليمي والإداري، ونظام إدارة المكتبة المتقدم.**  
*A comprehensive management platform for school operations, students, faculty, staff, and advanced library circulation.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Electron](https://img.shields.io/badge/Electron-Ready-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![RTL & LTR](https://img.shields.io/badge/Language-Arabic%20%7C%20English-263064)](https://github.com)

</div>

---

## 📑 جدول المحتويات / Table of Contents
- [نظرة عامة على النظام (Overview)](#-نظرة-عامة-على-النظام--overview)
- [المميزات والوحدات الرئيسية (Core Modules)](#-المميزات-والوحدات-الرئيسية--core-modules)
  - [1. لوحة التحكم والنبض المدرسي (Dashboard)](#1-لوحة-التحكم-والنبض-المدرسي--dashboard)
  - [2. إدارة شؤون الطلاب (Students Directory)](#2-إدارة-شؤون-الطلاب--students-directory)
  - [3. إدارة المعلمين وهيئة التدريس (Teachers)](#3-إدارة-المعلمين-وهيئة-التدريس--teachers)
  - [4. إدارة الكادر الإداري والموظفين (Staff & Employees)](#4-إدارة-الكادر-الإداري-والموظفين--staff--employees)
  - [5. نظام إدارة المكتبة المتقدم (Library System)](#5-نظام-إدارة-المكتبة-المتقدم--library-system)
  - [6. مركز التنبيهات والإشعارات الذكي (Notification Center)](#6-مركز-التنبيهات-والإشعارات-الذكي--notification-center)
  - [7. محرك البحث الشامل (Global Workspace Search ⌘K)](#7-محرك-البحث-الشامل--global-workspace-search-k)
  - [8. دعم ثنائي اللغة والاتجاه (RTL / LTR Engine)](#8-دعم-ثنائي-اللغة-والاتجاه--rtl--ltr-engine)
- [البنية التقنية (Tech Stack)](#-البنية-التقنية--tech-stack)
- [هيكل المشروع (Directory Structure)](#-هيكل-المشروع--directory-structure)
- [التثبيت والتشغيل (Installation & Setup)](#-التثبيت-والتشغيل--installation--setup)
- [بناء التطبيق والتوزيع المكتبي (Desktop & Web Build)](#-بناء-التطبيق-والتوزيع-المكتبي--desktop--web-build)

---

## 🌟 نظرة عامة على النظام / Overview

تم تصميم وتطوير نظام **مدارس البسام الأهلية** كحل برمجي عصري وسريع لإدارة كافة الأنشطة الأكاديمية والتشغيلية والمكتبية. يتميز النظام بواجهة تفاعلية ذات طابع مؤسسي أنيق مستوحى من الهوية البصرية للمدارس، مع دعم فائق للعمل كتطبيق ويب (Web App) أو تطبيق سطح مكتب مستقل (Desktop Electron Application) يعمل دون الحاجة الدائمة للاتصال بالإنترنت مع دعم قواعد البيانات المحلية السريعة (SQLite).

---

## 🚀 المميزات والوحدات الرئيسية / Core Modules

### 1. لوحة التحكم والنبض المدرسي (Dashboard)
- بطاقات إحصائية حية ومباشرة لحصر أعداد:
  - إجمالي الطلاب المقيدين.
  - المعلمون وأعضاء هيئة التدريس.
  - الموظفون الإداريون والتشغيليون.
  - إجمالي الكتب، العناوين الفريدة، النسخ المتاحة، والكتب المعارة والتالفة/المفقودة.
- سجل النشاط الأخير لعرض آخر العمليات والإعارات المسجلة لحظياً.
- رسوم بيانية وتوزيعات تفاعلية.

### 2. إدارة شؤون الطلاب (Students Directory)
- تسجيل بيانات الطلاب الكاملة (الاسم باللغة العربية والإنجليزية، الرقم الأكاديمي، الهوية الوطنية، الصف، الفصل، تاريخ التسجيل، وبيانات ولي الأمر).
- جداول متقدمة مع محاذاة دقيقة، فرز حسب كافة الأعمدة، وترقيم صفحات سريع (Pagination).
- استيراد وتصدير جماعي للطلاب عبر ملفات **Excel (XLSX)** مع التحقق التلقائي من صحة البيانات وتفادي التكرار.
- بطاقات وإحصائيات توزيع الطلاب على الصفوف والفصول المدرسية (Class Spread & Distribution).

### 3. إدارة المعلمين وهيئة التدريس (Teachers)
- دليل تفاعلي للمعلمين يشمل التخصص، المادة الدراسية، الكود الوظيفي، الهوية الوطنية، ورقم الاتصال.
- فلترة سريعة حسب المادة والتخصص مع تصدير القوائم.

### 4. إدارة الكادر الإداري والموظفين (Staff & Employees)
- شؤون الموظفين والإداريين، توزيع المسميات الوظيفية، وأرقام السجلات والاتصال.

### 5. نظام إدارة المكتبة المتقدم (Library System)
- **فهرس الكتب الشامل (Master Catalogue)**:
  - إدارة الكتب، العناوين الفريدة (Unique Titles)، أرقام الباركود / ISBN، والمؤلفين.
  - تتبع دقيق لعدد النسخ الإجمالي والنسخ المتاحة ونسخ الرفوف.
- **التصنيفات والرفوف (Categories & Shelves)**:
  - تصنيف الكتب حسب الموضوع واللغة ورقم الرف.
- **حركة الإعارة والإرجاع (Circulation & Borrows)**:
  - إعارة الكتب للطلاب أو المعلمين أو الموظفين مع تحديد موعد الاستحقاق ومسح الباركود السريع.
  - إرجاع الكتب مع تسجيل حالة النسخة المستلمة (**سليمة، تالفة، مفقودة**).
  - سجل الإعارات التاريخي (Borrow History) مع تتبع فترات التأخير والغرامات إن وجدت.
- **التقارير والإحصائيات (Reports & Analytics)**:
  - تقارير مخصصة للكتب الأكثر استعارة، الإعارات النشطة، المتأخرة، والكتب التالفة/المفقودة.
  - تصدير فوري لكافة التقارير إلى **Excel (XLSX)** و **Word (DOCX)** و **PDF**.

### 6. مركز التنبيهات والإشعارات الذكي (Notification Center)
- قائمة إشعارات منبثقة تفاعلية في الشريط العلوي ترصد:
  - **الإعارات المتأخرة (Overdue Alerts)**: تنبيهات باللون الأحمر مع احتساب أيام التأخير.
  - **مستحقة اليوم (Due Today)**: تنبيهات للإعارات المستحقة في نفس اليوم.
  - **تقترب من موعد الإرجاع (Due Soon)**: تنبيهات استباقية قبل انتهاء موعد الإعارة بـ 1-3 أيام.
  - **سجل الإرجاع والتلف**: إشعار عند إرجاع كتاب بحالة تالفة أو تسجيله كمفقود.
  - **نفاد النسخ**: تنبيه عند وصول النسخ المتاحة لكتاب معين إلى 0.
- إمكانية تحديد الإشعارات كمقروءة وتصفيتها حسب النوع مع الانتقال المباشر للسجل المعني.

### 7. محرك البحث الشامل (Global Workspace Search ⌘K)
- نافذة بحث عالمية سريعة تفتح بضغطة زر أو عبر الاختصار <kbd>⌘ K</kbd> / <kbd>Ctrl + K</kbd>.
- بحث فوري وموحّد يشمل: الكتب، الطلاب، المعلمين، الموظفين، الإعارات، وصفحات التنقل داخل النظام.
- فلاتر سريعة للنتائج وإمكانية التنقل المباشر عبر الأسهم ولوحة المفاتيح.

### 8. دعم ثنائي اللغة والاتجاه (RTL / LTR Engine)
- دعم كامل للتبديل الفوري بين **العربية (RTL)** و **الإنجليزية (LTR)** بدون الحاجة لإعادة تحميل الصفحة.
- ضبط تلقائي لاتجاه الواجهة، القوائم الجانبية، أزرار الإجراءات، الجداول، ومحاذاة النصوص.
- استخدام أرقى الخطوط العربية المعتمدة (**Cairo**, **Noto Kufi Arabic**, **IBM Plex Sans Arabic**) والإنجليزية (**Inter**, **DM Sans**).

---

## 🛠 البنية التقنية / Tech Stack

| الطبقة | التقنيات المستخدمة |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite |
| **Styling & Design** | Tailwind CSS v4, Radix UI Primitives, Lucide Icons |
| **Data Fetching & Cache** | TanStack Query (React Query v5) |
| **Routing** | Wouter |
| **File Import / Export** | SheetJS (XLSX), Docx, jsPDF, html2canvas, FileSaver |
| **Desktop Runtime** | Electron (v43+), electron-builder |
| **Database & Local Storage** | Better-SQLite3, LocalStorage Engine, Mock/REST API Client |

---

## 📁 هيكل المشروع / Directory Structure

```text
GrippingInterestingActivemovie/
├── artifacts/
│   └── al-bassam-school/               # كود تطبيق الواجهة والسطح المكتبي
│       ├── public/                     # الشعارات والأيقونات والخطوط الثابتة
│       ├── electron/                   # ملفات تكوين Electron للتشغيل المكتبي
│       │   ├── main.cjs                # العملية الرئيسية لـ Electron
│       │   └── build.cjs               # سكربت حزم التطبيق
│       ├── src/
│       │   ├── components/             # المكونات المشتركة
│       │   │   ├── ui/                 # مكونات واجهة المستخدم (Radix UI)
│       │   │   ├── global-search-dialog.tsx  # البحث الشامل ⌘K
│       │   │   ├── notifications-menu.tsx    # مركز الإشعارات الذكي
│       │   │   ├── user-nav-dropdown.tsx     # قائمة المستخدم وإعدادات اللغة
│       │   │   └── import-dialog.tsx         # نافذة استيراد Excel
│       │   ├── App.tsx                 # التطبيق الرئيسي، المسارات، والجداول
│       │   ├── main.tsx                # نقطة الانطلاق وإعداد الجذر
│       │   ├── mock-api.ts             # محاكي الخادم والبيانات المدمجة
│       │   └── index.css               # المتغيرات، الخطوط، وقواعد RTL/LTR
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── package.json
└── README.md
```

---

## 💻 التثبيت والتشغيل / Installation & Setup

### المتطلبات الأساسية (Prerequisites)
- تثبيت [Node.js](https://nodejs.org/) (الإصدار 18 أو أحدث).
- مدير الحزم `npm` أو `pnpm`.

### خطوات التشغيل المحلي (Web Dev Server)
1. تثبيت الحزم والمكتبات:
   ```bash
   cd artifacts/al-bassam-school
   npm install
   ```

2. بدء خادم التطوير:
   ```bash
   npm run dev
   ```
   سيتم فتح التطبيق محلياً على: `http://localhost:24438/` (أو المنفذ المحدد في مخرجات الطرفية).

---

## 📦 بناء التطبيق والتوزيع المكتبي / Desktop & Web Build

### 1. بناء نسخة الويب (Web Production Build)
```bash
npm run build
```
تُحفظ الملفات الجاهزة للنشر في المجلد `dist/public`.

### 2. تشغيل نسخة سطح المكتب للمطورين (Electron Desktop Dev)
```bash
npm run desktop:dev
```

### 3. إنشاء ملف التثبيت المكتبي لنظام Windows (Setup & Portable EXE)
```bash
npm run desktop:build
```
سيقوم المجمع بإنشاء ملفات التثبيت بصيغة `NSIS Setup (.exe)` و `Portable (.exe)` في مجلد `release/`.

---

## 🔒 إعدادات الأمان وتسجيل الدخول / Security & Auth

- النظام مزود ببوابة حماية (Auth Gate) وكلمة مرور افتراضية لحماية لوحة الإدارة.
- يدعم النظام تغيير وتحديث كلمة المرور من تبويب الإعدادات (Settings) مع تشفير جلسة الدخول محلياً عبر `Bearer Tokens`.

---

## 📄 الترخيص وحقوق الملكية / License & Copyright

جميع الحقوق محفوظة © **مدارس البسام الأهلية**  
*Al-Bassam Schools Management System — All Rights Reserved.*
