"""
Training examples for the TextCategorizer (intent classifier).
Each example is a tuple: (text, {"cats": {"INTENT": 1.0, ...}})
All intents not active for a given example are set to 0.0.
"""

INTENTS = ["WEATHER", "CURRENCY", "GREETING", "OTHER"]


def make_cats(active: str) -> dict:
    return {"cats": {intent: 1.0 if intent == active else 0.0 for intent in INTENTS}}


TRAIN_DATA = [
    # ── WEATHER ──────────────────────────────────────────────────────────────
    ("яка погода в Києві", make_cats("WEATHER")),
    ("яка погода сьогодні", make_cats("WEATHER")),
    ("скажи яка погода в Харкові", make_cats("WEATHER")),
    ("погода у Львові", make_cats("WEATHER")),
    ("погода на завтра", make_cats("WEATHER")),
    ("чи буде дощ завтра", make_cats("WEATHER")),
    ("чи піде сніг сьогодні", make_cats("WEATHER")),
    ("яка температура на вулиці", make_cats("WEATHER")),
    ("температура в Одесі", make_cats("WEATHER")),
    ("прогноз погоди на тиждень", make_cats("WEATHER")),
    ("що з погодою у Дніпрі", make_cats("WEATHER")),
    ("чи є вітер у Запоріжжі", make_cats("WEATHER")),
    ("хмарно чи сонячно в Полтаві", make_cats("WEATHER")),
    ("weather in Kyiv", make_cats("WEATHER")),
    ("what is the weather in London", make_cats("WEATHER")),
    ("tell me the weather forecast", make_cats("WEATHER")),
    ("is it raining in Paris", make_cats("WEATHER")),
    ("temperature in Berlin", make_cats("WEATHER")),
    ("will it snow tomorrow", make_cats("WEATHER")),
    ("how hot is it in Odesa", make_cats("WEATHER")),
    ("current weather conditions", make_cats("WEATHER")),
    ("give me weather for Warsaw", make_cats("WEATHER")),
    ("погода Київ", make_cats("WEATHER")),
    ("погода Одеса", make_cats("WEATHER")),
    ("яка погода в Берліні", make_cats("WEATHER")),
    ("яка погода в Парижі", make_cats("WEATHER")),

    # ── CURRENCY ─────────────────────────────────────────────────────────────
    ("який курс долара сьогодні", make_cats("CURRENCY")),
    ("курс євро до гривні", make_cats("CURRENCY")),
    ("скільки коштує долар", make_cats("CURRENCY")),
    ("курс валют", make_cats("CURRENCY")),
    ("яка вартість фунта", make_cats("CURRENCY")),
    ("покажи курс обміну", make_cats("CURRENCY")),
    ("конвертер валют", make_cats("CURRENCY")),
    ("скільки гривень за євро", make_cats("CURRENCY")),
    ("курс долара USD", make_cats("CURRENCY")),
    ("exchange rate USD to UAH", make_cats("CURRENCY")),
    ("what is the euro rate", make_cats("CURRENCY")),
    ("convert EUR to UAH", make_cats("CURRENCY")),
    ("currency exchange rate", make_cats("CURRENCY")),
    ("how much is dollar today", make_cats("CURRENCY")),
    ("GBP exchange rate", make_cats("CURRENCY")),
    ("PLN to UAH", make_cats("CURRENCY")),
    ("курс польського злотого", make_cats("CURRENCY")),
    ("скільки доларів за євро", make_cats("CURRENCY")),
    ("актуальний курс валют", make_cats("CURRENCY")),
    ("поточний курс", make_cats("CURRENCY")),

    # ── GREETING ─────────────────────────────────────────────────────────────
    ("привіт", make_cats("GREETING")),
    ("вітаю", make_cats("GREETING")),
    ("добрий день", make_cats("GREETING")),
    ("добрий ранок", make_cats("GREETING")),
    ("добрий вечір", make_cats("GREETING")),
    ("хай", make_cats("GREETING")),
    ("доброго дня", make_cats("GREETING")),
    ("hello", make_cats("GREETING")),
    ("hi there", make_cats("GREETING")),
    ("hey", make_cats("GREETING")),
    ("good morning", make_cats("GREETING")),
    ("good evening", make_cats("GREETING")),
    ("greetings", make_cats("GREETING")),
    ("привіт боте", make_cats("GREETING")),
    ("вітаю тебе", make_cats("GREETING")),

    # ── OTHER ─────────────────────────────────────────────────────────────────
    ("як справи", make_cats("OTHER")),
    ("що ти вмієш", make_cats("OTHER")),
    ("розкажи щось цікаве", make_cats("OTHER")),
    ("хто тебе створив", make_cats("OTHER")),
    ("що таке NLP", make_cats("OTHER")),
    ("яка столиця України", make_cats("OTHER")),
    ("порахуй два плюс два", make_cats("OTHER")),
    ("what can you do", make_cats("OTHER")),
    ("tell me a joke", make_cats("OTHER")),
    ("who are you", make_cats("OTHER")),
    ("what is your name", make_cats("OTHER")),
    ("help me with something", make_cats("OTHER")),
    ("яка година", make_cats("OTHER")),
    ("скільки часу", make_cats("OTHER")),
    ("де знаходиться Київ", make_cats("OTHER")),
    ("що таке штучний інтелект", make_cats("OTHER")),
]
