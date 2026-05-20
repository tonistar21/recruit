INSERT INTO roles (role_name, description)
VALUES
    ('Адміністратор', 'Повний доступ до системи'),
    ('Рекрутер', 'Робота з кандидатами та документами'),
    ('Керівник', 'Перегляд аналітики та звітів'),
    ('Оператор', 'Первинне внесення даних')
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO permissions (permission_code, permission_name, description)
VALUES
    ('view_candidates', 'Перегляд кандидатів', 'Перегляд карток кандидатів'),
    ('create_candidate', 'Створення анкет', 'Створення нових анкет кандидатів'),
    ('edit_candidate', 'Редагування анкет', 'Редагування даних кандидатів'),
    ('delete_candidate', 'Видалення анкет', 'Архівування або видалення кандидатів'),
    ('upload_documents', 'Завантаження документів', 'Робота з документами кандидатів'),
    ('change_status', 'Зміна статусів', 'Зміна статусу та етапів відбору'),
    ('view_analytics', 'Перегляд аналітики', 'Перегляд аналітики та графіків'),
    ('manage_users', 'Управління користувачами', 'Створення та редагування користувачів'),
    ('view_logs', 'Перегляд журналу дій', 'Перегляд системного журналу'),
    ('export_reports', 'Експорт звітів', 'Експорт логів та звітів')
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM roles r
JOIN permissions p ON (
    (r.role_name = 'Адміністратор')
    OR (r.role_name = 'Рекрутер' AND p.permission_code IN ('view_candidates', 'create_candidate', 'edit_candidate', 'upload_documents', 'change_status', 'view_analytics', 'export_reports'))
    OR (r.role_name = 'Керівник' AND p.permission_code IN ('view_candidates', 'view_analytics', 'export_reports'))
    OR (r.role_name = 'Оператор' AND p.permission_code IN ('view_candidates', 'create_candidate', 'upload_documents'))
)
ON CONFLICT DO NOTHING;
