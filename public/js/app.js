/**
 * АСУ "Рекрут+" - Головний прикладний JS контролер системи
 */

document.addEventListener('DOMContentLoaded', () => {
  // Запуск локального сховища
  DB.getCandidates(); // Ініціювати структури дефолтно
  
  // Керування станом форми реєстрації кандидата
  let currentStep = 1;
  const totalSteps = 5;
  const stepperCandidateData = {
    lastName: '',
    firstName: '',
    middleName: '',
    birthDate: '',
    gender: 'Чоловіча',
    ipn: '',
    phone: '',
    email: '',
    region: 'Київська',
    city: '',
    address: '',
    educationLevel: 'Вища',
    institution: '',
    speciality: '',
    workExperience: '',
    militaryExperience: '',
    desiredUnit: 'Сили безпілотних систем (СБС)',
    documents: [] // { type, fileName }
  };

  // Поточні вибрані кандидати та користувачі для редагування/перегляду
  let selectedCandidateId = null;
  let selectedUserId = null;

  // Ініціалізація додатку
  initApp();

  /**
   * =========================================
   * ІНІЦІАЛІЗАЦІЯ ТА СПА РОУТЕР
   * =========================================
   */
  function initApp() {
    setupNavigation();
    setupUserRoleSimulation();
    setupGlobalSearch();
    renderActiveSection('dashboard'); // Дефолтний запуск на огляді
    setupEventListeners();
    
    // Перевірка мобільного меню
    const burger = document.getElementById('mobileBurgerBtn');
    const sidebar = document.querySelector('.sidebar');
    if (burger && sidebar) {
      burger.addEventListener('click', () => {
        sidebar.classList.toggle('show');
      });
      
      // Закривати при кліку на пункти
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => {
        item.addEventListener('click', () => {
          sidebar.classList.remove('show');
        });
      });
    }
  }

  // Обробка навігації без перезавантаження
  function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSection = item.getAttribute('data-target');
        if (targetSection) {
          renderActiveSection(targetSection);
        }
      });
    });

    // Червона кнопка "Вийти з системи"
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Ви дійсно бажаєте завершити поточну тактичну сесію?')) {
          showToast('Автентифікація', 'Користувач вийшов із системи. Сесію закрито.', 'error');
          // Скинемо роль до оператора тимчасово чи перезавантажимо для імітації
          DB.setCurrentUserRole('Оператор');
          updateTopbarProfileUI();
          renderActiveSection('dashboard');
        }
      });
    }
  }

  // Динамічний рендеринг сторінок
  function renderActiveSection(sectionId) {
    // Оновити активний навігаційний клас
    document.querySelectorAll('.nav-item').forEach(el => {
      if (el.getAttribute('data-target') === sectionId) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Відобразити потрібну секцію
    document.querySelectorAll('.page-section').forEach(sec => {
      if (sec.id === `${sectionId}-section`) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });

    // Викликати індивідуальні рендери залежно від вкладки
    switch (sectionId) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'candidates':
        renderCandidatesTable();
        break;
      case 'new-candidate':
        resetNewCandidateStepper();
        break;
      case 'documents':
        renderDocumentsTable();
        break;
      case 'stages':
        renderKanbanBoard();
        break;
      case 'analytics':
        renderAnalyticsPage();
        break;
      case 'users':
        renderUsersTable();
        break;
      case 'roles':
        renderRolesMatrix();
        break;
      case 'logs':
        renderLogsTable();
        break;
      case 'settings':
        renderSettingsForm();
        break;
    }
  }

  /**
   * =========================================
   * ІМІТАЦІЯ ТА СИМУЛЯЦІЯ РОЛЕЙ (RBAC)
   * =========================================
   */
  function setupUserRoleSimulation() {
    const profileCell = document.getElementById('profileHeaderCell');
    const profileDropdown = document.getElementById('profileDropdownMenu');

    if (profileCell && profileDropdown) {
      // Відкриття при кліку
      profileCell.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('show');
      });

      // Закривати dropdown при кліку поза ним
      document.addEventListener('click', () => {
        profileDropdown.classList.remove('show');
      });

      // Перемикання ролі у спадному списку
      document.querySelectorAll('.role-sim-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const targetRole = e.currentTarget.getAttribute('data-role');
          DB.setCurrentUserRole(targetRole);
          
          updateTopbarProfileUI();
          showToast('Зміна ролі', `Дозвіл системи змінено. Активна роль: ${targetRole}`, 'success');
          
          // Перезавантажити поточну відкриту сторінку для оновлення доступності дій
          const activeNav = document.querySelector('.nav-item.active');
          if (activeNav) {
            renderActiveSection(activeNav.getAttribute('data-target'));
          }
        });
      });
    }

    // Первинно виставити ПІБ та роль у топбар
    updateTopbarProfileUI();
  }

  // Оновлення інтерфейсу топбару відповідно до ролі
  function updateTopbarProfileUI() {
    const cur = DB.getCurrentUser();
    
    // Відображення імені та ролі в Topbar
    const nameEl = document.getElementById('topbarProfileName');
    const roleEl = document.getElementById('topbarProfileRole');
    const avatarEl = document.getElementById('topbarProfileAvatar');

    if (nameEl) nameEl.textContent = cur.name;
    if (roleEl) roleEl.textContent = cur.role;
    if (avatarEl) {
      // Будуємо ініціали
      const parts = cur.name.split(' ');
      let initials = 'МП';
      if (parts.length >= 2) {
        initials = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
      }
      avatarEl.textContent = initials;
    }

    // Відображення відзначеної галки меню симуляції ролей
    document.querySelectorAll('.role-sim-item').forEach(item => {
      if (item.getAttribute('data-role') === cur.role) {
        item.classList.add('active');
        const check = item.querySelector('.check-indicator');
        if (check) check.style.display = 'block';
      } else {
        item.classList.remove('active');
        const check = item.querySelector('.check-indicator');
        if (check) check.style.display = 'none';
      }
    });

    // Оновити загальний тайтл системи в Сайдбарі якщо змінено в налаштуваннях
    const sett = DB.getSettings();
    const subTitle = document.querySelector('.system-sub');
    if (subTitle && sett.organization) {
      const acronym = sett.organization.includes('/') ? sett.organization.split('/')[1].trim() : sett.organization;
      subTitle.textContent = acronym.toUpperCase();
    }
  }

  // Допоміжна тактична функція для блокування дій при браку прав
  function verifyActionPermission(permissionName) {
    if (!DB.hasPermission(permissionName)) {
      showToast('Доступ заблоковано', 'Недостатньо військових прав для виконання цієї операції. Змініть роль у верхньому правому куті.', 'error');
      return false;
    }
    return true;
  }

  /**
   * =========================================
   * DASHBOARD / СИСТЕМНИЙ ОГЛЯД
   * =========================================
   */
  function renderDashboard() {
    const list = DB.getCandidates();
    
    // Обчислення метрик
    const totalCount = list.length;
    
    // Нові за останній тиждень (умовно останні 7 днів)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newWeeklyCount = list.filter(c => new Date(c.createdAt) >= sevenDaysAgo).length;

    // Співбесіди та рекомендовані
    const interviewCount = list.filter(c => c.status === 'Співбесіда').length;
    const recommendedCount = list.filter(c => c.status === 'Рекомендовано').length;

    // Відобразити значення на сторінці
    document.getElementById('dashTotalCandidates').textContent = totalCount;
    document.getElementById('dashNewWeekly').textContent = newWeeklyCount;
    document.getElementById('dashOnInterview').textContent = interviewCount;
    document.getElementById('dashRecommended').textContent = recommendedCount;

    // Рендеринг тактичних графіків
    // 1. Динаміка реєстрацій за останні 7 днів (Бар чарт)
    // Порахуємо реальні за версією дати
    const daysLabel = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
    const barData = [
      { label: 'Пн', value: 8 },
      { label: 'Вт', value: 12 },
      { label: 'Ср', value: 10 },
      { label: 'Чт', value: 15 },
      { label: 'Пт', value: 20 },
      { label: 'Сб', value: 5 },
      { label: 'Нд', value: 2 }
    ];
    // Підмішаємо трохи кандидатів з бази
    barData[4].value = barData[4].value + totalCount - 5; // Свіжі дані з БД

    Charts.initRegisterDynamics('dashRegisterDynamicsCanvas', barData);

    // 2. Розподіл по статусах (Пончик чарт)
    const statusCounts = {};
    Object.keys(STATUS_META).forEach(st => statusCounts[st] = 0);
    list.forEach(c => {
      if (statusCounts[c.status] !== undefined) {
        statusCounts[c.status]++;
      }
    });

    const donutData = Object.keys(statusCounts).map(status => {
      return {
        label: status,
        value: statusCounts[status] || 0,
        color: STATUS_META[status].color
      };
    }).filter(d => d.value > 0); // Порожні вилучимо

    Charts.initStatusDonut('dashStatusDonutCanvas', donutData.length > 0 ? donutData : null);
  }

  /**
   * =========================================
   * КАНДИДАТИ / БАЗА КАНДИДАТІВ (CRUD)
   * =========================================
   */
  function renderCandidatesTable() {
    const all = DB.getCandidates();
    const searchVal = document.getElementById('candidateSearchInput').value.toLowerCase().trim();
    const statusFilter = document.getElementById('candidateStatusFilter').value;

    const tbody = document.getElementById('candidatesTableBody');
    tbody.innerHTML = '';

    // Фільтрація списку
    const filtered = all.filter(c => {
      // Пошук
      const matchesSearch = c.fullName.toLowerCase().includes(searchVal) || 
                            c.id.toLowerCase().includes(searchVal) || 
                            c.phone.includes(searchVal) || 
                            c.email.toLowerCase().includes(searchVal);
      // Статус
      const matchesStatus = statusFilter === 'Всі статуси' || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Рендер рядків
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #556270; padding: 40px;">Кандидатів за обраними тактичними критеріями не виявлено.</td></tr>`;
      return;
    }

    filtered.forEach(c => {
      const meta = STATUS_META[c.status] || { color: '#8b95a5', bg: 'rgba(255,255,255,0.05)', name: c.status };
      
      const tr = document.createElement('tr');
      tr.id = `candidate-row-${c.id}`;
      tr.innerHTML = `
        <td class="id-badge-tactical">${c.id}</td>
        <td>
          <div class="row-candidate-name">${c.fullName}</div>
          <div class="row-candidate-sub">${c.phone}</div>
        </td>
        <td>
          <span class="badge-status" style="color: ${meta.color}; background-color: ${meta.bg};">
            ${meta.name}
          </span>
        </td>
        <td>${c.stage}</td>
        <td>
          <div class="table-acts">
            <button class="action-icon-btn btn-view" title="Перегляд картки" data-id="${c.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="action-icon-btn btn-edit" title="Редагувати анкету" data-id="${c.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button class="action-icon-btn btn-delete-row" title="Утилізувати/Архівувати" data-id="${c.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Навісити івенти на кнопки дій у таблиці
    tbody.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (verifyActionPermission('Перегляд кандидатів')) {
          openCandidateViewModal(id);
        }
      });
    });

    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (verifyActionPermission('Редагування анкет')) {
          openCandidateEditModal(id);
        }
      });
    });

    tbody.querySelectorAll('.btn-delete-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (verifyActionPermission('Видалення анкет')) {
          openDeleteConfirmationModal(id);
        }
      });
    });
  }

  /**
   * =========================================
   * СТЕППЕР РЕЄСТРАЦІЇ НОВОГО КАНДИДАТА
   * =========================================
   */
  function resetNewCandidateStepper() {
    currentStep = 1;
    // Скинути дані в об'єкті
    Object.keys(stepperCandidateData).forEach(key => {
      if (key === 'documents') stepperCandidateData.documents = [];
      else if (key === 'gender') stepperCandidateData.gender = 'Чоловіча';
      else if (key === 'region') stepperCandidateData.region = 'Київська';
      else if (key === 'desiredUnit') stepperCandidateData.desiredUnit = 'Сили безпілотних систем (СБС)';
      else if (key === 'educationLevel') stepperCandidateData.educationLevel = 'Вища';
      else stepperCandidateData[key] = '';
    });

    // Скинути інпути на формі
    document.querySelectorAll('.step-pane-input').forEach(input => {
      input.value = '';
      input.classList.remove('error');
    });

    // Виставити стандартні селекти
    document.getElementById('stepSex').value = 'Чоловіча';
    document.getElementById('stepRegion').value = 'Київська';
    document.getElementById('stepDesiredUnit').value = 'Сили безпілотних систем (СБС)';
    document.getElementById('stepEducationLevel').value = 'Вища';

    // Обнулити файлові контейнери
    document.querySelectorAll('.doc-upload-card').forEach(card => {
      card.classList.remove('loaded');
      const fileInput = card.querySelector('.doc-file-input');
      if (fileInput) fileInput.value = '';
    });

    renderStepperStep();
  }

  function renderStepperStep() {
    // 1. Оновлення круглих вузлів кроків
    document.querySelectorAll('.step-node').forEach(node => {
      const stepNum = parseInt(node.getAttribute('data-step'));
      node.classList.remove('active', 'completed');
      if (stepNum === currentStep) {
        node.classList.add('active');
      } else if (stepNum < currentStep) {
        node.classList.add('completed');
      }
    });

    // Оновлення лінійного регулятора прогресу
    const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;
    const lineActive = document.getElementById('newCandidateStepperLineActive');
    if (lineActive) {
      lineActive.style.width = `${progressPercent}%`;
    }

    // 2. Показ/приховання контейнерів вкладок
    document.querySelectorAll('.stepper-pane').forEach(pane => {
      if (parseInt(pane.getAttribute('data-step')) === currentStep) {
        pane.style.display = 'block';
      } else {
        pane.style.display = 'none';
      }
    });

    // Керування навігаційними кнопками
    const prevBtn = document.getElementById('stepPrevBtn');
    const nextBtn = document.getElementById('stepNextBtn');
    const registerBtn = document.getElementById('stepRegisterBtn');

    prevBtn.style.visibility = (currentStep === 1) ? 'hidden' : 'visible';
    
    if (currentStep === totalSteps) {
      nextBtn.style.display = 'none';
      registerBtn.style.display = 'inline-flex';
      buildConfirmSummaryUI();
    } else {
      nextBtn.style.display = 'inline-flex';
      registerBtn.style.display = 'none';
    }
  }

  // Перевірка поточного кроку
  function validateStepperStep() {
    let isValid = true;

    // Знімаємо старі класи помилки
    document.querySelectorAll('.step-pane-input').forEach(el => el.classList.remove('error'));

    if (currentStep === 1) {
      const ln = document.getElementById('stepLastName');
      const fn = document.getElementById('stepFirstName');
      const bd = document.getElementById('stepBirthDate');
      const ipn = document.getElementById('stepIpn');

      if (!ln.value.trim()) { ln.classList.add('error'); isValid = false; }
      if (!fn.value.trim()) { fn.classList.add('error'); isValid = false; }
      if (!bd.value) { bd.classList.add('error'); isValid = false; }

      // Перевірка ІПН (якщо внесено - має бути рівно 10 цифр)
      const ipnVal = ipn.value.trim();
      if (ipnVal && (!/^\d{10}$/.test(ipnVal))) {
        ipn.classList.add('error');
        showToast('Помилка формату', 'ІПН має складатися точно з 10 цифр.', 'error');
        isValid = false;
      }

      if (isValid) {
        stepperCandidateData.lastName = ln.value.trim();
        stepperCandidateData.firstName = fn.value.trim();
        stepperCandidateData.middleName = document.getElementById('stepMiddleName').value.trim();
        stepperCandidateData.birthDate = bd.value;
        stepperCandidateData.gender = document.getElementById('stepSex').value;
        stepperCandidateData.ipn = ipnVal;
      }
    }

    else if (currentStep === 2) {
      const ph = document.getElementById('stepPhone');
      const em = document.getElementById('stepEmail');
      const city = document.getElementById('stepCity');

      if (!ph.value.trim()) { ph.classList.add('error'); isValid = false; }
      if (!em.value.trim()) { em.classList.add('error'); isValid = false; }
      if (!city.value.trim()) { city.classList.add('error'); isValid = false; }

      // Формат email
      const emVal = em.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emVal && !emailRegex.test(emVal)) {
        em.classList.add('error');
        showToast('Помилка формату', 'Введіть коректну адресу електронної пошти.', 'error');
        isValid = false;
      }

      if (isValid) {
        stepperCandidateData.phone = ph.value.trim();
        stepperCandidateData.email = emVal;
        stepperCandidateData.region = document.getElementById('stepRegion').value;
        stepperCandidateData.city = city.value.trim();
        stepperCandidateData.address = document.getElementById('stepAddress').value.trim();
      }
    }

    else if (currentStep === 3) {
      const inst = document.getElementById('stepInstitution');
      const spec = document.getElementById('stepSpeciality');

      if (!inst.value.trim()) { inst.classList.add('error'); isValid = false; }
      if (!spec.value.trim()) { spec.classList.add('error'); isValid = false; }

      if (isValid) {
        stepperCandidateData.educationLevel = document.getElementById('stepEducationLevel').value;
        stepperCandidateData.institution = inst.value.trim();
        stepperCandidateData.speciality = spec.value.trim();
        stepperCandidateData.workExperience = document.getElementById('stepWorkExperience').value.trim();
        stepperCandidateData.militaryExperience = document.getElementById('stepMilitaryExperience').value.trim();
        stepperCandidateData.desiredUnit = document.getElementById('stepDesiredUnit').value;
      }
    }

    if (!isValid) {
      showToast('Помилка валідації', 'Заповніть обов\'язкові тактичні поля, підсвічені червоним кольором.', 'error');
    }

    return isValid;
  }

  // Навігація stepper вперед
  document.getElementById('stepNextBtn').addEventListener('click', () => {
    if (validateStepperStep()) {
      if (currentStep < totalSteps) {
        currentStep++;
        renderStepperStep();
      }
    }
  });

  // Навігація stepper назад
  document.getElementById('stepPrevBtn').addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      renderStepperStep();
    }
  });

  // Збереження чернетки на кроці
  document.getElementById('saveDraftStepperLink').addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Збереження чернетки', 'Дані поточної анкети збережені локально як тактична чернетка у сховищі.', 'success');
    DB.logAction('Одержання чернетки', 'Збережено локальну резервну копію анкетних даних', 'УСПІХ');
  });

  // Обробка файлів як імітація завантаження
  document.querySelectorAll('.doc-file-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const fileType = e.target.getAttribute('data-type');
      const files = e.target.files;
      if (files.length > 0) {
        const file = files[0];
        
        // Змінюємо картку завантаження на зелений Loaded
        const card = e.target.closest('.doc-upload-card');
        card.classList.add('loaded');
        
        // Зберігаємо назву файлу
        stepperCandidateData.documents.push({
          type: fileType,
          fileName: file.name
        });

        showToast('Документ додано', `Додано файл "${file.name}" до пакету "${fileType}"`, 'success');
      }
    });
  });

  // Побудова підсумкового звіту на кроці 5
  function buildConfirmSummaryUI() {
    document.getElementById('confirmFio').textContent = `${stepperCandidateData.lastName} ${stepperCandidateData.firstName} ${stepperCandidateData.middleName}`.trim();
    document.getElementById('confirmBirth').textContent = stepperCandidateData.birthDate;
    document.getElementById('confirmSex').textContent = stepperCandidateData.gender;
    document.getElementById('confirmIpn').textContent = stepperCandidateData.ipn || 'Не вказано';
    
    document.getElementById('confirmPhone').textContent = stepperCandidateData.phone;
    document.getElementById('confirmEmail').textContent = stepperCandidateData.email;
    document.getElementById('confirmAddr').textContent = `${stepperCandidateData.region} обл., м. ${stepperCandidateData.city}, ${stepperCandidateData.address}`;
    
    document.getElementById('confirmEduc').textContent = `${stepperCandidateData.educationLevel} (${stepperCandidateData.institution})`;
    document.getElementById('confirmSpec').textContent = stepperCandidateData.speciality;
    document.getElementById('confirmDesiredUnit').textContent = stepperCandidateData.desiredUnit;

    // Складемо список завантажених документів
    const container = document.getElementById('confirmFilesContainer');
    container.innerHTML = '';
    if (stepperCandidateData.documents.length === 0) {
      container.innerHTML = `<div style="color: #8b95a5; font-size: 13px;">Файли документів відсутні.</div>`;
    } else {
      stepperCandidateData.documents.forEach(doc => {
        const row = document.createElement('div');
        row.className = 'confirm-item-row';
        row.innerHTML = `
          <span class="confirm-item-label">${doc.type}</span>
          <span class="confirm-item-value">${doc.fileName}</span>
        `;
        container.appendChild(row);
      });
    }
  }

  // Кінцева реєстрація кандидата з степпера
  document.getElementById('stepRegisterBtn').addEventListener('click', () => {
    if (!verifyActionPermission('Створення анкет')) return;

    // Реєструємо через DB
    const newCandidate = DB.addCandidate(stepperCandidateData);
    
    // Показуємо повідомлення
    showToast('Успішна реєстрація', `Кандидата ${newCandidate.id} [${newCandidate.fullName}] успішно зареєстровано!`, 'success');
    
    // Перехід на базу кандидатів
    renderActiveSection('candidates');
  });

  /**
   * =========================================
   * КЕРУВАННЯ ДОКУМЕНТАМИ
   * =========================================
   */
  function renderDocumentsTable() {
    const all = DB.getCandidates();
    const searchVal = document.getElementById('docSearchInput').value.toLowerCase().trim();
    const typeFilter = document.getElementById('docTypeFilter').value;

    const tbody = document.getElementById('documentsTableBody');
    tbody.innerHTML = '';

    // Збираємо окремі документи з усіх кандидатів
    const allDocs = [];
    all.forEach(c => {
      c.documents.forEach(d => {
        allDocs.push({
          candidateId: c.id,
          candidateName: c.fullName,
          ...d
        });
      });
    });

    // Фільтруємо документи
    const filteredDocs = allDocs.filter(doc => {
      const matchesSearch = doc.candidateName.toLowerCase().includes(searchVal) || 
                            doc.candidateId.toLowerCase().includes(searchVal) || 
                            doc.fileName.toLowerCase().includes(searchVal);
      const matchesType = typeFilter === 'Всі типи' || doc.type === typeFilter;
      return matchesSearch && matchesType;
    });

    if (filteredDocs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #556270; padding: 40px;">Жодного документа за заданими військовими фільтрами не виявлено.</td></tr>`;
      return;
    }

    filteredDocs.forEach(d => {
      let statusColor = '#eab308'; // Очікує
      let statusBg = 'rgba(234, 179, 8, 0.1)';
      if (d.status === 'Підтверджено') {
        statusColor = '#10b981';
        statusBg = 'rgba(16, 185, 129, 0.1)';
      } else if (d.status === 'Відхилено') {
        statusColor = '#ef4444';
        statusBg = 'rgba(239, 68, 68, 0.1)';
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="id-badge-tactical">${d.candidateId}</td>
        <td><strong>${d.candidateName}</strong></td>
        <td><span style="color:#10b981; font-weight: 500;">${d.type}</span></td>
        <td style="font-family: 'JetBrains Mono', monospace; font-size:12px; color: #cbd5e1;">${d.fileName}</td>
        <td>${d.uploadDate}</td>
        <td>
          <span class="badge-status" style="color: ${statusColor}; background-color: ${statusBg};">
            ${d.status}
          </span>
        </td>
        <td>
          <div class="table-acts">
            <button class="action-icon-btn btn-doc-verify" title="Підтвердити" data-cid="${d.candidateId}" data-did="${d.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </button>
            <button class="action-icon-btn btn-doc-reject" title="Відхилити" data-cid="${d.candidateId}" data-did="${d.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
            </button>
            <button class="action-icon-btn btn-doc-delete" title="Вилучити" style="color:#ef4444;" data-cid="${d.candidateId}" data-did="${d.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/></svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Події зміни статусів документів
    tbody.querySelectorAll('.btn-doc-verify').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!verifyActionPermission('Зміна статусів')) return;
        const cid = e.currentTarget.getAttribute('data-cid');
        const did = e.currentTarget.getAttribute('data-did');
        DB.updateDocumentStatus(cid, did, 'Підтверджено');
        showToast('Документ затверджено', 'Документ успішно переведено в статус [Верифіковано].', 'success');
        renderDocumentsTable();
      });
    });

    tbody.querySelectorAll('.btn-doc-reject').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!verifyActionPermission('Зміна статусів')) return;
        const cid = e.currentTarget.getAttribute('data-cid');
        const did = e.currentTarget.getAttribute('data-did');
        DB.updateDocumentStatus(cid, did, 'Відхилено');
        showToast('Документ відхилено', 'Статус документа змінено на [Відхилено].', 'error');
        renderDocumentsTable();
      });
    });

    tbody.querySelectorAll('.btn-doc-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!verifyActionPermission('Видалення анкет')) return;
        const cid = e.currentTarget.getAttribute('data-cid');
        const did = e.currentTarget.getAttribute('data-did');
        if (confirm('Ви дійсно бажаєте безповоротно вилучити цей файл кандидата?')) {
          DB.deleteDocument(cid, did);
          showToast('Документ видалено', 'Файл вилучено зі справи кандидата.', 'success');
          renderDocumentsTable();
        }
      });
    });
  }

  /**
   * =========================================
   * СТАТУСИ ТА ЕТАПИ ВІДБОРУ (KANBAN)
   * =========================================
   */
  function renderKanbanBoard() {
    const list = DB.getCandidates();
    const board = document.getElementById('kanbanBoardContainer');
    board.innerHTML = '';

    // Скидаємо стовпці з групуванням
    STAGES.forEach(stage => {
      const col = document.createElement('div');
      col.className = 'kanban-column';
      
      const stageCandidates = list.filter(c => c.stage === stage);
      
      col.innerHTML = `
        <div class="kanban-column-header">
          <div class="kanban-column-title">
            <span>${stage}</span>
          </div>
          <span class="kanban-column-count">${stageCandidates.length}</span>
        </div>
        <div class="kanban-cards-container" id="kanban-column-${stage.replace(/\s+/g, '-')}">
        </div>
      `;
      
      board.appendChild(col);
      
      const cardsCont = col.querySelector('.kanban-cards-container');
      
      if (stageCandidates.length === 0) {
        cardsCont.innerHTML = `<div style="text-align: center; color: #556270; font-size: 11px; padding: 20px;">Порожньо</div>`;
        return;
      }

      stageCandidates.forEach(c => {
        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.innerHTML = `
          <div class="kanban-card-id">${c.id}</div>
          <div class="kanban-card-name">${c.fullName}</div>
          <div class="kanban-card-desc">${c.phone}</div>
          <div class="kanban-card-act">
            <button class="kanban-nav-btn btn-k-prev" title="Попередній етап" data-id="${c.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <span style="font-size: 10px; font-weight: 700; color: #10b981;">ЕТАП</span>
            <button class="kanban-nav-btn btn-k-next" title="Наступний етап" data-id="${c.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        `;
        
        cardsCont.appendChild(card);
        
        // Клік по картці відкриває перегляд кандидада
        card.addEventListener('click', (e) => {
          // Якщо клікнули безпосередньо по навігаційним кнопкам - не відкривати модалку
          if (e.target.closest('.kanban-nav-btn')) return;
          if (verifyActionPermission('Перегляд кандидатів')) {
            openCandidateViewModal(c.id);
          }
        });
      });
    });

    // Логіка зсувів етапів через стрілки
    board.querySelectorAll('.btn-k-prev').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!verifyActionPermission('Зміна статусів')) return;
        const id = e.currentTarget.getAttribute('data-id');
        moveCandidateStageShift(id, -1);
      });
    });

    board.querySelectorAll('.btn-k-next').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!verifyActionPermission('Зміна статусів')) return;
        const id = e.currentTarget.getAttribute('data-id');
        moveCandidateStageShift(id, 1);
      });
    });
  }

  function moveCandidateStageShift(candId, direction) {
    const cand = DB.getCandidateById(candId);
    if (!cand) return;

    const currentStageIdx = STAGES.indexOf(cand.stage);
    const targetIdx = currentStageIdx + direction;

    if (targetIdx >= 0 && targetIdx < STAGES.length) {
      const targetStage = STAGES[targetIdx];
      DB.updateCandidateStage(candId, targetStage);
      showToast('Етап оновлено', `Кандидат змістився на етап "${targetStage}"`, 'success');
      renderKanbanBoard();
    } else {
      showToast('Неможлива зміна', 'Дійшли до крайної межі тактичних статусів відбору.', 'error');
    }
  }

  /**
   * =========================================
   * АНАЛІТИКА ТА ЗВІТИ
   * =========================================
   */
  function renderAnalyticsPage() {
    // 1. Оновити метрики звіту динамічно на базі БД
    const list = DB.getCandidates();
    const recommendedCount = list.filter(c => c.status === 'Рекомендовано').length;
    const totalCount = list.length || 1;

    // Конверсія (%) = рекомендовані / всього
    const conversionRate = ((recommendedCount / totalCount) * 100).toFixed(1);
    
    document.getElementById('analyticsConversionId').textContent = `${conversionRate}%`;

    // 2. Рендеринг лінійного графіка
    Charts.initAreaDynamics('analyticsAreaCanvas', {
      enroll: [200, 310, 420, 950, 480, 520, 610, recommendedCount * 12],
      applied: [450, 410, 350, 700, 420, 480, 500, totalCount * 10]
    });

    // 3. Рендеринг кругового за регіонами
    const regionObj = {};
    list.forEach(c => {
      regionObj[c.region] = (regionObj[c.region] || 0) + 1;
    });

    const regionColors = ['#10b981', '#3b82f6', '#f97316', '#a855f7', '#eab308', '#ef4444', '#cbd5e1'];
    const regionData = Object.keys(regionObj).map((reg, idx) => {
      return {
        label: reg,
        value: regionObj[reg],
        color: regionColors[idx % regionColors.length]
      };
    });

    Charts.initStatusDonut('analyticsRegionCanvas', regionData.length > 0 ? regionData : null);
  }

  // Експорт аналітичного PDF (Імітування та виклик print)
  document.getElementById('analyticsExportPdfBtn').addEventListener('click', () => {
    if (!verifyActionPermission('Експорт звітів')) return;

    showToast('Формування PDF', 'PDF-звіт завантажено в чергу генерації. Очікуйте...', 'success');
    
    setTimeout(() => {
      showToast('Друк активовано', 'Звіт успішно згенеровано мовою системи', 'success');
      window.print();
    }, 1500);
  });

  /**
   * =========================================
   * КОРИСТУВАЧІ СИСТЕМИ
   * =========================================
   */
  function renderUsersTable() {
    const list = DB.getUsers();
    const searchVal = document.getElementById('userSearchInput').value.toLowerCase().trim();
    const roleFilter = document.getElementById('userRoleFilter').value;

    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    const filtered = list.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchVal) || u.email.toLowerCase().includes(searchVal);
      const matchesRole = roleFilter === 'Всі ролі' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #556270; padding: 40px;">Користувачів за вказаними ролями не знайдено.</td></tr>`;
      return;
    }

    filtered.forEach(u => {
      const isDeactivated = u.status === 'Деактивований';
      const statusColor = isDeactivated ? '#ef4444' : '#10b981';
      const statusBg = isDeactivated ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="avatar-initials-box" style="width:30px; height:30px; font-size:11px;">
              ${u.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
            </div>
            <div>
              <strong style="color: #fff;">${u.name}</strong>
              <div style="font-size:11px; color:#8b95a5;">${u.email}</div>
            </div>
          </div>
        </td>
        <td><strong style="color: #cbd5e1;">${u.role}</strong></td>
        <td>
          <span class="badge-status" style="color: ${statusColor}; background-color: ${statusBg};">
            ${u.status}
          </span>
        </td>
        <td style="font-family: 'JetBrains Mono', monospace; font-size:12px;">${u.lastLogin}</td>
        <td>${u.department}</td>
        <td>
          <div class="table-acts">
            <button class="action-icon-btn btn-user-edit" title="Редагувати" data-id="${u.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button class="action-icon-btn btn-user-toggle-lock" title="${isDeactivated ? 'Активувати' : 'Блокувати'}" style="color:${isDeactivated ? '#10b981' : '#f97316'}" data-id="${u.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </button>
            <button class="action-icon-btn btn-user-delete" title="Вилучити" style="color:#ef4444;" data-id="${u.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Навісити івенти управління користувачами
    tbody.querySelectorAll('.btn-user-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!verifyActionPermission('Управління користувачами')) return;
        const id = e.currentTarget.getAttribute('data-id');
        openUserEditModal(id);
      });
    });

    tbody.querySelectorAll('.btn-user-toggle-lock').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!verifyActionPermission('Управління користувачами')) return;
        const id = e.currentTarget.getAttribute('data-id');
        toggleUserLock(id);
      });
    });

    tbody.querySelectorAll('.btn-user-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!verifyActionPermission('Управління користувачами')) return;
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Ви дійсно бажаєте безповоротно вилучити цього облікового запису з бази?')) {
          DB.deleteUser(id);
          showToast('Користувача видалено', 'Обліковий запис видалено з системи.', 'success');
          renderUsersTable();
        }
      });
    });
  }

  function toggleUserLock(id) {
    const list = DB.getUsers();
    const u = list.find(user => user.id === id);
    if (u) {
      u.status = (u.status === 'Активний') ? 'Деактивований' : 'Активний';
      DB.updateUser(id, u);
      showToast('Статус змінено', `Користувач ${u.name} тепер має статус: ${u.status}`, 'success');
      renderUsersTable();
    }
  }

  // Обробка створення користувача
  document.getElementById('createUserSubmitBtn').addEventListener('click', () => {
    const nameInput = document.getElementById('newUserName');
    const emailInput = document.getElementById('newUserEmail');
    const selectRole = document.getElementById('newUserRole');
    const deptInput = document.getElementById('newUserDept');

    if (!nameInput.value.trim() || !emailInput.value.trim() || !deptInput.value.trim()) {
      showToast('Помилка', 'Заповніть усі тактичні реквізити користувача.', 'error');
      return;
    }

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      role: selectRole.value,
      department: deptInput.value.trim()
    };

    DB.addUser(payload);
    showToast('Користувач доданий', `Створено запис військового користувача "${payload.name}"`, 'success');
    closeModal('createUserModal');
    renderUsersTable();
  });

  // Оновлення картки на формі редагування
  document.getElementById('editUserSubmitBtn').addEventListener('click', () => {
    const nameInput = document.getElementById('editUserName');
    const emailInput = document.getElementById('editUserEmail');
    const selectRole = document.getElementById('editUserRole');
    const deptInput = document.getElementById('editUserDept');

    if (!nameInput.value.trim() || !emailInput.value.trim() || !deptInput.value.trim()) {
      showToast('Помилка', 'Заповніть обов\'язкові реквізити.', 'error');
      return;
    }

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      role: selectRole.value,
      department: deptInput.value.trim()
    };

    DB.updateUser(selectedUserId, payload);
    showToast('Дані збережено', 'Інформацію користувача успішно оновлено.', 'success');
    closeModal('editUserModal');
    renderUsersTable();
  });

  function openUserEditModal(id) {
    selectedUserId = id;
    const all = DB.getUsers();
    const u = all.find(us => us.id === id);
    if (u) {
      document.getElementById('editUserName').value = u.name;
      document.getElementById('editUserEmail').value = u.email;
      document.getElementById('editUserRole').value = u.role;
      document.getElementById('editUserDept').value = u.department;
      openModal('editUserModal');
    }
  }

  /**
   * =========================================
   * РОЛІ ТА ПРАВА ДОСТУПУ (RBAC Matrix)
   * =========================================
   */
  function renderRolesMatrix() {
    const matrix = DB.getPermissionsMatrix();
    const tbody = document.getElementById('permissionsTableBody');
    tbody.innerHTML = '';

    const listRoles = ['Адміністратор', 'Рекрутер', 'Керівник', 'Оператор'];

    Object.keys(matrix).forEach(perm => {
      const tr = document.createElement('tr');
      
      let cellsHtml = `<td><strong>${perm}</strong></td>`;
      
      listRoles.forEach(role => {
        const isAllowed = matrix[perm][role];
        cellsHtml += `
          <td class="perm-checkbox-cell" data-perm="${perm}" data-role="${role}">
            <div class="perm-indicator-wrap ${isAllowed ? 'allowed' : 'denied'}">
              ${isAllowed ? 
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>` : 
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
              }
            </div>
          </td>
        `;
      });
      
      tr.innerHTML = cellsHtml;
      tbody.appendChild(tr);
    });

    // Навісити івенти на зміну прав шляхом кліку
    tbody.querySelectorAll('.perm-checkbox-cell').forEach(cell => {
      cell.addEventListener('click', (e) => {
        if (!verifyActionPermission('Управління користувачами')) return;

        const permName = e.currentTarget.getAttribute('data-perm');
        const roleName = e.currentTarget.getAttribute('data-role');
        const matrixCur = DB.getPermissionsMatrix();
        
        const currentVal = matrixCur[permName][roleName];
        const newVal = !currentVal;

        DB.updatePermission(permName, roleName, newVal);
        showToast('Дозволи змінено', `Право "${permName}" для ролі "${roleName}" змінено на: ${newVal ? 'ДОЗВОЛЕНО' : 'ЗАБОРОНЕНО'}`, 'success');
        
        // Оновити відображення рендеру
        renderRolesMatrix();
        // Заодно оновити UI
        updateTopbarProfileUI();
      });
    });
  }

  // Обробка створення ролі
  document.getElementById('btnCreateRoleTrigger').addEventListener('click', () => {
    if (!verifyActionPermission('Управління користувачами')) return;
    showToast('Створення нової ролі', 'Функція вимагає зв\'язку зі службою каталогів безпеки. Зверніться до підтримки АСУ.', 'error');
  });

  /**
   * =========================================
   * ЖУРНАЛ СИСТЕМНИХ ДІЙ (LOGS)
   * =========================================
   */
  function renderLogsTable() {
    const list = DB.getLogs();
    const searchVal = document.getElementById('logSearchInput').value.toLowerCase().trim();
    const typeFilter = document.getElementById('logTypeFilter').value;

    const tbody = document.getElementById('logsTableBody');
    tbody.innerHTML = '';

    const filtered = list.filter(l => {
      const matchesSearch = l.user.toLowerCase().includes(searchVal) || 
                            l.action.toLowerCase().includes(searchVal) || 
                            l.object.toLowerCase().includes(searchVal);
      const matchesType = typeFilter === 'Всі типи дій' || l.action === typeFilter;
      return matchesSearch && matchesType;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #556270; padding: 40px;">Журнали активності за вказаними критеріями відсутні.</td></tr>`;
      return;
    }

    filtered.forEach(l => {
      const isSuccess = l.result === 'УСПІХ';
      const indicatorColor = isSuccess ? '#10b981' : '#ef4444';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family: 'JetBrains Mono', monospace; font-size:12px; color: #8b95a5;">${l.datetime}</td>
        <td><strong>${l.user}</strong></td>
        <td><span style="color: #10b981; font-weight:600;">${l.action}</span></td>
        <td style="color:#f3f4f6;">${l.object}</td>
        <td>
          <span style="color: ${indicatorColor}; font-weight: 700; font-family: 'JetBrains Mono', monospace; font-size:11px;">
            ${l.result}
          </span>
        </td>
        <td style="font-family: 'JetBrains Mono', monospace; font-size:12px; color: #8b95a5;">${l.ip}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Експорт логів як файл .txt
  document.getElementById('logsExportBtn').addEventListener('click', () => {
    if (!verifyActionPermission('Перегляд журналу дій')) return;

    const list = DB.getLogs();
    let textContent = `========================================================\n`;
    textContent += `     АСУ "РЕКРУТ+" - ТАКТИЧНИЙ ЖУРНАЛ СИСТЕМНИХ ДІЙ\n`;
    textContent += `========================================================\n`;
    textContent += `Дата вивантаження: ${new Date().toISOString()}\n\n`;

    list.forEach(l => {
      textContent += `[${l.datetime}] Користувач: ${l.user} | Дія: ${l.action} | Об'єкт: ${l.object} | Результат: ${l.result} | IP: ${l.ip}\n`;
    });

    // Створення посилання на завантаження блоба
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `recruit_system_logs_${new Date().toISOString().substring(0,10)}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Експорт логів', 'Журнал системних логів завантажено у форматі .txt успішно.', 'success');
  });

  /**
   * =========================================
   * НАЛАШТУВАННЯ СИСТЕМИ
   * =========================================
   */
  function renderSettingsForm() {
    const s = DB.getSettings();
    document.getElementById('settSystemName').value = s.systemName;
    document.getElementById('settOrg').value = s.organization;
    document.getElementById('settBackup').value = s.backupPeriod;
    document.getElementById('sett2fa').checked = s.twoFactor;
    document.getElementById('settSession').value = s.sessionTimeout;
    document.getElementById('settLanguage').value = s.interfaceLanguage;
  }

  // Зберегти налаштування
  document.getElementById('settingsSaveBtn').addEventListener('click', () => {
    if (!verifyActionPermission('Управління користувачами')) return;

    const payload = {
      systemName: document.getElementById('settSystemName').value.trim(),
      organization: document.getElementById('settOrg').value.trim(),
      backupPeriod: document.getElementById('settBackup').value.trim(),
      twoFactor: document.getElementById('sett2fa').checked,
      sessionTimeout: document.getElementById('settSession').value.trim(),
      interfaceLanguage: document.getElementById('settLanguage').value
    };

    DB.updateSettings(payload);
    showToast('Налаштування збережені', 'Загальні тактичні параметри АСУ успішно верифіковано.', 'success');
    updateTopbarProfileUI();
  });

  /**
   * =========================================
   * МОДАЛЬНІ ВІКНА (ПЕРЕГЛЯД ТА РЕДАГУВАННЯ КАНДИДАТІВ)
   * =========================================
   */
  function openCandidateViewModal(id) {
    selectedCandidateId = id;
    const c = DB.getCandidateById(id);
    if (!c) return;

    // Складання ПІБ
    document.getElementById('vModalTitle').textContent = `Тактична справа кандидата [${c.id}]`;
    document.getElementById('vFio').textContent = c.fullName;
    document.getElementById('vPhone').textContent = c.phone;
    document.getElementById('vEmail').textContent = c.email;
    document.getElementById('vBirthDate').textContent = c.birthDate;
    document.getElementById('vGender').textContent = c.gender;
    document.getElementById('vIpn').textContent = c.ipn || 'Відсутній';
    document.getElementById('vRegion').textContent = c.region;
    document.getElementById('vCity').textContent = c.city;
    document.getElementById('vAddress').textContent = c.address || 'Не вказано';

    document.getElementById('vEduc').textContent = c.educationLevel;
    document.getElementById('vInst').textContent = c.institution;
    document.getElementById('vSpec').textContent = c.speciality;
    document.getElementById('vWork').textContent = c.workExperience || 'Немає відомостей';
    document.getElementById('vMil').textContent = c.militaryExperience || 'Немає відомостей';
    document.getElementById('vUnit').textContent = c.desiredUnit;

    // Статус та Етап
    const meta = STATUS_META[c.status] || { color: '#8b95a5', bg: 'rgba(255,255,255,0.05)' };
    const statusBox = document.getElementById('vStatusBox');
    statusBox.textContent = c.status;
    statusBox.style.color = meta.color;
    statusBox.style.backgroundColor = meta.bg;
    
    document.getElementById('vStage').textContent = c.stage;

    // Файли документів
    const docsCont = document.getElementById('vDocsList');
    docsCont.innerHTML = '';
    if (c.documents.length === 0) {
      docsCont.innerHTML = `<div style="color: #4b5563; font-size:12px;">Жодних документів до справи ще не прикріплено.</div>`;
    } else {
      c.documents.forEach(doc => {
        const row = document.createElement('div');
        row.className = 'modal-doc-row';
        row.innerHTML = `
          <span class="modal-doc-type-bullet">${doc.type}</span>
          <span class="modal-doc-file-lnk" onclick="alert('Відкриття файлу ${doc.fileName} заблоковано режимом секретності військової частини.')">${doc.fileName}</span>
          <span class="badge-status" style="font-size: 10px; padding: 2px 8px; border-radius: 6px; background: rgba(255,255,255,0.02); color: #8b95a5;">
            ${doc.status}
          </span>
        `;
        docsCont.appendChild(row);
      });
    }

    // Лист Історії змін
    const histCont = document.getElementById('vTimelineContainer');
    histCont.innerHTML = '';
    if (!c.history || c.history.length === 0) {
      histCont.innerHTML = `<div style="color: #4b5563; font-size:12px;">Журнал змін справи порожній.</div>`;
    } else {
      c.history.forEach(h => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
          <div class="timeline-dot"></div>
          <span class="timeline-time">${h.datetime}</span>
          <div class="timeline-author">${h.user}</div>
          <p class="timeline-text">${h.comment}</p>
        `;
        histCont.appendChild(item);
      });
    }

    openModal('viewCandidateModal');
  }

  // Відкриття форми редагування кандидата
  function openCandidateEditModal(id) {
    selectedCandidateId = id;
    const c = DB.getCandidateById(id);
    if (!c) return;

    document.getElementById('editLastName').value = c.lastName;
    document.getElementById('editFirstName').value = c.firstName;
    document.getElementById('editMiddleName').value = c.middleName;
    document.getElementById('editBirthDate').value = c.birthDate;
    document.getElementById('editSex').value = c.gender;
    document.getElementById('editIpn').value = c.ipn || '';
    
    document.getElementById('editPhone').value = c.phone;
    document.getElementById('editEmail').value = c.email;
    document.getElementById('editRegion').value = c.region;
    document.getElementById('editCity').value = c.city;
    document.getElementById('editAddress').value = c.address || '';

    document.getElementById('editEducationLevel').value = c.educationLevel;
    document.getElementById('editInstitution').value = c.institution;
    document.getElementById('editSpeciality').value = c.speciality;
    document.getElementById('editWorkExperience').value = c.workExperience || '';
    document.getElementById('editMilitaryExperience').value = c.militaryExperience || '';
    document.getElementById('editDesiredUnit').value = c.desiredUnit;

    openModal('editCandidateModal');
  }

  // Обробка збереження відредагованого кандидата
  document.getElementById('editCandidateSubmitBtn').addEventListener('click', () => {
    const ln = document.getElementById('editLastName');
    const fn = document.getElementById('editFirstName');
    const bd = document.getElementById('editBirthDate');
    const ipn = document.getElementById('editIpn');
    const ph = document.getElementById('editPhone');
    const em = document.getElementById('editEmail');

    let isValid = true;
    [ln, fn, bd, ph, em].forEach(el => el.classList.remove('error'));

    if (!ln.value.trim()) { ln.classList.add('error'); isValid = false; }
    if (!fn.value.trim()) { fn.classList.add('error'); isValid = false; }
    if (!bd.value) { bd.classList.add('error'); isValid = false; }
    if (!ph.value.trim()) { ph.classList.add('error'); isValid = false; }
    if (!em.value.trim()) { em.classList.add('error'); isValid = false; }

    const emVal = em.value.trim();
    if (emVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emVal)) {
      em.classList.add('error');
      isValid = false;
    }

    const ipnVal = ipn.value.trim();
    if (ipnVal && (!/^\d{10}$/.test(ipnVal))) {
      ipn.classList.add('error');
      isValid = false;
    }

    if (!isValid) {
      showToast('Помилка валідації', 'Перевірте обов\'язкові дані.', 'error');
      return;
    }

    const payload = {
      lastName: ln.value.trim(),
      firstName: fn.value.trim(),
      middleName: document.getElementById('editMiddleName').value.trim(),
      birthDate: bd.value,
      gender: document.getElementById('editSex').value,
      ipn: ipnVal,
      phone: ph.value.trim(),
      email: emVal,
      region: document.getElementById('editRegion').value,
      city: document.getElementById('editCity').value.trim(),
      address: document.getElementById('editAddress').value.trim(),
      educationLevel: document.getElementById('editEducationLevel').value,
      institution: document.getElementById('editInstitution').value.trim(),
      speciality: document.getElementById('editSpeciality').value.trim(),
      workExperience: document.getElementById('editWorkExperience').value.trim(),
      militaryExperience: document.getElementById('editMilitaryExperience').value.trim(),
      desiredUnit: document.getElementById('editDesiredUnit').value
    };

    DB.updateCandidate(selectedCandidateId, payload);
    showToast('Справу оновлено', 'Військові анкетні дані кандидата успішно скориговані.', 'success');
    
    closeModal('editCandidateModal');
    
    // Перезавантаження
    renderCandidatesTable();
  });

  // Модалка підтвердження утилізації кандидата
  function openDeleteConfirmationModal(id) {
    selectedCandidateId = id;
    const c = DB.getCandidateById(id);
    if (c) {
      document.getElementById('deleteTargetName').textContent = `${c.fullName} (${c.id})`;
      openModal('deleteCandidateModal');
    }
  }

  document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    DB.deleteCandidate(selectedCandidateId);
    showToast('Видалено з бази', 'Дані кандидата успішно видалено з активної картотеки СБ.', 'success');
    closeModal('deleteCandidateModal');
    renderCandidatesTable();
  });

  /**
   * =========================================
   * ГЛОБАЛЬНИЙ ПОШУК В TOPBAR
   * =========================================
   */
  function setupGlobalSearch() {
    const input = document.getElementById('globalSearchInput');
    const dropdown = document.getElementById('globalSearchResultsDropdown');

    if (input && dropdown) {
      input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 2) {
          dropdown.classList.remove('show');
          return;
        }

        // Шукаємо по Кандидатах
        const allCandidates = DB.getCandidates();
        const candMatches = allCandidates.filter(c => 
          c.fullName.toLowerCase().includes(query) || 
          c.id.toLowerCase().includes(query) || 
          c.phone.includes(query)
        );

        // Шукаємо по Користувачах
        const allUsers = DB.getUsers();
        const userMatches = allUsers.filter(u => 
          u.name.toLowerCase().includes(query) || 
          u.email.toLowerCase().includes(query)
        );

        // Будуємо HTML
        let htmlVal = '';

        if (candMatches.length > 0) {
          htmlVal += `<div class="search-result-group"><div class="search-result-group-header">Кандидати</div>`;
          candMatches.forEach(c => {
            htmlVal += `
              <div class="search-result-item g-search-cand" data-id="${c.id}">
                <div class="search-result-item-title">${c.fullName} (${c.id})</div>
                <div class="search-result-item-subtitle">${c.phone} | Етап: ${c.stage}</div>
              </div>
            `;
          });
          htmlVal += `</div>`;
        }

        if (userMatches.length > 0) {
          htmlVal += `<div class="search-result-group"><div class="search-result-group-header">Співробітники</div>`;
          userMatches.forEach(u => {
            htmlVal += `
              <div class="search-result-item g-search-user">
                <div class="search-result-item-title">${u.name}</div>
                <div class="search-result-item-subtitle">${u.email} | Роль: ${u.role}</div>
              </div>
            `;
          });
          htmlVal += `</div>`;
        }

        if (candMatches.length === 0 && userMatches.length === 0) {
          htmlVal = `<div style="padding: 16px; text-align: center; color: #8b95a5; font-size:12.5px;">За оборонним запитом нічого не знайдено.</div>`;
        }

        dropdown.innerHTML = htmlVal;
        dropdown.classList.add('show');

        // Івенти для результатів пошуку
        dropdown.querySelectorAll('.g-search-cand').forEach(item => {
          item.addEventListener('click', (ev) => {
            const cid = ev.currentTarget.getAttribute('data-id');
            dropdown.classList.remove('show');
            input.value = '';
            
            if (verifyActionPermission('Перегляд кандидатів')) {
              openCandidateViewModal(cid);
            }
          });
        });
      });

      // Перехоплення кліку поза вікном результатів
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
          dropdown.classList.remove('show');
        }
      });
    }
  }

  /**
   * =========================================
   * ДОПОМІЖНІ ОБРОБНИКИ ТА КОНСТРУКТОРИ ІВЕНТІВ
   * =========================================
   */
  function setupEventListeners() {
    // Вкладка Кандидатів
    document.getElementById('candidateSearchInput').addEventListener('input', renderCandidatesTable);
    document.getElementById('candidateStatusFilter').addEventListener('change', renderCandidatesTable);
    document.getElementById('candidateResetFilterBtn').addEventListener('click', () => {
      document.getElementById('candidateSearchInput').value = '';
      document.getElementById('candidateStatusFilter').value = 'Всі статуси';
      renderCandidatesTable();
    });
    
    // Кнопка швидкого створення кандидата на базі
    document.getElementById('candidateAddBtn').addEventListener('click', () => {
      renderActiveSection('new-candidate');
    });

    // Документи
    document.getElementById('docSearchInput').addEventListener('input', renderDocumentsTable);
    document.getElementById('docTypeFilter').addEventListener('change', renderDocumentsTable);

    // Користувачі
    document.getElementById('userSearchInput').addEventListener('input', renderUsersTable);
    document.getElementById('userRoleFilter').addEventListener('change', renderUsersTable);
    document.getElementById('userCreateBtn').addEventListener('click', () => {
      if (!verifyActionPermission('Управління користувачами')) return;
      document.getElementById('newUserName').value = '';
      document.getElementById('newUserEmail').value = '';
      document.getElementById('newUserDept').value = '';
      openModal('createUserModal');
    });

    // Логи
    document.getElementById('logSearchInput').addEventListener('input', renderLogsTable);
    document.getElementById('logTypeFilter').addEventListener('change', renderLogsTable);

    // Оновити дані на системному огляді
    const refreshDashBtn = document.getElementById('dashboardRefreshBtn');
    if (refreshDashBtn) {
      refreshDashBtn.addEventListener('click', () => {
        showToast('Оновлення бази', 'Проведено синхронізацію з локальною базою даних.', 'success');
        renderDashboard();
      });
    }

    // Блокування кнопок модалок на закриття
    document.querySelectorAll('.modal-close-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.currentTarget.closest('.modal-backdrop');
        if (modal) {
          modal.classList.remove('show');
        }
      });
    });
  }

  /**
   * =========================================
   * СЕРВІС ВСПЛИВАЮЧИХ ТОСТІВ ТА МОДАЛОК
   * =========================================
   */
  function showToast(header, msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
    
    // Іконки під тип
    let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    if (type === 'error') {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <div class="toast-msg-area">
        <span class="toast-header-text">${header}</span>
        <span class="toast-body-text">${msg}</span>
      </div>
    `;

    container.appendChild(toast);

    // Видалення автоматично через 4 секунди
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('show');
    }
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('show');
    }
  }
});
