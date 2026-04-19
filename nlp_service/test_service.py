import urllib.request
import json

TESTS = [
    "weather in London",
    "exchange rate USD",
    "hello",
    "tell me a joke",
    "temperature in Berlin",
    "how much is euro today",
    "good morning",
    "what can you do",
]

for text in TESTS:
    body = json.dumps({"text": text}).encode()
    req = urllib.request.Request(
        "http://localhost:5000/analyze",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        r = json.loads(resp.read())
    print(f"[{text}]")
    print(f"  intent={r['intent']}  conf={r['confidence']}  city={r['city']}")
    print(f"  entities={r['entities']}")
