# Ролі та права

| Permission | Адмін | Рекрутер | Керівник | Оператор | Кандидат |
|---|---:|---:|---:|---:|---:|
| candidates.read | ✓ | ✓ | ✓ | ✓ | власний |
| candidates.create | ✓ | ✓ |  | ✓ |  |
| candidates.update | ✓ | призначені |  | ✓ | власний |
| candidates.archive | ✓ | призначені |  |  |  |
| documents.read/upload | ✓ | ✓ | read | ✓ | власні |
| documents.verify | ✓ | ✓ |  |  |  |
| stages.update | ✓ | ✓ | ✓ |  |  |
| interviews.manage | ✓ | ✓ |  |  |  |
| analytics.read | ✓ | ✓ | ✓ |  |  |
| users/roles/settings.manage | ✓ |  |  |  |  |
| audit.read | ✓ |  | ✓ |  |  |

Backend перевіряє permission та належність кандидата. Frontend лише приховує недоступну навігацію.
