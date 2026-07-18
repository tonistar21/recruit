/**
 * АСУ "Рекрут+" - Модуль даних та імітації БД у localStorage
 */

// Статуси та бейджи
const STATUS_META = {
  'Новий': { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', name: 'Новий' },
  'Співбесіда': { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', name: 'Співбесіда' },
  'Перевірка док.': { color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', name: 'Перевірка док.' },
  'Тестування': { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', name: 'Тестування' },
  'Рекомендовано': { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', name: 'Рекомендовано' },
  'Відхилено': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', name: 'Відхилено' },
  'Архів': { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)', name: 'Архів' }
};

// Перелік етапів відбору
const STAGES = [
  'Первинна реєстрація',
  'Перевірка документів',
  'Професійне тестування',
  'Співбесіда з психологом',
  'Медична комісія',
  'Рекомендовано',
  'Очікування наказу',
  'Зараховано',
  'Відхилено'
];

// Документи типів
const DOCUMENT_TYPES = [
  'Паспорт',
  'ІПН',
  'Диплом',
  'Медична довідка',
  'Інші документи'
];

// Матриця прав за замовчуванням
const DEFAULT_PERMISSIONS_MATRIX = {
  'Перегляд кандидатів': { 'Адміністратор': true, 'Рекрутер': true, 'Керівник': true, 'Оператор': true },
  'Створення анкет': { 'Адміністратор': true, 'Рекрутер': true, 'Керівник': false, 'Оператор': true },
  'Редагування анкет': { 'Адміністратор': true, 'Рекрутер': true, 'Керівник': false, 'Оператор': false },
  'Видалення анкет': { 'Адміністратор': true, 'Рекрутер': false, 'Керівник': false, 'Оператор': false },
  'Завантаження документів': { 'Адміністратор': true, 'Рекрутер': true, 'Керівник': false, 'Оператор': true },
  'Зміна статусів': { 'Адміністратор': true, 'Рекрутер': true, 'Керівник': false, 'Оператор': false },
  'Перегляд аналітики': { 'Адміністратор': true, 'Рекрутер': true, 'Керівник': true, 'Оператор': false },
  'Управління користувачами': { 'Адміністратор': true, 'Рекрутер': false, 'Керівник': false, 'Оператор': false },
  'Перегляд журналу дій': { 'Адміністратор': true, 'Рекрутер': false, 'Керівник': false, 'Оператор': false },
  'Експорт звітів': { 'Адміністратор': true, 'Рекрутер': true, 'Керівник': true, 'Оператор': false }
};

// Демо-дані кандидатів
const DEMO_CANDIDATES = [
  {
    id: 'C-1024',
    lastName: 'Коваленко',
    firstName: 'Олександр',
    middleName: 'Петрович',
    fullName: 'Коваленко Олександр Петрович',
    birthDate: '1992-06-15',
    gender: 'Чоловіча',
    ipn: '3245678901',
    phone: '+380671234567',
    email: 'kovalenko.o@gmail.com',
    region: 'Київська',
    city: 'Київ',
    address: 'вул. Хрещатик, 15, кв. 4',
    educationLevel: 'Вища',
    institution: 'Київський національний університет ім. Т. Шевченка',
    speciality: 'Кібербезпека',
    workExperience: '7 років у системному адмініструванні',
    militaryExperience: 'Військова кафедра',
    desiredUnit: 'Сили безпілотних систем (СБС)',
    status: 'Співбесіда',
    stage: 'Співбесіда з психологом',
    createdAt: '2024-03-10T11:20:00Z',
    updatedAt: '2024-03-21T11:45:22Z',
    documents: [
      { id: 'D-501', type: 'Паспорт', fileName: 'passport_kovalenko.pdf', uploadDate: '2024-03-10', uploadedBy: 'Петренко Олексій', status: 'Підтверджено' },
      { id: 'D-502', type: 'ІПН', fileName: 'ipn_kovalenko.pdf', uploadDate: '2024-03-10', uploadedBy: 'Петренко Олексій', status: 'Підтверджено' },
      { id: 'D-503', type: 'Диплом', fileName: 'diploma_kovalenko.pdf', uploadDate: '2024-03-12', uploadedBy: 'Петренко Олексій', status: 'Підтверджено' }
    ],
    history: [
      { datetime: '2024-03-10 11:20:00', user: 'Петренко Олексій', comment: 'Первинна реєстрація кандидата.' },
      { datetime: '2024-03-12 14:00:00', user: 'Іванов Сергій', comment: 'Документи перевірено та успішно верифіковано.' },
      { datetime: '2024-03-15 10:30:00', user: 'Іванов Сергій', comment: 'Успішно складено професійне тестування.' },
      { datetime: '2024-03-21 11:45:22', user: 'Петренко Олексій', comment: 'Призначено співбесіду з військовим психологом.' }
    ]
  },
  {
    id: 'C-1025',
    lastName: 'Сидоренко',
    firstName: 'Марія',
    middleName: 'Іванівна',
    fullName: 'Сидоренко Марія Іванівна',
    birthDate: '1995-12-04',
    gender: 'Жіноча',
    ipn: '3487654321',
    phone: '+380509876543',
    email: 'sydorenko.m@ukr.net',
    region: 'Львівська',
    city: 'Львів',
    address: 'просп. Свободи, 24, кв. 12',
    educationLevel: 'Вища (магістр)',
    institution: 'Львівська Політехніка',
    speciality: 'Фармація / Військова медицина',
    workExperience: '4 роки роботи бойовим медиком-волонтером',
    militaryExperience: 'Курси тактичної медицини (TCCC MP)',
    desiredUnit: 'Медична служба (Сили ТрО)',
    status: 'Перевірка док.',
    stage: 'Перевірка диплому',
    createdAt: '2024-03-12T09:15:00Z',
    updatedAt: '2024-03-21T11:40:10Z',
    documents: [
      { id: 'D-504', type: 'Паспорт', fileName: 'passport_sydorenko.pdf', uploadDate: '2024-03-12', uploadedBy: 'Іванов Сергій', status: 'Підтверджено' },
      { id: 'D-505', type: 'Диплом', fileName: 'medical_diploma.pdf', uploadDate: '2024-03-21', uploadedBy: 'Іванов Сергій', status: 'Очікує перевірки' }
    ],
    history: [
      { datetime: '2024-03-12 09:15:00', user: 'Іванов Сергій', comment: 'Створення нової анкети кандидата.' },
      { datetime: '2024-03-21 11:40:10', user: 'Іванов Сергій', comment: 'Завантажено медичний диплом для верифікації спеціальності.' }
    ]
  },
  {
    id: 'C-1026',
    lastName: 'Мельник',
    firstName: 'Дмитро',
    middleName: 'Сергійович',
    fullName: 'Мельник Дмитро Сергійович',
    birthDate: '1989-03-22',
    gender: 'Чоловіча',
    ipn: '3156444556',
    phone: '+380634445566',
    email: 'd.melnyk@outlook.com',
    region: 'Одеська',
    city: 'Одеса',
    address: 'вул. Дерибасівська, 8, кв. 19',
    educationLevel: 'Середня спеціальна',
    institution: 'Одеський морехідний коледж',
    speciality: 'Судноводіння',
    workExperience: '10 років роботи на торговельних суднах',
    militaryExperience: 'Немає',
    desiredUnit: 'Військово-Морські Сили (ВМС)',
    status: 'Новий',
    stage: 'Первинна реєстрація',
    createdAt: '2024-03-20T16:40:00Z',
    updatedAt: '2024-03-20T16:40:00Z',
    documents: [
      { id: 'D-506', type: 'Паспорт', fileName: 'passport_melnyk.pdf', uploadDate: '2024-03-20', uploadedBy: 'Сидоренко Г.О.', status: 'Очікує перевірки' }
    ],
    history: [
      { datetime: '2024-03-20 16:40:00', user: 'Сидоренко Г.О.', comment: 'Первинна реєстрація на сайті рекрутингового центру.' }
    ]
  },
  {
    id: 'C-1027',
    lastName: 'Бондар',
    firstName: 'Андрій',
    middleName: 'Вікторович',
    fullName: 'Бондар Андрій Вікторович',
    birthDate: '1994-11-11',
    gender: 'Чоловіча',
    ipn: '3311122233',
    phone: '+380991112233',
    email: 'andriy.bondar@icloud.com',
    region: 'Дніпропетровська',
    city: 'Дніпро',
    address: 'просп. Яворницького, 102, кв. 77',
    educationLevel: 'Вища',
    institution: 'Дніпровський національний університет',
    speciality: 'Радіотехніка',
    workExperience: 'Інженер зв\'язку, розробка та обслуговування РЕБ рішень',
    militaryExperience: 'Служба за контрактом (2 роки), лейтенант запасу',
    desiredUnit: 'Сили територіальної оборони (РЕБ/РЕР)',
    status: 'Рекомендовано',
    stage: 'Очікування наказу',
    createdAt: '2024-02-28T10:00:00Z',
    updatedAt: '2024-03-18T15:30:00Z',
    documents: [
      { id: 'D-507', type: 'Паспорт', fileName: 'passport_bondar.pdf', uploadDate: '2024-02-28', uploadedBy: 'Петренко Олексій', status: 'Підтверджено' },
      { id: 'D-508', type: 'Диплом', fileName: 'andriy_diploma.pdf', uploadDate: '2024-02-28', uploadedBy: 'Петренко Олексій', status: 'Підтверджено' },
      { id: 'D-509', type: 'Медична довідка', fileName: 'vlk_bondar_pass.pdf', uploadDate: '2024-03-15', uploadedBy: 'Петренко Олексій', status: 'Підтверджено' }
    ],
    history: [
      { datetime: '2024-02-28 10:00:00', user: 'Петренко Олексій', comment: 'Реєстрація та завантаження перших документів.' },
      { datetime: '2024-03-05 11:15:00', user: 'Іванов Сергій', comment: 'Тестування профпридатності - 145 балів з 150.' },
      { datetime: '2024-03-10 16:00:00', user: 'Петренко Олексій', comment: 'Успішне проходження ВЛК. Кандидат придатний.' },
      { datetime: '2024-03-18 15:30:00', user: 'Петренко Олексій', comment: 'Погоджено командуванням бригади. Очікуємо на наказ Генштабу.' }
    ]
  },
  {
    id: 'C-1028',
    lastName: 'Ткаченко',
    firstName: 'Олена',
    middleName: 'Василівна',
    fullName: 'Ткаченко Олена Василівна',
    birthDate: '1997-09-18',
    gender: 'Жіноча',
    ipn: '3577788899',
    phone: '+380677778899',
    email: 'olena.tkachenko@recruit.gov.ua',
    region: 'Харківська',
    city: 'Харків',
    address: 'вул. Сумська, 45, кв. 11',
    educationLevel: 'Вища (бакалавр)',
    institution: 'Харківський авіаційний інститут (ХАІ)',
    speciality: 'Авіоніка та БПЛА',
    workExperience: 'Інструктор у школі пілотування Дронів',
    militaryExperience: 'Немає',
    desiredUnit: 'Аеророзвідка (Сили безпілотних систем)',
    status: 'Тестування',
    stage: 'Професійне тестування',
    createdAt: '2024-03-14T14:30:00Z',
    updatedAt: '2024-03-19T13:20:00Z',
    documents: [
      { id: 'D-510', type: 'Паспорт', fileName: 'passport_tkachenko.pdf', uploadDate: '2024-03-14', uploadedBy: 'Коваленко В.', status: 'Підтверджено' },
      { id: 'D-511', type: 'Диплом', fileName: 'diploma_aviation.pdf', uploadDate: '2024-03-14', uploadedBy: 'Коваленко В.', status: 'Підтверджено' }
    ],
    history: [
      { datetime: '2024-03-14 14:30:00', user: 'Коваленко В.', comment: 'Створення анкети кандидата.' },
      { datetime: '2024-03-19 13:20:00', user: 'Іванов Сергій', comment: 'Успішно пройдено первинний етап перевірки СБ.' }
    ]
  }
];

// Дефолтні користувачі системи
const DEFAULT_USERS = [
  { id: 'U-301', name: 'Майор Петренко О.', email: 'petrenko@recruit.gov.ua', role: 'Адміністратор', status: 'Активний', lastLogin: '2026-05-19 09:15', department: 'Головне управління рекрутингу' },
  { id: 'U-302', name: 'Капітан Іванов С.', email: 'ivanov@recruit.gov.ua', role: 'Рекрутер', status: 'Активний', lastLogin: '2026-05-19 10:30', department: 'Львівський ЦР' },
  { id: 'U-303', name: 'Полковник Козак Д.', email: 'kozak@recruit.gov.ua', role: 'Керівник', status: 'Активний', lastLogin: '2026-05-18 17:05', department: 'Київський регіональний штаб' },
  { id: 'U-304', name: 'Старшина Сидоренко Г.', email: 'sydorenko.g@recruit.gov.ua', role: 'Оператор', status: 'Активний', lastLogin: '2026-05-19 14:12', department: 'Одеський відділ рекрутингу' },
  { id: 'U-305', name: 'Молодший сержант Коваленко В.', email: 'kovalenko.v@recruit.gov.ua', role: 'Оператор', status: 'Деактивований', lastLogin: '2026-05-10 11:34', department: 'Харківський ЦР' }
];

// Демо-журнал дій системних користувачів
const DEFAULT_LOGS = [
  { id: 'L-101', datetime: '2026-05-19 21:05:12', user: 'Майор Петренко О.', action: 'Зміна статусу', object: 'Кандидат C-1024 (Коваленко О.П.)', result: 'УСПІХ', ip: '192.168.1.45' },
  { id: 'L-102', datetime: '2026-05-19 21:00:10', user: 'Капітан Іванов С.', action: 'Завантаження документа', object: 'Кандидат C-1025 (Сидоренко М.І.)', result: 'УСПІХ', ip: '192.168.2.12' },
  { id: 'L-103', datetime: '2026-05-19 20:34:55', user: 'Майор Петренко О.', action: 'Перегляд аналітики', object: 'Системний звіт за березень', result: 'УСПІХ', ip: '192.168.1.45' },
  { id: 'L-104', datetime: '2026-05-19 19:42:11', user: 'Старшина Сидоренко Г.', action: 'Створення анкети', object: 'Кандидат C-1026 (Мельник Д.С.)', result: 'УСПІХ', ip: '192.168.3.111' },
  { id: 'L-105', datetime: '2026-05-19 18:05:00', user: 'Капітан Іванов С.', action: 'Оновлення дозволів', object: 'Зміна матриці ролей', result: 'ВІДХИЛЕНО (Немає прав)', ip: '192.168.2.12' }
];

// Дефолтні налаштування системи
const DEFAULT_SETTINGS = {
  systemName: 'АСУ "Рекрут+"',
  organization: 'Міністерство оборони України / ЗСУ',
  backupPeriod: 'Щодня о 03:00',
  twoFactor: true,
  sessionTimeout: '60 хвилин',
  interfaceLanguage: 'Українська'
};

// Поточний користувач за замовчуванням
const CURRENT_USER_MOCK = {
  name: 'Майор Петренко О.',
  role: 'Адміністратор', // Може змінюватись динамічно для тестування RBAC
  email: 'petrenko@recruit.gov.ua',
  avatarInitials: 'МП'
};

/**
 * Ініціалізація або отримання даних з localStorage
 */
function getStorageData(key, fallback) {
  const data = localStorage.getItem(key);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Помилка зчитування з localStorage:", e);
    }
  }
  localStorage.setItem(key, JSON.stringify(fallback));
  return fallback;
}

function setStorageData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Сховища в localStorage
let candidates = [];
let users = [];
let logs = [];
let settings = {};
let permissionsMatrix = {};
let currentUser = null;

function initDatabase() {
  candidates = getStorageData('rp_candidates', DEMO_CANDIDATES);
  users = getStorageData('rp_users', DEFAULT_USERS);
  logs = getStorageData('rp_logs', DEFAULT_LOGS);
  settings = getStorageData('rp_settings', DEFAULT_SETTINGS);
  permissionsMatrix = getStorageData('rp_permissions', DEFAULT_PERMISSIONS_MATRIX);
  currentUser = getStorageData('rp_current_user', CURRENT_USER_MOCK);
}

// Ініціалізувати одразу при імпорті файлу
initDatabase();

/**
 * Допоміжні функції роботи з АСУ
 */
const DB = {
  getCandidates: () => {
    initDatabase();
    return candidates;
  },

  setCandidates: (newCandidates) => {
    candidates = newCandidates;
    setStorageData('rp_candidates', candidates);
  },

  getCandidateById: (id) => {
    return DB.getCandidates().find(c => c.id === id);
  },

  addCandidate: (cData) => {
    const all = DB.getCandidates();
    
    // Створення унікального ID виду C-XXXX
    let maxId = 1028;
    all.forEach(c => {
      const num = parseInt(c.id.replace('C-', ''));
      if (!isNaN(num) && num > maxId) maxId = num;
    });
    const newId = `C-${maxId + 1}`;

    const nowStr = new Date().toISOString();
    const formattedDate = nowStr.substring(0, 10);

    const newCandidate = {
      id: newId,
      lastName: cData.lastName,
      firstName: cData.firstName,
      middleName: cData.middleName || '',
      fullName: `${cData.lastName} ${cData.firstName} ${cData.middleName || ''}`.trim(),
      birthDate: cData.birthDate,
      gender: cData.gender,
      ipn: cData.ipn,
      phone: cData.phone,
      email: cData.email,
      region: cData.region,
      city: cData.city,
      address: cData.address || '',
      educationLevel: cData.educationLevel,
      institution: cData.institution,
      speciality: cData.speciality,
      workExperience: cData.workExperience || '',
      militaryExperience: cData.militaryExperience || '',
      desiredUnit: cData.desiredUnit || 'Не визначено',
      status: 'Новий',
      stage: 'Первинна реєстрація',
      createdAt: nowStr,
      updatedAt: nowStr,
      documents: cData.documents || [],
      history: [
        { datetime: nowStr.replace('T', ' ').substring(0,19), user: currentUser.name, comment: 'Первинна реєстрація нового кандидата в системі.' }
      ]
    };

    all.unshift(newCandidate); // Додати першим в список для зручності
    DB.setCandidates(all);

    DB.logAction('Створення анкет', `Створено кандидата ${newId} (${newCandidate.fullName})`, 'УСПІХ');
    return newCandidate;
  },

  updateCandidate: (id, cData) => {
    const list = DB.getCandidates();
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      const original = list[idx];
      const nowStr = new Date().toISOString();

      // Оновити дані
      const updated = {
        ...original,
        ...cData,
        fullName: `${cData.lastName || original.lastName} ${cData.firstName || original.firstName} ${cData.middleName !== undefined ? cData.middleName : original.middleName}`.trim(),
        updatedAt: nowStr
      };

      // Додати запис про оновлення
      updated.history.unshift({
        datetime: nowStr.replace('T', ' ').substring(0,19),
        user: currentUser.name,
        comment: 'Анкетні дані кандидата відредаговано адміністратором.'
      });

      list[idx] = updated;
      DB.setCandidates(list);

      DB.logAction('Редагування анкет', `Оновлено дані кандидата ${id}`, 'УСПІХ');
      return updated;
    }
    return null;
  },

  deleteCandidate: (id) => {
    const list = DB.getCandidates();
    const target = list.find(c => c.id === id);
    if (!target) return false;

    // Замість повного видалення маркуємо як Архів
    const updatedList = list.filter(c => c.id !== id);
    
    // Якщо хочемо зберегти кадидата але видалити:
    // User wants "видалення/архів":
    // У списку робимо видалення або змінюємо статус на "Архів". Перенесемо в Архів
    target.status = 'Архів';
    target.stage = 'Відхилено';
    target.updatedAt = new Date().toISOString();
    target.history.unshift({
      datetime: new Date().toISOString().replace('T', ' ').substring(0,19),
      user: currentUser.name,
      comment: 'Кандидата перенесено в архів.'
    });

    // Давайте залишимо кандидата у списку але зі статусом "Архів", або видалимо за вибором
    // Реальне видалення з інтерфейсу:
    const remaining = list.filter(c => c.id !== id);
    DB.setCandidates(remaining);

    DB.logAction('Видалення анкет', `Видалено кандидата ${id} (${target.fullName}) з бази даних`, 'УСПІХ');
    return true;
  },

  updateCandidateStage: (id, newStage) => {
    const list = DB.getCandidates();
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      const original = list[idx];
      const nowStr = new Date().toISOString();

      // Автоматичне визначення статусу за етапом
      let newStatus = original.status;
      if (newStage === 'Первинна реєстрація') newStatus = 'Новий';
      else if (newStage === 'Перевірка документів') newStatus = 'Перевірка док.';
      else if (newStage === 'Професійне тестування') newStatus = 'Тестування';
      else if (newStage === 'Співбесіда з психологом') newStatus = 'Співбесіда';
      else if (newStage === 'Медична комісія') newStatus = 'Тестування';
      else if (newStage === 'Рекомендовано' || newStage === 'Очікування наказу' || newStage === 'Зараховано') newStatus = 'Рекомендовано';
      else if (newStage === 'Відхилено') newStatus = 'Відхилено';

      const updated = {
        ...original,
        status: newStatus,
        stage: newStage,
        updatedAt: nowStr
      };

      updated.history.unshift({
        datetime: nowStr.replace('T', ' ').substring(0,19),
        user: currentUser.name,
        comment: `Зміна етапу відбору з "${original.stage}" на "${newStage}". Статус: "${newStatus}".`
      });

      list[idx] = updated;
      DB.setCandidates(list);

      DB.logAction('Зміна статусів', `Змінено статус кандидата ${id} на [${newStatus} - ${newStage}]`, 'УСПІХ');
      return updated;
    }
    return null;
  },

  addCandidateDocument: (candidateId, docType, fileName) => {
    const list = DB.getCandidates();
    const idx = list.findIndex(c => c.id === candidateId);
    if (idx !== -1) {
      const original = list[idx];
      const nowStr = new Date().toISOString();
      const docId = `D-${Math.floor(Math.random() * 9000) + 1000}`;

      const newDoc = {
        id: docId,
        type: docType,
        fileName: fileName,
        uploadDate: nowStr.substring(0, 10),
        uploadedBy: currentUser.name,
        status: 'Очікує перевірки'
      };

      original.documents.push(newDoc);
      original.updatedAt = nowStr;
      original.history.unshift({
        datetime: nowStr.replace('T', ' ').substring(0,19),
        user: currentUser.name,
        comment: `Завантажено новий документ: ${docType} "${fileName}".`
      });

      list[idx] = original;
      DB.setCandidates(list);

      DB.logAction('Завантаження документів', `Завантажено документ "${docType}" для ${candidateId}`, 'УСПІХ');
      return newDoc;
    }
    return null;
  },

  updateDocumentStatus: (candidateId, docId, newStatus) => {
    const list = DB.getCandidates();
    const idx = list.findIndex(c => c.id === candidateId);
    if (idx !== -1) {
      const original = list[idx];
      const docIdx = original.documents.findIndex(d => d.id === docId);
      if (docIdx !== -1) {
        const doc = original.documents[docIdx];
        const oldStatus = doc.status;
        doc.status = newStatus;
        
        const nowStr = new Date().toISOString();
        original.updatedAt = nowStr;
        original.history.unshift({
          datetime: nowStr.replace('T', ' ').substring(0,19),
          user: currentUser.name,
          comment: `Статус документа "${doc.type}" змінено з "${oldStatus}" на "${newStatus}".`
        });

        list[idx] = original;
        DB.setCandidates(list);

        DB.logAction('Зміна статусів', `Оновлено статус документа ${docId} кандидата ${candidateId} на "${newStatus}"`, 'УСПІХ');
        return doc;
      }
    }
    return null;
  },

  deleteDocument: (candidateId, docId) => {
    const list = DB.getCandidates();
    const idx = list.findIndex(c => c.id === candidateId);
    if (idx !== -1) {
      const original = list[idx];
      const doc = original.documents.find(d => d.id === docId);
      if (doc) {
        original.documents = original.documents.filter(d => d.id !== docId);
        const nowStr = new Date().toISOString();
        original.updatedAt = nowStr;
        original.history.unshift({
          datetime: nowStr.replace('T', ' ').substring(0,19),
          user: currentUser.name,
          comment: `Видалено документ "${doc.type}" (${doc.fileName}).`
        });

        list[idx] = original;
        DB.setCandidates(list);

        DB.logAction('Завантаження документів', `Вилучено документ ${docId} у кандидата ${candidateId}`, 'УСПІХ');
        return true;
      }
    }
    return false;
  },

  /**
   * Журнал системних дій
   */
  getLogs: () => {
    initDatabase();
    // Сортуємо свіжіші зверху
    return logs.sort((a,b) => new Date(b.datetime) - new Date(a.datetime));
  },

  logAction: (actionType, objectInfo, resultStatus = 'УСПІХ') => {
    initDatabase();
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // Імітація IP адреси для логу
    const ipList = ['192.168.1.45', '192.168.1.12', '10.0.4.88', '192.168.2.14', '172.16.15.52'];
    const randomIp = ipList[Math.floor(Math.random() * ipList.length)];

    const newLog = {
      id: `L-${Math.floor(Math.random() * 90000) + 10000}`,
      datetime: nowStr,
      user: currentUser ? currentUser.name : 'Системний процес',
      action: actionType,
      object: objectInfo,
      result: resultStatus,
      ip: randomIp
    };

    logs.unshift(newLog);
    setStorageData('rp_logs', logs);
    return newLog;
  },

  clearLogs: () => {
    logs = [];
    setStorageData('rp_logs', logs);
    DB.logAction('Очищення журналу', 'Видалено всі записи журналу дій', 'УСПІХ');
  },

  /**
   * Керування користувачами
   */
  getUsers: () => {
    initDatabase();
    return users;
  },

  setUsers: (newUsers) => {
    users = newUsers;
    setStorageData('rp_users', users);
  },

  addUser: (uData) => {
    const all = DB.getUsers();

    // ID
    let maxId = 305;
    all.forEach(u => {
      const num = parseInt(u.id.replace('U-', ''));
      if (!isNaN(num) && num > maxId) maxId = num;
    });
    const newId = `U-${maxId + 1}`;

    const newUser = {
      id: newId,
      name: uData.name,
      email: uData.email,
      role: uData.role,
      status: uData.status || 'Активний',
      lastLogin: 'Немає входів',
      department: uData.department || 'Рекрутинговий центр'
    };

    all.push(newUser);
    DB.setUsers(all);

    DB.logAction('Управління користувачами', `Створено користувача ${newId} (${newUser.name}, Роль: ${newUser.role})`, 'УСПІХ');
    return newUser;
  },

  updateUser: (id, uData) => {
    const list = DB.getUsers();
    const idx = list.findIndex(u => u.id === id);
    if (idx !== -1) {
      const original = list[idx];
      const updated = {
        ...original,
        ...uData
      };
      list[idx] = updated;
      DB.setUsers(list);

      DB.logAction('Управління користувачами', `Відредаговано профіль користувача ${id} (${updated.name})`, 'УСПІХ');
      return updated;
    }
    return null;
  },

  deleteUser: (id) => {
    const list = DB.getUsers();
    const target = list.find(u => u.id === id);
    if (!target) return false;

    // Справжнє видалення
    const remaining = list.filter(u => u.id !== id);
    DB.setUsers(remaining);

    DB.logAction('Управління користувачами', `Видалено користувача ${id} (${target.name}) з системи`, 'УСПІХ');
    return true;
  },

  /**
   * Налаштування системи
   */
  getSettings: () => {
    initDatabase();
    return settings;
  },

  updateSettings: (newData) => {
    settings = {
      ...settings,
      ...newData
    };
    setStorageData('rp_settings', settings);
    DB.logAction('Редагування налаштувань', 'Оновлено загальні системні налашування', 'УСПІХ');
    return settings;
  },

  /**
   * Ролі та права (RBAC)
   */
  getPermissionsMatrix: () => {
    initDatabase();
    return permissionsMatrix;
  },

  updatePermission: (permissionName, roleName, isAllowed) => {
    initDatabase();
    if (permissionsMatrix[permissionName]) {
      permissionsMatrix[permissionName][roleName] = isAllowed;
      setStorageData('rp_permissions', permissionsMatrix);
      DB.logAction('Оновлення дозволів', `Оновлено право "${permissionName}" для ролі "${roleName}": ${isAllowed ? 'Увімкнено' : 'Вимкнено'}`, 'УСПІХ');
      return true;
    }
    return false;
  },

  /**
   * Поточний користувач
   */
  getCurrentUser: () => {
    initDatabase();
    return currentUser;
  },

  setCurrentUserRole: (roleName) => {
    initDatabase();
    currentUser.role = roleName;
    
    // Оновити ПІБ та департамент відповідно до обраної ролі для зручності демо
    const correspondingUser = users.find(u => u.role === roleName && u.status === 'Активний');
    if (correspondingUser) {
      currentUser.name = correspondingUser.name;
      currentUser.email = correspondingUser.email;
    } else {
      currentUser.name = `Демо ${roleName}`;
    }

    setStorageData('rp_current_user', currentUser);
    DB.logAction('Зміна статусів', `Змінено активну сесію користувача на роль "${roleName}" (${currentUser.name})`, 'УСПІХ');
    return currentUser;
  },

  // Перевірка права
  hasPermission: (permissionName) => {
    initDatabase();
    const userRole = currentUser.role;
    
    // Якщо права не існує взагалі у матриці
    if (!permissionsMatrix[permissionName]) {
      return false;
    }

    // Повертаємо логічне значення для поточної ролі
    return !!permissionsMatrix[permissionName][userRole];
  }
};

// Зробимо модуль доступним глобально на сторінці
window.DB = DB;
window.STATUS_META = STATUS_META;
window.STAGES = STAGES;
window.DOCUMENT_TYPES = DOCUMENT_TYPES;
