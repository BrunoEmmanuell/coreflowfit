
import requests, os, json, time

BASE = "http://127.0.0.1:8000"
print("Quick tests prepared. To run them, start the backend and then execute this script.")
print("Example payloads:")
print(json.dumps({
  "nome":"Teste",
  "telefone":"11988887777",
  "password":"senha1234"
}, indent=2))
