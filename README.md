# Info REST API

REST API на Node.js для отримання погоди, курсів валют та новин із зовнішніх джерел.

## Технології

| Пакет | Призначення |
|---|---|
| **express** | HTTP-сервер та маршрутизація |
| **axios** | HTTP-клієнт для зовнішніх API |
| **node-cache** | In-memory кешування відповідей |
| **winston** | Структуроване логування у файли і консоль |
| **morgan** | HTTP request logger (через winston) |
| **dotenv** | Завантаження змінних оточення |

## Запуск

```bash
npm install
npm start          # production
npm run dev        # розробка (nodemon)
```

Сервер стартує на `http://localhost:3000` (можна змінити PORT у `.env`).

---

## Ендпоінти

### `GET /`
Список усіх доступних маршрутів.

---

### `GET /weather`

| Параметр | Обов'язковий | За замовч. | Опис |
|---|---|---|---|
| `city` | ✅ | — | Назва міста |
| `units` | ❌ | `metric` | `standard` / `metric` / `imperial` |
| `lang` | ❌ | `en` | Код мови відповіді |

**Приклад:**
```
GET /weather?city=Kyiv&units=metric&lang=ua
```

**Відповідь:**
```json
{
  "success": true,
  "source": "OpenWeatherMap",
  "cached": false,
  "data": {
    "city": "Kyiv",
    "country": "UA",
    "weather": { "description": "overcast clouds", "icon": "..." },
    "temperature": { "current": "10.96°C", ... },
    "humidity": "52%",
    "wind": { "speed": "0.45 m/s", "direction": 217 }
  }
}
```

---

### `GET /currency`

| Параметр | Обов'язковий | За замовч. | Опис |
|---|---|---|---|
| `base` | ❌ | `EUR` | Базова валюта (free plan = лише EUR) |
| `symbols` | ❌ | всі | Список валют через кому |

**Приклад:**
```
GET /currency?base=EUR&symbols=USD,UAH,GBP
```

> **Примітка:** Безкоштовний тариф ExchangeRatesAPI підтримує лише `EUR` як базову валюту.

---

### `GET /news`

| Параметр | Обов'язковий | За замовч. | Опис |
|---|---|---|---|
| `q` | ❌ | `latest` | Ключове слово пошуку |
| `lang` | ❌ | `en` | Код мови |
| `country` | ❌ | — | 2-літерний код країни |
| `max` | ❌ | `10` | Кількість статей (1–10) |

**Приклад:**
```
GET /news?q=Ukraine&lang=en&max=5
```

---

## Кешування

| Маршрут | TTL |
|---|---|
| `/weather` | 10 хвилин |
| `/currency` | 1 година |
| `/news` | 15 хвилин |

Кеш зберігається в пам'яті процесу (`node-cache`). Ключем є повний URL із query-параметрами. При `Cache HIT` зовнішній API не викликається.

---

## Логування

Логи пишуться у:
- **консоль** — всі рівні (`INFO`, `HTTP`, `ERROR`)
- `logs/combined.log` — всі рівні
- `logs/error.log` — лише помилки

Формат: `[YYYY-MM-DD HH:mm:ss] LEVEL: message`

---

## Структура проєкту

```
lab1/
├── config/
│   └── index.js          # Конфігурація з .env
├── logs/                  # Автоматично створюється
├── middleware/
│   ├── cache.js           # Кешування відповідей
│   ├── errorHandler.js    # Централізована обробка помилок
│   └── logger.js          # Winston + Morgan
├── routes/
│   ├── weather.js         # GET /weather
│   ├── currency.js        # GET /currency
│   └── news.js            # GET /news
├── .env                   # API ключі та налаштування
├── package.json
└── server.js              # Точка входу
```
