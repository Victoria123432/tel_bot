"""End-to-end check: NLP service + weather API pipeline."""
import urllib.request
import json

def analyze(text):
    body = json.dumps({"text": text}).encode()
    req = urllib.request.Request(
        "http://localhost:5000/analyze",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

CASES = [
    "яка погода в Одесі",
    "weather in Berlin",
    "скільки коштує долар",
    "exchange rate EUR to USD",
    "привіт",
    "hello",
    "розкажи щось цікаве",
    "tell me a joke",
]

print(f"{'Запит':<35} {'Intent':<10} {'Conf':>6}  City")
print("-" * 65)
for text in CASES:
    r = analyze(text)
    print(f"{text:<35} {r['intent']:<10} {r['confidence']:>6.4f}  {r['city'] or '-'}")
