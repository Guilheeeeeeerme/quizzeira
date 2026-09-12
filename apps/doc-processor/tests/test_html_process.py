import base64

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

SAMPLE_HTML = b"""<!DOCTYPE html>
<html>
<head><title>Edital de Concurso Publico Federal</title></head>
<body>
<nav>Home | Menu</nav>
<h1>EDITAL DE ABERTURA</h1>
<p>Este edital regula o concurso publico para provimento de cargos de Analista
Judiciario e Tecnico Judiciario no ambito do Poder Judiciario da Uniao, com
base na legislacao vigente e nas normas internas do orgao.</p>
<h2>1. DAS DISPOSICOES PRELIMINARES</h2>
<p>O concurso sera regido por este edital e pela legislacao aplicavel, incluindo
as resolucoes do Conselho Nacional de Justica e as normas da banca organizadora
responsavel pela elaboracao das provas objetivas e discursivas.</p>
<h2>2. DO CONTEUDO PROGRAMATICO</h2>
<p>Lingua Portuguesa: compreensao e interpretacao de textos, concordancia verbal
e nominal, regencia verbal e nominal, ortografia oficial e pontuacao.</p>
<footer>Pagina 1</footer>
</body>
</html>
"""


def test_process_html_json_base64():
    payload = {
        "documentId": "doc-test-1",
        "contentType": "text/html",
        "base64": base64.b64encode(SAMPLE_HTML).decode("ascii"),
        "url": "https://example.com/edital.html",
        "roleHint": "specification",
    }
    res = client.post("/process", json=payload)
    assert res.status_code == 200
    doc = res.json()

    assert doc["schemaVersion"] == "1"
    assert doc["documentId"] == "doc-test-1"
    assert doc["source"]["contentType"] == "text/html"
    assert doc["stats"]["chars"] > 0
    assert len(doc["blocks"]) > 0
    assert len(doc["sections"]) >= 1
    assert isinstance(doc["cleaningLog"], list)
    assert len(doc["cleaningLog"]) >= 1

    headings = [b for b in doc["blocks"] if b["type"] == "heading"]
    assert any("EDITAL" in h["text"] for h in headings)


def test_process_plain_text():
    text = (
        b"INTRODUCAO\n\n"
        b"Texto de exemplo para normalizacao de documento educacional "
        b"sobre concordancia verbal e nominal em lingua portuguesa para "
        b"concursos publicos brasileiros com conteudo suficiente.\n\n"
        b"1. Primeiro topico\n"
        b"Conteudo do topico com explicacao detalhada das regras gramaticais "
        b"aplicaveis a provas objetivas de multipla escolha.\n"
    )
    payload = {
        "documentId": "doc-plain-1",
        "contentType": "text/plain",
        "base64": base64.b64encode(text).decode("ascii"),
        "roleHint": "knowledge",
    }
    res = client.post("/process", json=payload)
    assert res.status_code == 200
    doc = res.json()
    assert doc["extractor"]["engine"] == "plain"
    assert doc["stats"]["chars"] > 0
    assert len(doc["sections"]) >= 1
