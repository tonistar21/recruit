/**
 * АСУ "Рекрут+" - compatibility data adapter over backend API
 */

const STATUS_META = {
  'Новий': {color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', name: 'Новий'},
  'Співбесіда': {color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', name: 'Співбесіда'},
  'Перевірка док.': {color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', name: 'Перевірка док.'},
  'Тестування': {color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', name: 'Тестування'},
  'Рекомендовано': {color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', name: 'Рекомендовано'},
  'Відхилено': {color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', name: 'Відхилено'},
  'Архів': {color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)', name: 'Архів'},
};

const STAGES = [
  'Первинна реєстрація',
  'Перевірка документів',
  'Професійне тестування',
  'Співбесіда з психологом',
  'Медична комісія',
  'Рекомендовано',
  'Очікування наказу',
  'Зараховано',
  'Відхилено',
];

const DOCUMENT_TYPES = [
  'Паспорт',
  'ІПН',
  'Диплом',
  'Медична довідка',
  'Військовий квиток',
  'Інші документи',
];

const DEFAULT_PERMISSIONS_MATRIX = {
  'Перегляд кандидатів': {'Адміністратор': true, 'Рекрутер': true, 'Керівник': true, 'Оператор': true},
  'Створення анкет': {'Адміністратор': true, 'Рекрутер': true, 'Керівник': false, 'Оператор': true},
  'Редагування анкет': {'Адміністратор': true, 'Рекрутер': true, 'Керівник': false, 'Оператор': false},
  'Видалення анкет': {'Адміністратор': true, 'Рекрутер': false, 'Керівник': false, 'Оператор': false},
  'Завантаження документів': {'Адміністратор': true, 'Рекрутер': true, 'Керівник': false, 'Оператор': true},
  'Зміна статусів': {'Адміністратор': true, 'Рекрутер': true, 'Керівник': false, 'Оператор': false},
  'Перегляд аналітики': {'Адміністратор': true, 'Рекрутер': true, 'Керівник': true, 'Оператор': false},
  'Управління користувачами': {'Адміністратор': true, 'Рекрутер': false, 'Керівник': false, 'Оператор': false},
  'Перегляд журналу дій': {'Адміністратор': true, 'Рекрутер': false, 'Керівник': false, 'Оператор': false},
  'Експорт звітів': {'Адміністратор': true, 'Рекрутер': true, 'Керівник': true, 'Оператор': false},
};

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
    phone: '+380 67 123 45 67',
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
    documents: [],
    history: [],
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
    phone: '+380 50 987 65 43',
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
    stage: 'Перевірка документів',
    createdAt: '2024-03-12T09:15:00Z',
    updatedAt: '2024-03-21T11:40:10Z',
    documents: [],
    history: [],
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
    phone: '+380 63 444 55 66',
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
    documents: [],
    history: [],
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
    phone: '+380 99 111 22 33',
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
    documents: [],
    history: [],
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
    phone: '+380 67 777 88 99',
    email: 'olena.tkachenko@recruit.gov.ua',
    region: 'Харківська',
    city: 'Харків',
    address: 'вул. Сумська, 45, кв. 11',
    educationLevel: 'Вища (бакалавр)',
    institution: 'Харківський авіаційний інститут (ХАІ)',
    speciality: 'Авіоніка та БПЛА',
    workExperience: 'Інструктор у школі пілотування дронів',
    militaryExperience: 'Немає',
    desiredUnit: 'Аеророзвідка (Сили безпілотних систем)',
    status: 'Тестування',
    stage: 'Професійне тестування',
    createdAt: '2024-03-14T14:30:00Z',
    updatedAt: '2024-03-19T13:20:00Z',
    documents: [],
    history: [],
  },
];

const DEFAULT_USERS = [
  {id: 'U-1', name: 'Петренко Олексій', email: 'petrenko@recruit.gov.ua', role: 'Адміністратор', status: 'Активний', lastLogin: '2026-05-19 09:15', department: 'Головне управління'},
  {id: 'U-2', name: 'Іванов Сергій', email: 'ivanov@recruit.gov.ua', role: 'Рекрутер', status: 'Активний', lastLogin: '2026-05-19 10:30', department: 'Львівський ЦР'},
];

const DEFAULT_LOGS = [];

const DEFAULT_SETTINGS = {
  systemName: 'АСУ "Рекрут+"',
  organization: 'Міністерство оборони України / ЗСУ',
  backupPeriod: 'Щодня о 03:00',
  twoFactor: true,
  sessionTimeout: '60 хвилин',
  interfaceLanguage: 'Українська',
};

const CURRENT_USER_MOCK = {
  name: 'Петренко Олексій',
  role: 'Адміністратор',
  email: 'petrenko@recruit.gov.ua',
  avatarInitials: 'ПО',
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

let candidates = deepClone(DEMO_CANDIDATES);
let users = deepClone(DEFAULT_USERS);
let logs = deepClone(DEFAULT_LOGS);
let settings = {...DEFAULT_SETTINGS};
let permissionsMatrix = deepClone(DEFAULT_PERMISSIONS_MATRIX);
let currentUser = {...CURRENT_USER_MOCK};
let initialized = false;
let initPromise = null;

function mapStatusFromApi(statusName) {
  if (statusName === 'Перевірка документів') return 'Перевірка док.';
  if (statusName === 'Архівовано') return 'Архів';
  return statusName;
}

function mapStatusToApi(statusName) {
  if (statusName === 'Перевірка док.') return 'Перевірка документів';
  if (statusName === 'Архів') return 'Архівовано';
  return statusName;
}

function normalizeCandidate(candidate) {
  if (!candidate) return null;
  return {
    ...candidate,
    status: mapStatusFromApi(candidate.status),
    documents: Array.isArray(candidate.documents) ? candidate.documents : [],
    history: Array.isArray(candidate.history) ? candidate.history : [],
    fullName: candidate.fullName || [candidate.lastName, candidate.firstName, candidate.middleName].filter(Boolean).join(' '),
  };
}

function mapCandidateToApi(candidate) {
  return {
    ...candidate,
    status: candidate.status ? mapStatusToApi(candidate.status) : candidate.status,
  };
}

function refreshCurrentUserFromRole() {
  const matchingUser = users.find((user) => user.role === currentUser.role && user.status === 'Активний');
  if (matchingUser) {
    currentUser = {
      name: matchingUser.name,
      role: matchingUser.role,
      email: matchingUser.email,
      avatarInitials: matchingUser.name.split(' ').slice(0, 2).map((part) => part[0] || '').join('').toUpperCase(),
    };
  }
}

async function fetchBootstrapData() {
  const api = window.RecruitPlusApi;
  if (!api) {
    return;
  }

  const [apiCandidates, apiUsers, apiLogs, apiSettings, apiMatrix] = await Promise.all([
    api.getCandidates(),
    api.getUsers(),
    api.getLogs(),
    api.getSettings(),
    api.getRoleMatrix(),
  ]);

  candidates = Array.isArray(apiCandidates) ? apiCandidates.map(normalizeCandidate) : deepClone(DEMO_CANDIDATES);
  users = Array.isArray(apiUsers) ? apiUsers : deepClone(DEFAULT_USERS);
  logs = Array.isArray(apiLogs) ? apiLogs : deepClone(DEFAULT_LOGS);
  settings = apiSettings ? {...DEFAULT_SETTINGS, ...apiSettings} : {...DEFAULT_SETTINGS};
  permissionsMatrix = apiMatrix || deepClone(DEFAULT_PERMISSIONS_MATRIX);
  refreshCurrentUserFromRole();
}

const DB = {
  async initialize() {
    if (initialized) return;
    if (!initPromise) {
      initPromise = fetchBootstrapData()
        .catch((error) => {
          console.error('Recruit+ API bootstrap failed, using demo cache:', error);
        })
        .finally(() => {
          initialized = true;
        });
    }
    await initPromise;
  },

  async refreshCandidates() {
    const api = window.RecruitPlusApi;
    if (!api) return candidates;
    candidates = (await api.getCandidates()).map(normalizeCandidate);
    return candidates;
  },

  async refreshUsers() {
    const api = window.RecruitPlusApi;
    if (!api) return users;
    users = await api.getUsers();
    refreshCurrentUserFromRole();
    return users;
  },

  async refreshLogs() {
    const api = window.RecruitPlusApi;
    if (!api) return logs;
    logs = await api.getLogs();
    return logs;
  },

  async refreshSettings() {
    const api = window.RecruitPlusApi;
    if (!api) return settings;
    settings = {...DEFAULT_SETTINGS, ...(await api.getSettings())};
    return settings;
  },

  async refreshPermissions() {
    const api = window.RecruitPlusApi;
    if (!api) return permissionsMatrix;
    permissionsMatrix = await api.getRoleMatrix();
    return permissionsMatrix;
  },

  getCandidates() {
    return candidates;
  },

  setCandidates(newCandidates) {
    candidates = Array.isArray(newCandidates) ? newCandidates.map(normalizeCandidate) : [];
    return candidates;
  },

  getCandidateById(id) {
    return candidates.find((candidate) => candidate.id === id) || null;
  },

  async addCandidate(candidateData) {
    const api = window.RecruitPlusApi;
    const created = api ? await api.createCandidate(mapCandidateToApi(candidateData)) : normalizeCandidate(candidateData);
    const normalized = normalizeCandidate(created);
    candidates = [normalized, ...candidates.filter((candidate) => candidate.id !== normalized.id)];
    await DB.refreshLogs().catch(() => {});
    return normalized;
  },

  async updateCandidate(id, candidateData) {
    const api = window.RecruitPlusApi;
    const updated = api ? await api.updateCandidate(id, mapCandidateToApi(candidateData)) : null;
    const normalized = normalizeCandidate(updated);
    candidates = candidates.map((candidate) => candidate.id === id ? normalized : candidate);
    await DB.refreshLogs().catch(() => {});
    return normalized;
  },

  async deleteCandidate(id) {
    const api = window.RecruitPlusApi;
    if (api) {
      await api.archiveCandidate(id);
    }
    candidates = candidates.filter((candidate) => candidate.id !== id);
    await DB.refreshLogs().catch(() => {});
    return true;
  },

  async updateCandidateStage(id, newStage) {
    const api = window.RecruitPlusApi;
    const updated = api ? await api.changeCandidateStage(id, newStage) : null;
    const normalized = normalizeCandidate(updated);
    candidates = candidates.map((candidate) => candidate.id === id ? normalized : candidate);
    await DB.refreshLogs().catch(() => {});
    return normalized;
  },

  async addCandidateDocument(candidateId, docType, fileName, file = null) {
    const api = window.RecruitPlusApi;
    if (!api) return null;

    const formData = new FormData();
    formData.append('candidateId', candidateId);
    formData.append('documentType', docType);
    formData.append('fileName', fileName);
    if (file) {
      formData.append('file', file);
    }

    await api.uploadDocument(formData);
    await DB.refreshCandidates();
    await DB.refreshLogs().catch(() => {});

    const candidate = DB.getCandidateById(candidateId);
    return candidate?.documents.find((doc) => doc.fileName === fileName) || null;
  },

  async updateDocumentStatus(candidateId, docId, newStatus) {
    const api = window.RecruitPlusApi;
    if (api) {
      await api.updateDocumentStatus(docId, newStatus);
    }
    await DB.refreshCandidates();
    await DB.refreshLogs().catch(() => {});
    const candidate = DB.getCandidateById(candidateId);
    return candidate?.documents.find((doc) => doc.id === docId) || null;
  },

  async deleteDocument(candidateId, docId) {
    const api = window.RecruitPlusApi;
    if (api) {
      await api.deleteDocument(docId);
    }
    await DB.refreshCandidates();
    await DB.refreshLogs().catch(() => {});
    return !DB.getCandidateById(candidateId)?.documents.find((doc) => doc.id === docId);
  },

  getLogs() {
    return [...logs].sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
  },

  logAction(actionType, objectInfo, resultStatus = 'УСПІХ') {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const localLog = {
      id: `L-temp-${Date.now()}`,
      datetime: now,
      user: currentUser?.name || 'Системний процес',
      action: actionType,
      object: objectInfo,
      result: resultStatus,
      ip: '',
    };
    logs = [localLog, ...logs];
    if (window.RecruitPlusApi) {
      window.RecruitPlusApi.createLog({
        action: actionType,
        objectType: 'ui_action',
        objectId: objectInfo,
        result: resultStatus === 'УСПІХ' ? 'SUCCESS' : resultStatus,
        newValue: {objectInfo},
      }).then(() => DB.refreshLogs()).catch(() => {});
    }
    return localLog;
  },

  clearLogs() {
    logs = [];
  },

  getUsers() {
    return users;
  },

  setUsers(newUsers) {
    users = Array.isArray(newUsers) ? newUsers : [];
    refreshCurrentUserFromRole();
    return users;
  },

  async addUser(userData) {
    const api = window.RecruitPlusApi;
    const created = api ? await api.createUser(userData) : userData;
    users = [...users, created];
    await DB.refreshLogs().catch(() => {});
    return created;
  },

  async updateUser(id, userData) {
    const api = window.RecruitPlusApi;
    const updated = api ? await api.updateUser(id, userData) : userData;
    users = users.map((user) => user.id === id ? updated : user);
    refreshCurrentUserFromRole();
    await DB.refreshLogs().catch(() => {});
    return updated;
  },

  async deleteUser(id) {
    const api = window.RecruitPlusApi;
    const target = users.find((user) => user.id === id);
    if (!target) return false;
    if (api) {
      await api.deactivateUser(id, 'Деактивований');
    }
    users = users.map((user) => user.id === id ? {...user, status: 'Деактивований'} : user);
    refreshCurrentUserFromRole();
    await DB.refreshLogs().catch(() => {});
    return true;
  },

  getSettings() {
    return settings;
  },

  async updateSettings(newData) {
    const api = window.RecruitPlusApi;
    settings = api ? {...settings, ...(await api.updateSettings(newData))} : {...settings, ...newData};
    await DB.refreshLogs().catch(() => {});
    return settings;
  },

  getPermissionsMatrix() {
    return permissionsMatrix;
  },

  async updatePermission(permissionName, roleName, isAllowed) {
    const api = window.RecruitPlusApi;
    if (api) {
      permissionsMatrix = await api.updateRolePermissions(roleName, permissionName, isAllowed);
    } else if (permissionsMatrix[permissionName]) {
      permissionsMatrix[permissionName][roleName] = isAllowed;
    }
    await DB.refreshLogs().catch(() => {});
    return true;
  },

  getCurrentUser() {
    return currentUser;
  },

  setCurrentUserRole(roleName) {
    currentUser = {...currentUser, role: roleName};
    refreshCurrentUserFromRole();
    return currentUser;
  },

  hasPermission(permissionName) {
    return !!permissionsMatrix[permissionName]?.[currentUser.role];
  },
};

window.DB = DB;
window.STATUS_META = STATUS_META;
window.STAGES = STAGES;
window.DOCUMENT_TYPES = DOCUMENT_TYPES;
