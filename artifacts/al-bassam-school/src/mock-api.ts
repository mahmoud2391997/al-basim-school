const KEY = 'al-bassam-school-demo-v5';

type Row = Record<string, any> & { id: number };
type Store = Record<string, Row[]>;

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function generateSeedData(): Store {
  const rand = seededRandom(42);
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

  const grades = [
    'الأول ابتدائي', 'الثاني ابتدائي', 'الثالث ابتدائي', 'الرابع ابتدائي',
    'الخامس ابتدائي', 'السادس ابتدائي', 'الأول متوسط', 'الثاني متوسط',
    'الثالث متوسط', 'الأول ثانوي', 'الثاني ثانوي', 'الثالث ثانوي',
  ];
  const gradeEn = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
    'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8',
    'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
  ];
  const classes = ['أ', 'ب', 'ج', 'د'];
  const classEn = ['A', 'B', 'C', 'D'];

  const saudiFirstMale = ['محمد', 'أحمد', 'خالد', 'عبدالله', 'عمر', 'ياسر', 'فيصل', 'سلطان', 'ناصر', 'حسن', 'علي', 'ماجد', 'تركي', 'راشد', 'سعود'];
  const saudiLastMale = ['الحربي', 'القحطاني', 'المطيري', 'العتيبي', 'الشمري', 'الزهراني', 'الدوسري', 'الرشيدي', 'الغامدي', 'البقمي', 'القصيمي', 'النفيعي', 'الشهري', 'النعيمي', 'السهلي'];
  const saudiFirstFemale = ['فاطمة', 'نورة', 'سارة', 'منال', 'هدى', 'أريج', 'رنا', 'لمياء', 'ريم', 'عفاف', 'سمية', 'حنان', 'ليلى', 'مريم', 'نجلاء'];
  const saudiLastFemale = ['الحربي', 'القحطاني', 'المطيري', 'العتيبي', 'الشمري', 'الزهراني', 'الدوسري', 'الرشيدي', 'الغامدي', 'القصيمي'];

  const subjects = [
    { en: 'Mathematics', ar: 'الرياضيات' },
    { en: 'Arabic Language', ar: 'اللغة العربية' },
    { en: 'English Language', ar: 'اللغة الإنجليزية' },
    { en: 'Science', ar: 'العلوم' },
    { en: 'Islamic Studies', ar: 'التربية الإسلامية' },
    { en: 'Social Studies', ar: 'الدراسات الاجتماعية' },
    { en: 'Computer Science', ar: 'علوم الحاسب' },
    { en: 'Physical Education', ar: 'التربية البدنية' },
    { en: 'Art', ar: 'الفنون' },
    { en: 'Music', ar: 'الموسيقى' },
    { en: 'Geography', ar: 'الجغرافيا' },
    { en: 'History', ar: 'التاريخ' },
  ];

  const bookData = [
    { title: 'مختارات من القرآن الكريم', titleAr: 'مختارات من القرآن الكريم', author: 'مجموعة مؤلفين', authorAr: 'مجموعة مؤلفين', category: 'الدين', categoryEn: 'Religion', lang: 'Arabic' },
    { title: 'النحو والصرف', titleAr: 'النحو والصرف', author: 'إبراهيم الأنصاري', authorAr: 'إبراهيم الأنصاري', category: 'اللغة العربية', categoryEn: 'Arabic Language', lang: 'Arabic' },
    { title: 'رياضيات', titleAr: 'رياضيات', author: 'وزارة التعليم', authorAr: 'وزارة التعليم', category: 'الرياضيات', categoryEn: 'Mathematics', lang: 'Arabic' },
    { title: 'علوم', titleAr: 'علوم', author: 'وزارة التعليم', authorAr: 'وزارة التعليم', category: 'العلوم', categoryEn: 'Science', lang: 'Arabic' },
    { title: 'لسان العرب', titleAr: 'لسان العرب', author: 'ابن منظور', authorAr: 'ابن منظور', category: 'اللغة العربية', categoryEn: 'Arabic Language', lang: 'Arabic' },
    { title: 'الأتوبيس', titleAr: 'الأتوبيس', author: ' Antoine de Saint-Exupéry', authorAr: ' أنطوان دو سانت', category: 'الأدب', categoryEn: 'Literature', lang: 'French' },
    { title: 'The Prophet', titleAr: 'النبي', author: 'Kahlil Gibran', authorAr: 'خليل جبران', category: 'الأدب', categoryEn: 'Literature', lang: 'English' },
    { title: 'New Headway', titleAr: 'نيو هيدواي', author: 'Liz Soars', authorAr: 'ليز سورز', category: 'اللغة الإنجليزية', categoryEn: 'English Language', lang: 'English' },
    { title: 'عجائب الكون', titleAr: 'عجائب الكون', author: 'صالح بوضي', authorAr: 'صالح بوضي', category: 'العلوم', categoryEn: 'Science', lang: 'Arabic' },
    { title: 'تاريخ خالد', titleAr: 'تاريخ خالد', author: 'خالد حسيني', authorAr: 'خالد حسيني', category: 'التاريخ', categoryEn: 'History', lang: 'Arabic' },
    { title: ' محاضرات في الفلسفة', titleAr: 'محاضرات في الفلسفة', author: 'برتراند راسل', authorAr: 'برتراند راسل', category: 'فلسفة', categoryEn: 'Philosophy', lang: 'English' },
    { title: 'Dictionary of Arabic', titleAr: 'معجم عربي', author: 'Mustafa Haddad', authorAr: 'مصطفى حداد', category: 'اللغة العربية', categoryEn: 'Arabic Language', lang: 'Arabic' },
    { title: 'Our World', titleAr: 'عالمنا', author: 'Helen Andelin', authorAr: 'هيلن أنديلن', category: 'التربية', categoryEn: 'Education', lang: 'English' },
    { title: ' Ciencias Naturales', titleAr: ' علوم طبيعية', author: 'María García', authorAr: 'ماريا غارسيا', category: 'العلوم', categoryEn: 'Science', lang: 'Spanish' },
    { title: 'Cultura Islam', titleAr: ' ثقافة إسلامية', author: 'Ahmad Hasan', authorAr: 'أحمد حسن', category: 'التربية الإسلامية', categoryEn: 'Islamic Studies', lang: 'Arabic' },
    { title: 'Sadako and the Thousand Paper Cranes', titleAr: ' ساداكو والأوراق الورقية', author: 'Eleanor Coerr', authorAr: 'إلينور كور', category: 'الأدب', categoryEn: 'Literature', lang: 'English' },
    { title: 'Maths in Focus', titleAr: ' الرياضيات في التركيز', author: 'Sue Challenger', authorAr: 'سو تشالنجر', category: 'الرياضيات', categoryEn: 'Mathematics', lang: 'English' },
    { title: 'World of Science', titleAr: 'عالم العلوم', author: 'Edward O. Wilson', authorAr: 'إدوارد ويلسون', category: 'العلوم', categoryEn: 'Science', lang: 'English' },
    { title: 'The Elements', titleAr: 'العناصر', author: 'Theodore Gray', authorAr: 'ثيودور غراي', category: 'العلوم', categoryEn: 'Science', lang: 'English' },
    { title: 'Art of Problem Solving', titleAr: 'فن حل المسائل', author: 'Richard Rusczyk', authorAr: 'ريشارد روسجيك', category: 'الرياضيات', categoryEn: 'Mathematics', lang: 'English' },
    { title: 'Stories from the Quran', titleAr: 'قصص من القرآن', author: 'Mahmoud Masri', authorAr: 'محمود المصري', category: 'الدين', categoryEn: 'Religion', lang: 'Arabic' },
    { title: 'Modern Arabic Literature', titleAr: 'الأدب العربي الحديث', author: 'Mahmoud Darwish', authorAr: 'محمود درويش', category: 'الأدب', categoryEn: 'Literature', lang: 'Arabic' },
    { title: 'Geography of Arabia', titleAr: 'جغرافيا الجزيرة العربية', author: 'Saudi Press', authorAr: 'الصحافة السعودية', category: 'جغرافيا', categoryEn: 'Geography', lang: 'Arabic' },
    { title: 'Chemistry Basics', titleAr: 'أساسيات الكيمياء', author: 'Sara Ali', authorAr: 'سارة علي', category: 'العلوم', categoryEn: 'Science', lang: 'Arabic' },
    { title: 'Physics Principles', titleAr: 'مبادئ الفيزياء', author: 'Khalid Omar', authorAr: 'خالد عمر', category: 'العلوم', categoryEn: 'Science', lang: 'Arabic' },
    { title: 'Creative Writing', titleAr: 'الكتابة الإبداعية', author: 'Lina Mansour', authorAr: 'لينى منصور', category: 'الأدب', categoryEn: 'Literature', lang: 'English' },
    { title: 'Dictionary of Science', titleAr: 'معجم العلوم', author: 'Martin Sherwood', authorAr: 'مارتن شير وود', category: 'العلوم', categoryEn: 'Science', lang: 'English' },
    { title: 'Arabic Grammar', titleAr: 'نحو اللغة العربية', author: 'Ahmad Hassan', authorAr: 'أحمد حسن', category: 'اللغة العربية', categoryEn: 'Arabic Language', lang: 'Arabic' },
    { title: 'Algebra Essentials', titleAr: 'أساسيات الجبر', author: 'Faisal Al-Dosari', authorAr: 'فيصل الدوسري', category: 'الرياضيات', categoryEn: 'Mathematics', lang: 'Arabic' },
    { title: 'Biology Foundations', titleAr: 'أساسيات الأحياء', author: 'Nora Saeed', authorAr: 'نورة سعيد', category: 'العلوم', categoryEn: 'Science', lang: 'Arabic' },
    { title: 'English Grammar', titleAr: 'قواعد اللغة الإنجليزية', author: 'Raymond Murphy', authorAr: 'رايموند ميرفي', category: 'اللغة الإنجليزية', categoryEn: 'English Language', lang: 'English' },
    { title: 'Stories of Prophets', titleAr: 'قصص الأنبياء', author: 'Ibn Kathir', authorAr: 'ابن كثير', category: 'الدين', categoryEn: 'Religion', lang: 'Arabic' },
    { title: 'Islamic Jurisprudence', titleAr: 'الفقه الإسلامي', author: 'Abdulrahman Al-Jaziri', authorAr: 'عبدالرحمن الجزيري', category: 'التربية الإسلامية', categoryEn: 'Islamic Studies', lang: 'Arabic' },
    { title: 'Introduction to Computers', titleAr: 'مقدمة في الحاسب', author: 'Ahmad Al-Otaibi', authorAr: 'أحمد العتيبي', category: 'الحاسب', categoryEn: 'Computer Science', lang: 'Arabic' },
    { title: 'World History', titleAr: 'التاريخ العالمي', author: 'Will Durant', authorAr: 'ويل ديورانت', category: 'التاريخ', categoryEn: 'History', lang: 'English' },
    { title: 'Encyclopedia of Islam', titleAr: 'موسوعة الإسلام', author: 'Abd al-Aziz Duri', authorAr: 'عبد العزيز الدري', category: 'التربية الإسلامية', categoryEn: 'Islamic Studies', lang: 'Arabic' },
    { title: 'Roald Dahl Collection', titleAr: 'مجموعة روالد دال', author: 'Roald Dahl', authorAr: 'روالد دال', category: 'الأدب', categoryEn: 'Literature', lang: 'English' },
    { title: 'Famous Muslim Scientists', titleAr: 'علماء muslimon مشهورون', author: 'George Sarton', authorAr: 'جورج سارتن', category: 'التاريخ', categoryEn: 'History', lang: 'English' },
    { title: 'Arabic Poetry Anthology', titleAr: 'ديوان الشعر العربي', author: 'Various Authors', authorAr: 'مختلف المؤلفين', category: 'الأدب', categoryEn: 'Literature', lang: 'Arabic' },
    { title: 'Art and Design', titleAr: 'الفن والتصميم', author: 'Emily Brown', authorAr: 'إيميلي براون', category: 'الفنون', categoryEn: 'Art', lang: 'English' },
  ];

  const students: Row[] = [];
  const studentIdCounter = { value: 1 };
  for (let g = 0; g < grades.length; g++) {
      const studentsPerGrade = 100;
      for (let s = 0; s < studentsPerGrade; s++) {
        // Keep the demo directory exactly balanced: 50 boys and 50 girls per grade.
        const isFemale = s % 2 === 1;
      const firstName = isFemale ? pick(saudiFirstFemale) : pick(saudiFirstMale);
      const lastName = isFemale ? pick(saudiLastFemale) : pick(saudiLastMale);
      const id = studentIdCounter.value++;
      students.push({
        id,
        fullName: `${firstName} ${lastName}`,
        fullNameArabic: `${firstName} ${lastName}`,
        gender: isFemale ? 'female' : 'male',
        studentNumber: `AB-2025-${String(id).padStart(4, '0')}`,
        nationalId: String(1000000000 + id),
        grade: gradeEn[g],
        gradeArabic: grades[g],
        className: `${g + 1}${pick(classEn)}`,
        guardianName: `${isFemale ? pick(saudiFirstMale) : pick(saudiFirstMale)} ${lastName}`,
        guardianPhone: `05${between(10000000, 99999999)}`,
        enrollmentDate: `${between(2020, 2025)}-${String(between(1, 12)).padStart(2, '0')}-${String(between(1, 28)).padStart(2, '0')}`,
        status: rand() > 0.03 ? 'active' : 'inactive',
      });
    }
  }

  const teachers: Row[] = [];
  for (let t = 0; t < 65; t++) {
    const isFemale = rand() > 0.5;
    const firstName = isFemale ? pick(saudiFirstFemale) : pick(saudiFirstMale);
    const lastName = isFemale ? pick(saudiLastFemale) : pick(saudiLastMale);
    const subj = pick(subjects);
    teachers.push({
      id: t + 1,
      fullName: `${firstName} ${lastName}`,
      fullNameArabic: `${firstName} ${lastName}`,
      name: firstName,
      surname: lastName,
      username: `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, ''),
      englishName: `${firstName} ${lastName}`,
      employeeCode: `TCH-${String(t + 1).padStart(3, '0')}`,
      nationalId: String(100000000 + t),
      nationality: 'Saudi',
      gender: isFemale ? 'female' : 'male',
      maritalStatus: rand() > 0.4 ? 'married' : 'single',
      religion: 'Islam',
      phone: `05${between(10000000, 99999999)}`,
      email: `${firstName.toLowerCase()}@albassam.edu`,
      address: pick(['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina']),
      area: pick(['Al Olaya', 'Al Malqa', 'Al Hamra', 'Al Rawda', 'Al Andalus']),
      country: 'Saudi Arabia',
      height: isFemale ? between(155, 175) : between(168, 192),
      weight: isFemale ? between(50, 75) : between(65, 100),
      branch: pick(['Main', 'Branch A', 'Branch B']),
      academicLevel: pick(['Primary', 'Intermediate', 'Secondary']),
      subject: subj.en,
      subjectAr: subj.ar,
      weeklyClasses: between(12, 24),
      isEmployee: false,
      status: 'active',
    });
  }

  const employeeRoles = [
    { en: 'Librarian', ar: 'أمين المكتبة' },
    { en: 'Admin Assistant', ar: 'مساعد إداري' },
    { en: 'Accountant', ar: 'محاسب' },
    { en: 'Janitor', ar: 'عامل نظافة' },
    { en: 'Security Guard', ar: 'حارس أمن' },
    { en: 'IT Support', ar: 'دعم فني' },
    { en: 'Receptionist', ar: 'موظفة استقبال' },
    { en: 'School Nurse', ar: 'ممرضة المدرسة' },
    { en: 'Maintenance', ar: 'صيانة' },
    { en: 'Cafeteria Staff', ar: 'موظفة مطعم' },
    { en: 'Transport Coordinator', ar: 'منسق النقل' },
    { en: 'HR Officer', ar: 'مسؤول الموارد البشرية' },
  ];
  const departments = [
    { en: 'Library', ar: 'المكتبة' },
    { en: 'Admin', ar: 'الإدارة' },
    { en: 'Finance', ar: 'المالية' },
    { en: 'Maintenance', ar: 'الصيانة' },
    { en: 'Security', ar: 'الأمن' },
    { en: 'IT', ar: 'تقنية المعلومات' },
    { en: 'Reception', ar: 'الاستقبال' },
    { en: 'Health', ar: 'الصحة' },
    { en: 'Transport', ar: 'النقل' },
    { en: 'HR', ar: 'الموارد البشرية' },
    { en: 'Cafeteria', ar: 'المطعم' },
  ];

  const employees: Row[] = [];
  for (let e = 0; e < 22; e++) {
    const isFemale = rand() > 0.5;
    const firstName = isFemale ? pick(saudiFirstFemale) : pick(saudiFirstMale);
    const lastName = isFemale ? pick(saudiLastFemale) : pick(saudiLastMale);
    const role = pick(employeeRoles);
    const dept = departments[e % departments.length];
    employees.push({
      id: e + 1,
      fullName: `${firstName} ${lastName}`,
      fullNameArabic: `${firstName} ${lastName}`,
      employeeNumber: `EMP-${String(e + 1).padStart(3, '0')}`,
      nationalId: String(200000000 + e),
      jobTitle: role.en,
      jobTitleAr: role.ar,
      department: dept.en,
      departmentAr: dept.ar,
      phone: `05${between(10000000, 99999999)}`,
      email: `${firstName.toLowerCase()}@albassam.edu`,
      hireDate: `${between(2015, 2024)}-${String(between(1, 12)).padStart(2, '0')}-${String(between(1, 28)).padStart(2, '0')}`,
      status: 'active',
    });
  }

  const books: Row[] = [];
  let bookId = 1;
  for (const bd of bookData) {
    const copies = between(8, 25);
    const borrowed = between(0, Math.floor(copies * 0.3));
    const lost = rand() < 0.08 ? between(0, 2) : 0;
    const damaged = rand() < 0.05 ? between(0, 1) : 0;
    const available = Math.max(copies - borrowed - lost - damaged, 0);
    const bookStatus = lost > 0 ? 'lost' : damaged > 0 ? 'damaged' : 'available';
    const shelfRow = String.fromCharCode(65 + (bookId % 10));
    const shelfNum = String(bookId).padStart(2, '0');
    books.push({
      id: bookId,
      title: bd.title,
      titleAr: bd.titleAr,
      author: bd.author,
      authorAr: bd.authorAr,
      isbn: `978-${between(600, 999)}-${between(100000, 999999)}-${between(0, 9)}`,
      category: bd.categoryEn,
      categoryAr: bd.category,
      language: bd.lang,
      volume: rand() > 0.7 ? '1' : '',
      copies,
      availableCopies: available,
      lostCopies: lost,
      damagedCopies: damaged,
      dateAdded: `${between(2020, 2025)}-${String(between(1, 12)).padStart(2, '0')}-${String(between(1, 28)).padStart(2, '0')}`,
      depositNumber: `DEP-${String(bookId).padStart(3, '0')}`,
      status: bookStatus,
      publicationPlace: pick(['Riyadh', 'London', 'Cairo', 'Beirut', 'Damascus']),
      publicationDate: String(between(2015, 2025)),
      generalNumber: `GN-${String(bookId).padStart(3, '0')}`,
      specialNumber: '',
      description: '',
      coverImage: '',
      shelf: `${shelfRow}-${shelfNum}`,
    });
    bookId++;
  }

  const totalBookCopies = books.reduce((s, b) => s + b.copies, 0);
  const neededBorrows = between(350, 400);
  const borrows: Row[] = [];
  const activeStudentIds = students.filter((s) => s.status === 'active').map((s) => s.id);

  for (let i = 0; i < neededBorrows; i++) {
    const book = pick(books);
    if (book.availableCopies < 1) continue;
    const studentId = pick(activeStudentIds);
    const student = students.find((s) => s.id === studentId);
    const month = between(1, 12);
    const day = between(1, 28);
    const year = month >= 9 ? 2024 : 2025;
    const borrowDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dueDate = `${year}-${String(Math.min(month + 1, 12)).padStart(2, '0')}-${String(Math.min(day + 7, 28)).padStart(2, '0')}`;
    const isReturned = rand() < 0.55;
    const isLost = !isReturned && rand() < 0.08;
    const borrowerType = rand() < 0.85 ? 'student' : 'teacher';
    const borrowerId = borrowerType === 'student' ? studentId : pick(teachers).id;
    const borrowerName = borrowerType === 'student' ? (student?.fullName || 'Unknown') : pick(teachers).fullName;

    borrows.push({
      id: i + 1,
      bookId: book.id,
      bookTitle: book.title,
      bookBarcode: book.isbn,
      studentId: borrowerType === 'student' ? borrowerId : null,
      borrowerType,
      borrowerId,
      borrowerName,
      borrowedAt: borrowDate,
      dueDate,
      returnedAt: isReturned ? `${year}-${String(Math.min(month + (day > 20 ? 2 : 1), 12)).padStart(2, '0')}-${String(between(1, 28)).padStart(2, '0')}` : null,
      status: isReturned ? 'returned' : isLost ? 'lost' : 'active',
      condition: isLost ? 'lost' : isReturned ? 'good' : 'good',
    });
  }

  const activity: Row[] = [];
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const type = pick(['borrow', 'return', 'new_book']);
    const daysAgo = between(0, 20);
    const itemDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const dateStr = itemDate.toISOString().slice(0, 10);
    const hour = String(between(8, 15)).padStart(2, '0');
    const minute = String(between(0, 59)).padStart(2, '0');
    const student = pick(students);
    const book = pick(books);
    activity.push({
      id: i + 1,
      type,
      timestamp: `${dateStr}T${hour}:${minute}:00`,
      description: type === 'borrow' ? `${student.fullNameArabic || student.fullName} borrowed ${book.title}`
        : type === 'return' ? `${student.fullNameArabic || student.fullName} returned ${book.title}`
        : `New book added: ${book.title}`,
      details: type === 'borrow' ? { studentName: student.fullNameArabic || student.fullName, bookTitle: book.title }
        : type === 'return' ? { studentName: student.fullNameArabic || student.fullName, bookTitle: book.title }
        : { bookTitle: book.title },
    });
  }

  const attendance: Row[] = [];
  for (let i = 0; i < 50; i++) {
    const student = pick(students);
    attendance.push({
      id: i + 1,
      studentId: student.id,
      academicYearId: 2,
      attendanceDate: `2025-${String(between(1, 6)).padStart(2, '0')}-${String(between(1, 28)).padStart(2, '0')}`,
      status: rand() > 0.06 ? 'present' : 'absent',
      note: '',
    });
  }

  return {
    students,
    teachers,
    employees,
    books,
    borrows,
    'academic-years': [
      { id: 1, label: '2024 / 2025', startDate: '2024-09-01', endDate: '2025-06-30', isCurrent: false },
      { id: 2, label: '2025 / 2026', startDate: '2025-09-01', endDate: '2026-06-30', isCurrent: true },
    ],
    attendance,
    activity,
  };
}

const seed = generateSeedData();

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
function load(): Store { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : clone(seed); } catch { return clone(seed); } }
function save(store: Store) { localStorage.setItem(KEY, JSON.stringify(store)); }
function collection(path: string) { const parts = path.replace(/^\/api\//, '').split('/'); if (parts[0] === 'library') return parts[1] || 'books'; return parts[0]; }

export function createMockFetch(): typeof fetch {
  return async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, window.location.origin);
    const method = (init.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET')).toUpperCase();
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    const store = load();
    if (url.pathname === '/api/dashboard/summary') {
      const students = store.students.filter((row) => row.status === 'active');
      const present = store.attendance.filter((row) => row.status === 'present').length;
      const total = store.attendance.length;
      const totalBooks = store.books.reduce((sum, row) => sum + Number(row.copies || 0), 0);
      const availableBooks = store.books.reduce((sum, row) => sum + Number(row.availableCopies || 0), 0);
      const borrowedBooks = store.books.reduce((sum, row) => sum + Math.max(0, Number(row.copies || 0) - Number(row.availableCopies || 0) - Number(row.lostCopies || 0) - Number(row.damagedCopies || 0)), 0);
      return respond({ students: students.length, teachers: store.teachers.length, books: totalBooks, availableBooks, borrowedBooks, employees: store.employees.length, attendanceRate: total ? Math.round((present / total) * 1000) / 10 : 0, recentActivity: (store.activity || []).sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp)).slice(0, 10) });
    }
    const name = collection(url.pathname); const rows = store[name] || [];
    const match = url.pathname.match(/\/(\d+)$/); const id = match ? Number(match[1]) : undefined;
    const returnMatch = url.pathname.match(/\/api\/library\/borrows\/(\d+)\/return/); const returnId = returnMatch ? Number(returnMatch[1]) : undefined;
    if (returnId !== undefined && method === 'PATCH') {
      const bRows = store.borrows || [];
      const bIdx = bRows.findIndex((r) => r.id === returnId);
      if (bIdx < 0) return respond({ error: 'Record not found' }, 404);
      const bRow = bRows[bIdx];
      if (bRow.returnedAt) return respond({ error: 'This borrow was already returned' }, 409);
      const condition = body?.condition === 'damaged' || body?.condition === 'lost' ? body.condition : 'good';
      bRows[bIdx] = { ...bRow, returnedAt: new Date().toISOString().slice(0, 10), status: 'returned', condition };
      store.borrows = bRows;
      const bkRows = store.books || [];
      const bkIdx = bkRows.findIndex((b) => b.id === bRow.bookId);
      if (bkIdx >= 0) {
        const bk = bkRows[bkIdx];
        if (condition === 'good') {
          bkRows[bkIdx] = { ...bk, availableCopies: Math.min(bk.copies, (bk.availableCopies || 0) + 1) };
        } else if (condition === 'damaged') {
          bkRows[bkIdx] = { ...bk, damagedCopies: (bk.damagedCopies || 0) + 1 };
        } else {
          bkRows[bkIdx] = { ...bk, lostCopies: (bk.lostCopies || 0) + 1 };
        }
        store.books = bkRows;
      }
      save(store);
      return respond(bRows[bIdx]);
    }
    const conditionMatch = url.pathname.match(/\/api\/library\/books\/(\d+)\/condition/);
    if (conditionMatch && method === 'PATCH') {
      const bookId = Number(conditionMatch[1]);
      const bkRows = store.books || [];
      const bkIdx = bkRows.findIndex((b) => b.id === bookId);
      if (bkIdx < 0) return respond({ error: 'Book not found' }, 404);
      const bk = bkRows[bkIdx];
      const avail = bk.availableCopies || 0;
      const lost = bk.lostCopies || 0;
      const damaged = bk.damagedCopies || 0;
      const action = body?.action;
      if (action === 'lost') {
        if (avail < 1) return respond({ error: 'No copy is on the shelf to mark as lost' }, 409);
        bkRows[bkIdx] = { ...bk, availableCopies: avail - 1, lostCopies: lost + 1 };
      } else if (action === 'damaged') {
        if (avail < 1) return respond({ error: 'No copy is on the shelf to mark as damaged' }, 409);
        bkRows[bkIdx] = { ...bk, availableCopies: avail - 1, damagedCopies: damaged + 1 };
      } else if (action === 'found') {
        if (lost < 1) return respond({ error: 'There are no lost copies to restore' }, 409);
        bkRows[bkIdx] = { ...bk, availableCopies: avail + 1, lostCopies: lost - 1 };
      } else if (action === 'fixed') {
        if (damaged < 1) return respond({ error: 'There are no damaged copies to restore' }, 409);
        bkRows[bkIdx] = { ...bk, availableCopies: avail + 1, damagedCopies: damaged - 1 };
      } else {
        return respond({ error: 'Invalid condition action' }, 400);
      }
      store.books = bkRows;
      save(store);
      return respond(bkRows[bkIdx]);
    }
    if (name === 'borrows' && method === 'POST') {
      const bRows = store.borrows || [];
      const bkRows = store.books || [];
      const bkIdx = bkRows.findIndex((b) => b.id === body?.bookId);
      if (bkIdx < 0) return respond({ error: 'Book not found' }, 404);
      if ((bkRows[bkIdx].availableCopies || 0) <= 0) return respond({ error: 'No copies of this book are currently available' }, 409);
      const row = {
        ...body,
        id: Math.max(0, ...bRows.map((item) => item.id)) + 1,
        borrowedAt: body?.borrowedAt || new Date().toISOString(),
        returnedAt: body?.returnedAt ?? null,
        condition: body?.condition ?? 'good',
        bookTitle: bkRows[bkIdx].title,
        bookBarcode: bkRows[bkIdx].isbn,
      };
      bRows.push(row);
      store.borrows = bRows;
      bkRows[bkIdx] = { ...bkRows[bkIdx], availableCopies: (bkRows[bkIdx].availableCopies || 0) - 1 };
      store.books = bkRows;
      save(store);
      return respond(row, 201);
    }
    if (method === 'GET') {
      const search = url.searchParams.get('search')?.toLowerCase(); const status = url.searchParams.get('status');
      const active = url.searchParams.get('active');
      return respond(rows.filter((row) => (!search || JSON.stringify(row).toLowerCase().includes(search)) && (!status || row.status === status) && (active !== 'true' || !row.returnedAt)));
    }
    if (method === 'POST') { const row = { ...body, id: Math.max(0, ...rows.map((item) => item.id)) + 1 }; rows.push(row); store[name] = rows; save(store); return respond(row, 201); }
    if (id === undefined) return respond({ error: 'Record id is required' }, 400);
    const index = rows.findIndex((row) => row.id === id); if (index < 0) return respond({ error: 'Record not found' }, 404);
    if (method === 'DELETE') rows.splice(index, 1); else if (method === 'PATCH') rows[index] = { ...rows[index], ...body };
    store[name] = rows; save(store); return respond(method === 'DELETE' ? null : rows[index], method === 'DELETE' ? 204 : 200);
  };
}
function respond(data: unknown, status = 200) { return new Response(status === 204 ? null : JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } }); }
export function resetMockData() { localStorage.setItem(KEY, JSON.stringify(seed)); window.location.reload(); }
