============================================================
  WAYNE INDUSTRIES — BAT-COMPUTADOR
  Instruções de instalação e uso
============================================================

REQUISITOS:
  - Python 3.8+
  - pip

INSTALAÇÃO:
  1. Coloque todos os arquivos na mesma pasta
  2. Abra o terminal nessa pasta
  3. Instale as dependências:

     pip install -r requirements.txt

INICIAR O SERVIDOR:
     python app.py

ACESSAR:
  Abra o navegador em: http://localhost:5000

CREDENCIAIS DE TESTE:
  bruce@wayne.com    → darknight  (MASTER   — leitura + escrita)
  gerente@wayne.com  → 9012       (GERENTE  — leitura + escrita)
  gordon@wayne.com   → 5678       (SEGURANÇA — leitura + escrita)
  alfred@wayne.com   → 1234       (EMPLOYEE — somente leitura)

ESTRUTURA DE ARQUIVOS:
  app.py              ← servidor Flask (rode este)
  requirements.txt    ← dependências Python
  wayne.db            ← banco SQLite (criado automaticamente)
  login.html/css/js   ← tela de login
  batcave-menu.html/css/js  ← menu principal
  arsenal.html/css/js ← módulo arsenal

============================================================
