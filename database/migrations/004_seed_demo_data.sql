INSERT INTO users (role_id, full_name, email, username, password_hash, status, department, last_login)
VALUES
    ((SELECT id_role FROM roles WHERE role_name = 'Адміністратор'), 'Петренко Олексій', 'petrenko@recruit.gov.ua', 'admin', '$2a$10$hidr9tSiKmnauzwWHLBlcOyouA..S.42DEANgTEq4rJHFaw3lZDam', 'Активний', 'Головне управління', CURRENT_TIMESTAMP),
    ((SELECT id_role FROM roles WHERE role_name = 'Рекрутер'), 'Іванов Сергій', 'ivanov@recruit.gov.ua', 'recruiter', '$2a$10$Oqj9Pbl7WxcKACW0R04syOiMieHAkuu4WT8vOTWScMxLbavALhjTC', 'Активний', 'Львівський ЦР', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

INSERT INTO candidates (
    public_id, last_name, first_name, middle_name, birth_date, gender, ipn, phone, email,
    region, city, address, education_level, institution, speciality, work_experience,
    military_experience, desired_unit, current_status_id, current_stage_id, recruiter_id,
    registration_date, updated_at, is_archived
)
VALUES
    ('C-1024', 'Коваленко', 'Олександр', 'Петрович', '1992-06-15', 'Чоловіча', '3245678901', '+380 67 123 45 67', 'kovalenko.o@gmail.com', 'Київська', 'Київ', 'вул. Хрещатик, 15, кв. 4', 'Вища', 'Київський національний університет ім. Т. Шевченка', 'Кібербезпека', '7 років у системному адмініструванні', 'Військова кафедра', 'Сили безпілотних систем (СБС)', (SELECT id_status FROM candidate_status WHERE status_name = 'Співбесіда'), (SELECT id_stage FROM selection_stages WHERE stage_name = 'Співбесіда з психологом'), (SELECT id_user FROM users WHERE username = 'recruiter'), '2024-03-10 11:20:00', '2024-03-21 11:45:22', FALSE),
    ('C-1025', 'Сидоренко', 'Марія', 'Іванівна', '1995-12-04', 'Жіноча', '3487654321', '+380 50 987 65 43', 'sydorenko.m@ukr.net', 'Львівська', 'Львів', 'просп. Свободи, 24, кв. 12', 'Вища (магістр)', 'Львівська Політехніка', 'Фармація / Військова медицина', '4 роки роботи бойовим медиком-волонтером', 'Курси тактичної медицини (TCCC MP)', 'Медична служба (Сили ТрО)', (SELECT id_status FROM candidate_status WHERE status_name = 'Перевірка документів'), (SELECT id_stage FROM selection_stages WHERE stage_name = 'Перевірка документів'), (SELECT id_user FROM users WHERE username = 'recruiter'), '2024-03-12 09:15:00', '2024-03-21 11:40:10', FALSE),
    ('C-1026', 'Мельник', 'Дмитро', 'Сергійович', '1989-03-22', 'Чоловіча', '3156444556', '+380 63 444 55 66', 'd.melnyk@outlook.com', 'Одеська', 'Одеса', 'вул. Дерибасівська, 8, кв. 19', 'Середня спеціальна', 'Одеський морехідний коледж', 'Судноводіння', '10 років роботи на торговельних суднах', 'Немає', 'Військово-Морські Сили (ВМС)', (SELECT id_status FROM candidate_status WHERE status_name = 'Новий'), (SELECT id_stage FROM selection_stages WHERE stage_name = 'Первинна реєстрація'), (SELECT id_user FROM users WHERE username = 'recruiter'), '2024-03-20 16:40:00', '2024-03-20 16:40:00', FALSE),
    ('C-1027', 'Бондар', 'Андрій', 'Вікторович', '1994-11-11', 'Чоловіча', '3311122233', '+380 99 111 22 33', 'andriy.bondar@icloud.com', 'Дніпропетровська', 'Дніпро', 'просп. Яворницького, 102, кв. 77', 'Вища', 'Дніпровський національний університет', 'Радіотехніка', 'Інженер зв''язку, розробка та обслуговування РЕБ рішень', 'Служба за контрактом (2 роки), лейтенант запасу', 'Сили територіальної оборони (РЕБ/РЕР)', (SELECT id_status FROM candidate_status WHERE status_name = 'Рекомендовано'), (SELECT id_stage FROM selection_stages WHERE stage_name = 'Очікування наказу'), (SELECT id_user FROM users WHERE username = 'recruiter'), '2024-02-28 10:00:00', '2024-03-18 15:30:00', FALSE),
    ('C-1028', 'Ткаченко', 'Олена', 'Василівна', '1997-09-18', 'Жіноча', '3577788899', '+380 67 777 88 99', 'olena.tkachenko@recruit.gov.ua', 'Харківська', 'Харків', 'вул. Сумська, 45, кв. 11', 'Вища (бакалавр)', 'Харківський авіаційний інститут (ХАІ)', 'Авіоніка та БПЛА', 'Інструктор у школі пілотування дронів', 'Немає', 'Аеророзвідка (Сили безпілотних систем)', (SELECT id_status FROM candidate_status WHERE status_name = 'Тестування'), (SELECT id_stage FROM selection_stages WHERE stage_name = 'Професійне тестування'), (SELECT id_user FROM users WHERE username = 'recruiter'), '2024-03-14 14:30:00', '2024-03-19 13:20:00', FALSE)
ON CONFLICT (public_id) DO NOTHING;

INSERT INTO candidate_documents (candidate_id, document_type_id, file_name, original_file_name, file_path, mime_type, file_size, status, uploaded_by, uploaded_at)
VALUES
    ((SELECT id_candidate FROM candidates WHERE public_id = 'C-1024'), (SELECT id_document_type FROM document_types WHERE type_name = 'Паспорт'), 'passport_kovalenko.pdf', 'passport_kovalenko.pdf', 'uploads/passport_kovalenko.pdf', 'application/pdf', 125000, 'Підтверджено', (SELECT id_user FROM users WHERE username = 'admin'), '2024-03-10 11:25:00'),
    ((SELECT id_candidate FROM candidates WHERE public_id = 'C-1024'), (SELECT id_document_type FROM document_types WHERE type_name = 'ІПН'), 'ipn_kovalenko.pdf', 'ipn_kovalenko.pdf', 'uploads/ipn_kovalenko.pdf', 'application/pdf', 84000, 'Підтверджено', (SELECT id_user FROM users WHERE username = 'admin'), '2024-03-10 11:26:00'),
    ((SELECT id_candidate FROM candidates WHERE public_id = 'C-1025'), (SELECT id_document_type FROM document_types WHERE type_name = 'Паспорт'), 'passport_sydorenko.pdf', 'passport_sydorenko.pdf', 'uploads/passport_sydorenko.pdf', 'application/pdf', 130000, 'Підтверджено', (SELECT id_user FROM users WHERE username = 'recruiter'), '2024-03-12 09:20:00'),
    ((SELECT id_candidate FROM candidates WHERE public_id = 'C-1025'), (SELECT id_document_type FROM document_types WHERE type_name = 'Диплом'), 'medical_diploma.pdf', 'medical_diploma.pdf', 'uploads/medical_diploma.pdf', 'application/pdf', 145000, 'Очікує перевірки', (SELECT id_user FROM users WHERE username = 'recruiter'), '2024-03-21 11:40:10'),
    ((SELECT id_candidate FROM candidates WHERE public_id = 'C-1026'), (SELECT id_document_type FROM document_types WHERE type_name = 'Паспорт'), 'passport_melnyk.pdf', 'passport_melnyk.pdf', 'uploads/passport_melnyk.pdf', 'application/pdf', 101000, 'Очікує перевірки', (SELECT id_user FROM users WHERE username = 'recruiter'), '2024-03-20 16:40:10')
ON CONFLICT DO NOTHING;

INSERT INTO candidate_stage_history (candidate_id, stage_id, status_id, changed_by, changed_at, comment)
VALUES
    ((SELECT id_candidate FROM candidates WHERE public_id = 'C-1024'), (SELECT id_stage FROM selection_stages WHERE stage_name = 'Первинна реєстрація'), (SELECT id_status FROM candidate_status WHERE status_name = 'Первинна реєстрація'), (SELECT id_user FROM users WHERE username = 'admin'), '2024-03-10 11:20:00', 'Первинна реєстрація кандидата.'),
    ((SELECT id_candidate FROM candidates WHERE public_id = 'C-1024'), (SELECT id_stage FROM selection_stages WHERE stage_name = 'Співбесіда з психологом'), (SELECT id_status FROM candidate_status WHERE status_name = 'Співбесіда'), (SELECT id_user FROM users WHERE username = 'admin'), '2024-03-21 11:45:22', 'Призначено співбесіду з психологом.'),
    ((SELECT id_candidate FROM candidates WHERE public_id = 'C-1025'), (SELECT id_stage FROM selection_stages WHERE stage_name = 'Перевірка документів'), (SELECT id_status FROM candidate_status WHERE status_name = 'Перевірка документів'), (SELECT id_user FROM users WHERE username = 'recruiter'), '2024-03-21 11:40:10', 'Завантажено медичний диплом для перевірки.'),
    ((SELECT id_candidate FROM candidates WHERE public_id = 'C-1026'), (SELECT id_stage FROM selection_stages WHERE stage_name = 'Первинна реєстрація'), (SELECT id_status FROM candidate_status WHERE status_name = 'Новий'), (SELECT id_user FROM users WHERE username = 'recruiter'), '2024-03-20 16:40:00', 'Первинна реєстрація кандидата.'),
    ((SELECT id_candidate FROM candidates WHERE public_id = 'C-1027'), (SELECT id_stage FROM selection_stages WHERE stage_name = 'Очікування наказу'), (SELECT id_status FROM candidate_status WHERE status_name = 'Рекомендовано'), (SELECT id_user FROM users WHERE username = 'admin'), '2024-03-18 15:30:00', 'Погоджено командуванням бригади.'),
    ((SELECT id_candidate FROM candidates WHERE public_id = 'C-1028'), (SELECT id_stage FROM selection_stages WHERE stage_name = 'Професійне тестування'), (SELECT id_status FROM candidate_status WHERE status_name = 'Тестування'), (SELECT id_user FROM users WHERE username = 'recruiter'), '2024-03-19 13:20:00', 'Успішно пройдено первинний етап перевірки СБ.')
ON CONFLICT DO NOTHING;

INSERT INTO recruitment_process (candidate_id, stage_id, process_type, result, score, notes, responsible_user_id, process_date)
VALUES
    ((SELECT id_candidate FROM candidates WHERE public_id = 'C-1024'), (SELECT id_stage FROM selection_stages WHERE stage_name = 'Співбесіда з психологом'), 'Психологічна співбесіда', 'Заплановано', NULL, 'Очікується проведення співбесіди', (SELECT id_user FROM users WHERE username = 'admin'), '2024-03-21 11:45:22'),
    ((SELECT id_candidate FROM candidates WHERE public_id = 'C-1027'), (SELECT id_stage FROM selection_stages WHERE stage_name = 'Очікування наказу'), 'Погодження командування', 'Схвалено', 98.00, 'Очікується наказ Генштабу', (SELECT id_user FROM users WHERE username = 'admin'), '2024-03-18 15:30:00'),
    ((SELECT id_candidate FROM candidates WHERE public_id = 'C-1028'), (SELECT id_stage FROM selection_stages WHERE stage_name = 'Професійне тестування'), 'Тестування', 'Пройдено', 91.50, 'Високий рівень підготовки', (SELECT id_user FROM users WHERE username = 'recruiter'), '2024-03-19 13:20:00')
ON CONFLICT DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, updated_by)
VALUES
    ('systemName', 'АСУ "Рекрут+"', (SELECT id_user FROM users WHERE username = 'admin')),
    ('organization', 'Міністерство оборони України / ЗСУ', (SELECT id_user FROM users WHERE username = 'admin')),
    ('backupPeriod', 'Щодня о 03:00', (SELECT id_user FROM users WHERE username = 'admin')),
    ('twoFactor', 'true', (SELECT id_user FROM users WHERE username = 'admin')),
    ('sessionTimeout', '60 хвилин', (SELECT id_user FROM users WHERE username = 'admin')),
    ('interfaceLanguage', 'Українська', (SELECT id_user FROM users WHERE username = 'admin'))
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO logs (log_time, user_id, user_name, action, object_type, object_id, old_value, new_value, result, ip_address, user_agent)
VALUES
    ('2026-05-19 21:05:12', (SELECT id_user FROM users WHERE username = 'admin'), 'Петренко Олексій', 'Зміна статусу', 'candidate', 'C-1024', NULL, '{"status":"Співбесіда"}', 'SUCCESS', '192.168.1.45', 'seed'),
    ('2026-05-19 21:00:10', (SELECT id_user FROM users WHERE username = 'recruiter'), 'Іванов Сергій', 'Завантаження документа', 'document', 'C-1025', NULL, '{"document":"medical_diploma.pdf"}', 'SUCCESS', '192.168.2.12', 'seed'),
    ('2026-05-19 20:34:55', (SELECT id_user FROM users WHERE username = 'admin'), 'Петренко Олексій', 'Перегляд аналітики', 'report', 'dashboard', NULL, NULL, 'SUCCESS', '192.168.1.45', 'seed'),
    ('2026-05-19 19:42:11', (SELECT id_user FROM users WHERE username = 'recruiter'), 'Іванов Сергій', 'Створення анкети', 'candidate', 'C-1026', NULL, '{"public_id":"C-1026"}', 'SUCCESS', '192.168.3.111', 'seed')
ON CONFLICT DO NOTHING;
