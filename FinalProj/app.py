"""
============================================================
WAYNE INDUSTRIES — BAT-COMPUTADOR · app.py
============================================================
"""
from flask import Flask, jsonify, request, send_from_directory, render_template, abort
import sqlite3, os

BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder='static', template_folder='templates')
DB_PATH     = os.path.join(BASE_DIR, 'wayne.db')
WRITE_ROLES = {'master', 'manager', 'security'}

def get_db():
    conn = sqlite3.connect(DB_PATH); conn.row_factory = sqlite3.Row; return conn

def check_write(role):
    if role not in WRITE_ROLES: abort(403, description='ACESSO NEGADO · PERMISSÃO INSUFICIENTE')

def init_db():
    conn = get_db(); c = conn.cursor()

    # ── ARSENAL ──────────────────────────────────────────
    c.execute('''CREATE TABLE IF NOT EXISTS arsenal (
        id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT NOT NULL UNIQUE,
        nome TEXT NOT NULL, categoria TEXT NOT NULL DEFAULT 'Geral',
        quantidade INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'disponivel',
        descricao TEXT, criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    c.executemany('INSERT OR IGNORE INTO arsenal (codigo,nome,categoria,quantidade,status,descricao) VALUES (?,?,?,?,?,?)', [
        ('BAT-001','Batarang Standard','Projéteis',12,'disponivel','Batarang de aço de carbono, retorno automático'),
        ('BAT-002','Batarang Explosivo','Projéteis',4,'disponivel','Detonação por impacto, raio de 3m'),
        ('BAT-003','Gancho de Escalada','Mobilidade',3,'em_uso','Lançador de gancho com cabo de 50m'),
        ('BAT-004','Bomba de Fumaça','Suporte',20,'disponivel','Cobertura de 10m², duração 30s'),
        ('BAT-005','Bola de Choque','Imobilização',8,'disponivel','Pulso EMP localizado, raio 1m'),
        ('BAT-006','Luva de Soco Elétrica','Combate',2,'manutencao','90.000 volts, isolamento interno'),
        ('BAT-007','Disruptor de Armas','Suporte',1,'em_uso','Neutraliza armas de fogo a 15m'),
        ('BAT-008','Mini Drone de Rastreio','Vigilância',5,'disponivel','Alcance 500m, bateria 2h'),
        ('BAT-009','Antídoto Universal','Médico',6,'disponivel','Contra toxinas de Coringa e Hera'),
        ('BAT-010','Explosivo de Geleia','Demolição',3,'disponivel','Moldável, detonação remota'),
    ])

    # ── VEÍCULOS ─────────────────────────────────────────
    c.execute('''CREATE TABLE IF NOT EXISTS veiculos (
        id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT NOT NULL UNIQUE,
        nome TEXT NOT NULL, tipo TEXT NOT NULL DEFAULT 'Terrestre',
        status TEXT NOT NULL DEFAULT 'pronto', velocidade TEXT,
        tripulacao INTEGER NOT NULL DEFAULT 1, armamento TEXT, descricao TEXT, origem TEXT,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP, atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    c.executemany('INSERT OR IGNORE INTO veiculos (codigo,nome,tipo,status,velocidade,tripulacao,armamento,descricao,origem) VALUES (?,?,?,?,?,?,?,?,?)', [
        ('VEH-001','Batmóvel (Tumbler)','Terrestre','pronto','160 km/h',1,'Canhões frontais, mísseis, EMP','Veículo principal de combate urbano.','Nolanverso · Wayne Enterprises'),
        ('VEH-002','Batmóvel Clássico','Terrestre','pronto','330 km/h',2,'Foguetes dianteiros, garras','Design gótico com aletas de morcego.','Quadrinhos · Era de Bronze'),
        ('VEH-003','Batwing Mk.I','Aéreo','pronto','4.400 km/h',1,'Mísseis ar-solo, metralhadora','Aeronave furtiva baseada em asa voadora.','Quadrinhos · New Earth'),
        ('VEH-004','The Bat','Aéreo','manutencao','370 km/h',1,'Foguetes, canhão EMP','VTOL de combate urbano.','Nolanverso · The Dark Knight Rises'),
        ('VEH-005','Batpod','Terrestre','pronto','240 km/h',1,'Metralhadoras, cabo de aço','Motocicleta ejetada do Tumbler.','Nolanverso · The Dark Knight'),
        ('VEH-006','Batciclo','Terrestre','pronto','200 km/h',1,'Lançador de batarangs lateral','Todo-terreno de alta agilidade.','Quadrinhos · Detective Comics'),
        ('VEH-007','Batbarco','Aquático','pronto','120 nós',1,'Torpedos, sonar ativo','Embarcação furtiva para operações fluviais.','Quadrinhos · Batman #9'),
        ('VEH-008','Batsubmarino','Aquático','pronto','60 nós',2,'Torpedos guiados, minas','Submersível de operações profundas.','Quadrinhos · Arkhamverse'),
        ('VEH-009','Batcopter','Aéreo','pronto','280 km/h',2,'Holofote, corda de resgate','Helicóptero de resgate e vigilância.','Quadrinhos · Era de Ouro'),
        ('VEH-010','Batplano','Aéreo','em_uso','4.400 km/h',1,'Mísseis, laboratório forense','Jato furtivo de alta altitude.','Quadrinhos · Batman #1 (1940)'),
    ])

    # ── TRAJES ───────────────────────────────────────────
    c.execute('''CREATE TABLE IF NOT EXISTS trajes (
        id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT NOT NULL UNIQUE,
        nome TEXT NOT NULL, categoria TEXT NOT NULL DEFAULT 'Combate',
        status TEXT NOT NULL DEFAULT 'pronto', material TEXT, blindagem TEXT,
        sistemas TEXT, descricao TEXT, origem TEXT,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP, atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    c.executemany('INSERT OR IGNORE INTO trajes (codigo,nome,categoria,status,material,blindagem,sistemas,descricao,origem) VALUES (?,?,?,?,?,?,?,?,?)', [
        ('TRJ-001','Batsuit Padrão (Nolanverso)','Combate','pronto','Tricotar de carbono com kevlar','Resist. a projéteis pequenos e facas','Modulador de voz, visão noturna, capa planadora','Traje principal de Bruce Wayne.','Nolanverso · Wayne/Fox Enterprises'),
        ('TRJ-002','Batsuit Armored (BvS)','Combate','pronto','Kevlar multicamadas com titânio','Resistente a balas de alto calibre','Visão de raio-X, amplificação de força, IA','Versão pesada contra meta-humanos.','DCEU · Batman v Superman'),
    ])

    conn.commit(); conn.close()


# ── ROTAS DE PÁGINAS ──────────────────────────────────────
@app.route('/')
def index(): return render_template('login.html')

@app.route('/<path:page>.html')
def serve_page(page):
    try:
        return render_template(f'{page}.html')
    except Exception:
        abort(404)

# ── CRUD HELPERS ──────────────────────────────────────────
def list_rows(table, filters, search_cols):
    conn = get_db(); q = f'SELECT * FROM {table} WHERE 1=1'; p = []
    for col, val in filters.items():
        if val: q += f' AND {col} = ?'; p.append(val)
    b = request.args.get('busca','')
    if b:
        q += ' AND (' + ' OR '.join([f'{c} LIKE ?' for c in search_cols]) + ')'
        p += [f'%{b}%'] * len(search_cols)
    rows = conn.execute(q + ' ORDER BY codigo', p).fetchall(); conn.close()
    return jsonify([dict(r) for r in rows])

def get_one(table, i, msg):
    conn = get_db(); row = conn.execute(f'SELECT * FROM {table} WHERE id=?',(i,)).fetchone(); conn.close()
    if not row: abort(404, description=msg)
    return jsonify(dict(row))

def del_row(table, i, msg):
    check_write(request.headers.get('X-User-Role',''))
    conn = get_db(); row = conn.execute(f'SELECT * FROM {table} WHERE id=?',(i,)).fetchone()
    if not row: conn.close(); abort(404, description=msg)
    conn.execute(f'DELETE FROM {table} WHERE id=?',(i,)); conn.commit(); conn.close()
    return jsonify({'message': f'REMOVIDO: {row["codigo"]}'})

def cats(table):
    conn = get_db(); rows = conn.execute(f'SELECT DISTINCT categoria FROM {table} ORDER BY categoria').fetchall(); conn.close()
    return jsonify([r['categoria'] for r in rows])

# ── API ARSENAL ───────────────────────────────────────────
@app.route('/api/arsenal/categorias', methods=['GET'])
def get_arsenal_cats(): return cats('arsenal')
@app.route('/api/arsenal', methods=['GET'])
def get_arsenal():
    return list_rows('arsenal', {'status': request.args.get('status',''), 'categoria': request.args.get('categoria','')}, ['nome','codigo','descricao'])
@app.route('/api/arsenal/<int:i>', methods=['GET'])
def get_arsenal_item(i): return get_one('arsenal', i, 'ITEM NÃO ENCONTRADO')
@app.route('/api/arsenal', methods=['POST'])
def create_arsenal_item():
    check_write(request.headers.get('X-User-Role','')); d = request.get_json()
    conn = get_db()
    try:
        conn.execute('INSERT INTO arsenal (codigo,nome,categoria,quantidade,status,descricao) VALUES (?,?,?,?,?,?)',
            (d['codigo'].upper(),d['nome'],d.get('categoria','Geral'),int(d.get('quantidade',0)),d.get('status','disponivel'),d.get('descricao','')))
        conn.commit(); nid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
        row = conn.execute('SELECT * FROM arsenal WHERE id=?',(nid,)).fetchone(); conn.close()
        return jsonify(dict(row)), 201
    except Exception: conn.close(); abort(409, description='CÓDIGO JÁ EXISTE')
@app.route('/api/arsenal/<int:i>', methods=['PUT'])
def update_arsenal_item(i):
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    row = conn.execute('SELECT * FROM arsenal WHERE id=?',(i,)).fetchone()
    if not row: conn.close(); abort(404, description='NÃO ENCONTRADO')
    conn.execute('UPDATE arsenal SET codigo=?,nome=?,categoria=?,quantidade=?,status=?,descricao=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?',
        (d.get('codigo',row['codigo']).upper(),d.get('nome',row['nome']),d.get('categoria',row['categoria']),
         int(d.get('quantidade',row['quantidade'])),d.get('status',row['status']),d.get('descricao',row['descricao']),i))
    conn.commit(); updated = conn.execute('SELECT * FROM arsenal WHERE id=?',(i,)).fetchone(); conn.close()
    return jsonify(dict(updated))
@app.route('/api/arsenal/<int:i>', methods=['DELETE'])
def delete_arsenal_item(i): return del_row('arsenal', i, 'NÃO ENCONTRADO')

# ── API VEÍCULOS ──────────────────────────────────────────
@app.route('/api/veiculos/tipos', methods=['GET'])
def get_veiculos_tipos():
    conn = get_db(); rows = conn.execute('SELECT DISTINCT tipo FROM veiculos ORDER BY tipo').fetchall(); conn.close()
    return jsonify([r['tipo'] for r in rows])
@app.route('/api/veiculos', methods=['GET'])
def get_veiculos():
    return list_rows('veiculos', {'status': request.args.get('status',''), 'tipo': request.args.get('tipo','')}, ['nome','codigo','descricao','armamento'])
@app.route('/api/veiculos/<int:i>', methods=['GET'])
def get_veiculo(i): return get_one('veiculos', i, 'NÃO ENCONTRADO')
@app.route('/api/veiculos', methods=['POST'])
def create_veiculo():
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    try:
        conn.execute('INSERT INTO veiculos (codigo,nome,tipo,status,velocidade,tripulacao,armamento,descricao,origem) VALUES (?,?,?,?,?,?,?,?,?)',
            (d['codigo'].upper(),d['nome'],d.get('tipo','Terrestre'),d.get('status','pronto'),
             d.get('velocidade',''),int(d.get('tripulacao',1)),d.get('armamento',''),d.get('descricao',''),d.get('origem','')))
        conn.commit(); nid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
        row = conn.execute('SELECT * FROM veiculos WHERE id=?',(nid,)).fetchone(); conn.close()
        return jsonify(dict(row)), 201
    except: conn.close(); abort(409, description='CÓDIGO JÁ EXISTE')
@app.route('/api/veiculos/<int:i>', methods=['PUT'])
def update_veiculo(i):
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    row = conn.execute('SELECT * FROM veiculos WHERE id=?',(i,)).fetchone()
    if not row: conn.close(); abort(404, description='NÃO ENCONTRADO')
    conn.execute('UPDATE veiculos SET codigo=?,nome=?,tipo=?,status=?,velocidade=?,tripulacao=?,armamento=?,descricao=?,origem=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?',
        (d.get('codigo',row['codigo']).upper(),d.get('nome',row['nome']),d.get('tipo',row['tipo']),d.get('status',row['status']),
         d.get('velocidade',row['velocidade']),int(d.get('tripulacao',row['tripulacao'])),d.get('armamento',row['armamento']),
         d.get('descricao',row['descricao']),d.get('origem',row['origem']),i))
    conn.commit(); updated = conn.execute('SELECT * FROM veiculos WHERE id=?',(i,)).fetchone(); conn.close()
    return jsonify(dict(updated))
@app.route('/api/veiculos/<int:i>', methods=['DELETE'])
def delete_veiculo(i): return del_row('veiculos', i, 'NÃO ENCONTRADO')

# ── API TRAJES ────────────────────────────────────────────
@app.route('/api/trajes/categorias', methods=['GET'])
def get_trajes_cats(): return cats('trajes')
@app.route('/api/trajes', methods=['GET'])
def get_trajes():
    return list_rows('trajes', {'status': request.args.get('status',''), 'categoria': request.args.get('categoria','')}, ['nome','codigo','descricao','sistemas','material'])
@app.route('/api/trajes/<int:i>', methods=['GET'])
def get_traje(i): return get_one('trajes', i, 'NÃO ENCONTRADO')
@app.route('/api/trajes', methods=['POST'])
def create_traje():
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    try:
        conn.execute('INSERT INTO trajes (codigo,nome,categoria,status,material,blindagem,sistemas,descricao,origem) VALUES (?,?,?,?,?,?,?,?,?)',
            (d['codigo'].upper(),d['nome'],d.get('categoria','Combate'),d.get('status','pronto'),
             d.get('material',''),d.get('blindagem',''),d.get('sistemas',''),d.get('descricao',''),d.get('origem','')))
        conn.commit(); nid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
        row = conn.execute('SELECT * FROM trajes WHERE id=?',(nid,)).fetchone(); conn.close()
        return jsonify(dict(row)), 201
    except: conn.close(); abort(409, description='CÓDIGO JÁ EXISTE')
@app.route('/api/trajes/<int:i>', methods=['PUT'])
def update_traje(i):
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    row = conn.execute('SELECT * FROM trajes WHERE id=?',(i,)).fetchone()
    if not row: conn.close(); abort(404, description='NÃO ENCONTRADO')
    conn.execute('UPDATE trajes SET codigo=?,nome=?,categoria=?,status=?,material=?,blindagem=?,sistemas=?,descricao=?,origem=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?',
        (d.get('codigo',row['codigo']).upper(),d.get('nome',row['nome']),d.get('categoria',row['categoria']),d.get('status',row['status']),
         d.get('material',row['material']),d.get('blindagem',row['blindagem']),d.get('sistemas',row['sistemas']),
         d.get('descricao',row['descricao']),d.get('origem',row['origem']),i))
    conn.commit(); updated = conn.execute('SELECT * FROM trajes WHERE id=?',(i,)).fetchone(); conn.close()
    return jsonify(dict(updated))
@app.route('/api/trajes/<int:i>', methods=['DELETE'])
def delete_traje(i): return del_row('trajes', i, 'NÃO ENCONTRADO')

# ── API BATCAVERNA ────────────────────────────────────────
@app.route('/api/batcaverna/sistemas', methods=['GET'])
def bat_sistemas_list():
    return list_rows('bat_sistemas', {'status': request.args.get('status',''), 'categoria': request.args.get('categoria','')}, ['nome','codigo','observacoes','localizacao'])
@app.route('/api/batcaverna/sistemas/categorias', methods=['GET'])
def bat_sistemas_cats(): return cats('bat_sistemas')
@app.route('/api/batcaverna/sistemas/<int:i>', methods=['GET'])
def bat_sistemas_get(i): return get_one('bat_sistemas', i, 'NÃO ENCONTRADO')
@app.route('/api/batcaverna/sistemas/<int:i>', methods=['DELETE'])
def bat_sistemas_del(i): return del_row('bat_sistemas', i, 'NÃO ENCONTRADO')
@app.route('/api/batcaverna/sistemas', methods=['POST'])
def bat_sistemas_post():
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    try:
        conn.execute('INSERT INTO bat_sistemas (codigo,nome,categoria,status,localizacao,uptime,origem,observacoes) VALUES (?,?,?,?,?,?,?,?)',
            (d.get('codigo','').upper(), d.get('nome',''), d.get('categoria','Computação'), d.get('status','operacional'),
             d.get('localizacao',''), d.get('uptime',''), d.get('origem',''), d.get('observacoes','')))
        conn.commit(); nid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
        row = conn.execute('SELECT * FROM bat_sistemas WHERE id=?',(nid,)).fetchone(); conn.close()
        return jsonify(dict(row)), 201
    except Exception: conn.close(); abort(409, description='CÓDIGO JÁ EXISTE')
@app.route('/api/batcaverna/sistemas/<int:i>', methods=['PUT'])
def bat_sistemas_put(i):
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    row = conn.execute('SELECT * FROM bat_sistemas WHERE id=?',(i,)).fetchone()
    if not row: conn.close(); abort(404, description='NÃO ENCONTRADO')
    conn.execute('UPDATE bat_sistemas SET nome=?,categoria=?,status=?,localizacao=?,uptime=?,origem=?,observacoes=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?',
        (d.get('nome',row['nome']), d.get('categoria',row['categoria']), d.get('status',row['status']),
         d.get('localizacao',row['localizacao']), d.get('uptime',row['uptime']), d.get('origem',row['origem']),
         d.get('observacoes',row['observacoes']), i))
    conn.commit(); updated = conn.execute('SELECT * FROM bat_sistemas WHERE id=?',(i,)).fetchone(); conn.close()
    return jsonify(dict(updated))

@app.route('/api/batcaverna/trofeus', methods=['GET'])
def bat_trofeus_list():
    return list_rows('bat_trofeus', {'status': request.args.get('status',''), 'categoria': request.args.get('categoria','')}, ['nome','codigo','observacoes','origem'])
@app.route('/api/batcaverna/trofeus/categorias', methods=['GET'])
def bat_trofeus_cats(): return cats('bat_trofeus')
@app.route('/api/batcaverna/trofeus/<int:i>', methods=['GET'])
def bat_trofeus_get(i): return get_one('bat_trofeus', i, 'NÃO ENCONTRADO')
@app.route('/api/batcaverna/trofeus/<int:i>', methods=['DELETE'])
def bat_trofeus_del(i): return del_row('bat_trofeus', i, 'NÃO ENCONTRADO')
@app.route('/api/batcaverna/trofeus', methods=['POST'])
def bat_trofeus_post():
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    try:
        conn.execute('INSERT INTO bat_trofeus (codigo,nome,categoria,status,origem,local_exibicao,primeiro_aparecimento,observacoes) VALUES (?,?,?,?,?,?,?,?)',
            (d.get('codigo','').upper(), d.get('nome',''), d.get('categoria','Vilão'), d.get('status','exposicao'),
             d.get('origem',''), d.get('local_exibicao',''), d.get('primeiro_aparecimento',''), d.get('observacoes','')))
        conn.commit(); nid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
        row = conn.execute('SELECT * FROM bat_trofeus WHERE id=?',(nid,)).fetchone(); conn.close()
        return jsonify(dict(row)), 201
    except: conn.close(); abort(409, description='CÓDIGO JÁ EXISTE')
@app.route('/api/batcaverna/trofeus/<int:i>', methods=['PUT'])
def bat_trofeus_put(i):
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    row = conn.execute('SELECT * FROM bat_trofeus WHERE id=?',(i,)).fetchone()
    if not row: conn.close(); abort(404, description='NÃO ENCONTRADO')
    conn.execute('UPDATE bat_trofeus SET nome=?,categoria=?,status=?,origem=?,local_exibicao=?,primeiro_aparecimento=?,observacoes=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?',
        (d.get('nome',row['nome']), d.get('categoria',row['categoria']), d.get('status',row['status']),
         d.get('origem',row['origem']), d.get('local_exibicao',row['local_exibicao']),
         d.get('primeiro_aparecimento',row['primeiro_aparecimento']), d.get('observacoes',row['observacoes']), i))
    conn.commit(); updated = conn.execute('SELECT * FROM bat_trofeus WHERE id=?',(i,)).fetchone(); conn.close()
    return jsonify(dict(updated))

@app.route('/api/batcaverna/laboratorio', methods=['GET'])
def bat_lab_list():
    return list_rows('bat_laboratorio', {'status': request.args.get('status',''), 'categoria': request.args.get('categoria','')}, ['nome','codigo','observacoes','amostra'])
@app.route('/api/batcaverna/laboratorio/categorias', methods=['GET'])
def bat_lab_cats(): return cats('bat_laboratorio')
@app.route('/api/batcaverna/laboratorio/<int:i>', methods=['GET'])
def bat_lab_get(i): return get_one('bat_laboratorio', i, 'NÃO ENCONTRADO')
@app.route('/api/batcaverna/laboratorio/<int:i>', methods=['DELETE'])
def bat_lab_del(i): return del_row('bat_laboratorio', i, 'NÃO ENCONTRADO')
@app.route('/api/batcaverna/laboratorio', methods=['POST'])
def bat_lab_post():
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    try:
        conn.execute('INSERT INTO bat_laboratorio (codigo,nome,categoria,status,prioridade,amostra,responsavel,prazo,localizacao,observacoes) VALUES (?,?,?,?,?,?,?,?,?,?)',
            (d.get('codigo','').upper(), d.get('nome',''), d.get('categoria','Forense'), d.get('status','ativo'),
             d.get('prioridade','MÉDIA'), d.get('amostra',''), d.get('responsavel',''),
             d.get('prazo',''), d.get('localizacao',''), d.get('observacoes','')))
        conn.commit(); nid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
        row = conn.execute('SELECT * FROM bat_laboratorio WHERE id=?',(nid,)).fetchone(); conn.close()
        return jsonify(dict(row)), 201
    except: conn.close(); abort(409, description='CÓDIGO JÁ EXISTE')
@app.route('/api/batcaverna/laboratorio/<int:i>', methods=['PUT'])
def bat_lab_put(i):
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    row = conn.execute('SELECT * FROM bat_laboratorio WHERE id=?',(i,)).fetchone()
    if not row: conn.close(); abort(404, description='NÃO ENCONTRADO')
    conn.execute('UPDATE bat_laboratorio SET nome=?,categoria=?,status=?,prioridade=?,amostra=?,responsavel=?,prazo=?,localizacao=?,observacoes=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?',
        (d.get('nome',row['nome']), d.get('categoria',row['categoria']), d.get('status',row['status']),
         d.get('prioridade',row['prioridade']), d.get('amostra',row['amostra']), d.get('responsavel',row['responsavel']),
         d.get('prazo',row['prazo']), d.get('localizacao',row['localizacao']), d.get('observacoes',row['observacoes']), i))
    conn.commit(); updated = conn.execute('SELECT * FROM bat_laboratorio WHERE id=?',(i,)).fetchone(); conn.close()
    return jsonify(dict(updated))

@app.route('/api/batcaverna/seguranca', methods=['GET'])
def bat_seg_list():
    return list_rows('bat_seguranca', {'status': request.args.get('status',''), 'categoria': request.args.get('categoria','')}, ['nome','codigo','observacoes','cobertura'])
@app.route('/api/batcaverna/seguranca/categorias', methods=['GET'])
def bat_seg_cats(): return cats('bat_seguranca')
@app.route('/api/batcaverna/seguranca/<int:i>', methods=['GET'])
def bat_seg_get(i): return get_one('bat_seguranca', i, 'NÃO ENCONTRADO')
@app.route('/api/batcaverna/seguranca/<int:i>', methods=['DELETE'])
def bat_seg_del(i): return del_row('bat_seguranca', i, 'NÃO ENCONTRADO')
@app.route('/api/batcaverna/seguranca', methods=['POST'])
def bat_seg_post():
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    try:
        conn.execute('INSERT INTO bat_seguranca (codigo,nome,categoria,status,nivel_ameaca,cobertura,ultima_ativacao,observacoes) VALUES (?,?,?,?,?,?,?,?)',
            (d.get('codigo','').upper(), d.get('nome',''), d.get('categoria','Perímetro'), d.get('status','armado'),
             d.get('nivel_ameaca',''), d.get('cobertura',''), d.get('ultima_ativacao',''), d.get('observacoes','')))
        conn.commit(); nid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
        row = conn.execute('SELECT * FROM bat_seguranca WHERE id=?',(nid,)).fetchone(); conn.close()
        return jsonify(dict(row)), 201
    except: conn.close(); abort(409, description='CÓDIGO JÁ EXISTE')
@app.route('/api/batcaverna/seguranca/<int:i>', methods=['PUT'])
def bat_seg_put(i):
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    row = conn.execute('SELECT * FROM bat_seguranca WHERE id=?',(i,)).fetchone()
    if not row: conn.close(); abort(404, description='NÃO ENCONTRADO')
    conn.execute('UPDATE bat_seguranca SET nome=?,categoria=?,status=?,nivel_ameaca=?,cobertura=?,ultima_ativacao=?,observacoes=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?',
        (d.get('nome',row['nome']), d.get('categoria',row['categoria']), d.get('status',row['status']),
         d.get('nivel_ameaca',row['nivel_ameaca']), d.get('cobertura',row['cobertura']),
         d.get('ultima_ativacao',row['ultima_ativacao']), d.get('observacoes',row['observacoes']), i))
    conn.commit(); updated = conn.execute('SELECT * FROM bat_seguranca WHERE id=?',(i,)).fetchone(); conn.close()
    return jsonify(dict(updated))

# ── API GOTHAM ────────────────────────────────────────────
@app.route('/api/gotham/distritos', methods=['GET'])
def got_dist_list():
    return list_rows('gotham_distritos', {'status': request.args.get('status',''), 'categoria': request.args.get('categoria','')}, ['nome','codigo','observacoes','controle_atual'])
@app.route('/api/gotham/distritos/categorias', methods=['GET'])
def got_dist_cats(): return cats('gotham_distritos')
@app.route('/api/gotham/distritos/<int:i>', methods=['GET'])
def got_dist_get(i): return get_one('gotham_distritos', i, 'NÃO ENCONTRADO')
@app.route('/api/gotham/distritos/<int:i>', methods=['DELETE'])
def got_dist_del(i): return del_row('gotham_distritos', i, 'NÃO ENCONTRADO')
@app.route('/api/gotham/distritos', methods=['POST'])
def got_dist_post():
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    try:
        conn.execute('INSERT INTO gotham_distritos (codigo,nome,categoria,status,populacao,nivel_crime,controle_atual,observacoes) VALUES (?,?,?,?,?,?,?,?)',
            (d.get('codigo','').upper(), d.get('nome',''), d.get('categoria','Ilha Principal'), d.get('status','monitorado'),
             d.get('populacao',''), d.get('nivel_crime',''), d.get('controle_atual',''), d.get('observacoes','')))
        conn.commit(); nid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
        row = conn.execute('SELECT * FROM gotham_distritos WHERE id=?',(nid,)).fetchone(); conn.close()
        return jsonify(dict(row)), 201
    except: conn.close(); abort(409, description='CÓDIGO JÁ EXISTE')
@app.route('/api/gotham/distritos/<int:i>', methods=['PUT'])
def got_dist_put(i):
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    row = conn.execute('SELECT * FROM gotham_distritos WHERE id=?',(i,)).fetchone()
    if not row: conn.close(); abort(404, description='NÃO ENCONTRADO')
    conn.execute('UPDATE gotham_distritos SET nome=?,categoria=?,status=?,populacao=?,nivel_crime=?,controle_atual=?,observacoes=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?',
        (d.get('nome',row['nome']), d.get('categoria',row['categoria']), d.get('status',row['status']),
         d.get('populacao',row['populacao']), d.get('nivel_crime',row['nivel_crime']),
         d.get('controle_atual',row['controle_atual']), d.get('observacoes',row['observacoes']), i))
    conn.commit(); updated = conn.execute('SELECT * FROM gotham_distritos WHERE id=?',(i,)).fetchone(); conn.close()
    return jsonify(dict(updated))

@app.route('/api/gotham/ocorrencias', methods=['GET'])
def got_oc_list():
    return list_rows('gotham_ocorrencias', {'status': request.args.get('status',''), 'categoria': request.args.get('categoria','')}, ['codigo','suspeito','setor','descricao'])
@app.route('/api/gotham/ocorrencias/categorias', methods=['GET'])
def got_oc_cats(): return cats('gotham_ocorrencias')
@app.route('/api/gotham/ocorrencias/<int:i>', methods=['GET'])
def got_oc_get(i): return get_one('gotham_ocorrencias', i, 'NÃO ENCONTRADO')
@app.route('/api/gotham/ocorrencias/<int:i>', methods=['DELETE'])
def got_oc_del(i): return del_row('gotham_ocorrencias', i, 'NÃO ENCONTRADO')
@app.route('/api/gotham/ocorrencias', methods=['POST'])
def got_oc_post():
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    try:
        conn.execute('INSERT INTO gotham_ocorrencias (codigo,categoria,status,prioridade,setor,suspeito,vitimas,data_hora,descricao) VALUES (?,?,?,?,?,?,?,?,?)',
            (d.get('codigo','').upper(), d.get('categoria','Confronto'), d.get('status','ativa'), d.get('prioridade','MÉDIA'),
             d.get('setor',''), d.get('suspeito',''), d.get('vitimas','0'), d.get('data_hora',''), d.get('descricao','')))
        conn.commit(); nid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
        row = conn.execute('SELECT * FROM gotham_ocorrencias WHERE id=?',(nid,)).fetchone(); conn.close()
        return jsonify(dict(row)), 201
    except: conn.close(); abort(409, description='CÓDIGO JÁ EXISTE')
@app.route('/api/gotham/ocorrencias/<int:i>', methods=['PUT'])
def got_oc_put(i):
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    row = conn.execute('SELECT * FROM gotham_ocorrencias WHERE id=?',(i,)).fetchone()
    if not row: conn.close(); abort(404, description='NÃO ENCONTRADO')
    conn.execute('UPDATE gotham_ocorrencias SET categoria=?,status=?,prioridade=?,setor=?,suspeito=?,vitimas=?,data_hora=?,descricao=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?',
        (d.get('categoria',row['categoria']), d.get('status',row['status']), d.get('prioridade',row['prioridade']),
         d.get('setor',row['setor']), d.get('suspeito',row['suspeito']), d.get('vitimas',row['vitimas']),
         d.get('data_hora',row['data_hora']), d.get('descricao',row['descricao']), i))
    conn.commit(); updated = conn.execute('SELECT * FROM gotham_ocorrencias WHERE id=?',(i,)).fetchone(); conn.close()
    return jsonify(dict(updated))

@app.route('/api/gotham/suspeitos', methods=['GET'])
def got_sus_list():
    return list_rows('gotham_suspeitos', {'status': request.args.get('status',''), 'categoria': request.args.get('categoria','')}, ['nome','codigo','observacoes','territorio'])
@app.route('/api/gotham/suspeitos/categorias', methods=['GET'])
def got_sus_cats(): return cats('gotham_suspeitos')
@app.route('/api/gotham/suspeitos/<int:i>', methods=['GET'])
def got_sus_get(i): return get_one('gotham_suspeitos', i, 'NÃO ENCONTRADO')
@app.route('/api/gotham/suspeitos/<int:i>', methods=['DELETE'])
def got_sus_del(i): return del_row('gotham_suspeitos', i, 'NÃO ENCONTRADO')
@app.route('/api/gotham/suspeitos', methods=['POST'])
def got_sus_post():
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    try:
        conn.execute('INSERT INTO gotham_suspeitos (codigo,nome,categoria,status,territorio,nivel_ameaca,ultima_localizacao,observacoes) VALUES (?,?,?,?,?,?,?,?)',
            (d.get('codigo','').upper(), d.get('nome',''), d.get('categoria','Meta-Humano'), d.get('status','solto'),
             d.get('territorio',''), d.get('nivel_ameaca',''), d.get('ultima_localizacao',''), d.get('observacoes','')))
        conn.commit(); nid = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
        row = conn.execute('SELECT * FROM gotham_suspeitos WHERE id=?',(nid,)).fetchone(); conn.close()
        return jsonify(dict(row)), 201
    except: conn.close(); abort(409, description='CÓDIGO JÁ EXISTE')
@app.route('/api/gotham/suspeitos/<int:i>', methods=['PUT'])
def got_sus_put(i):
    check_write(request.headers.get('X-User-Role','')); d = request.get_json(); conn = get_db()
    row = conn.execute('SELECT * FROM gotham_suspeitos WHERE id=?',(i,)).fetchone()
    if not row: conn.close(); abort(404, description='NÃO ENCONTRADO')
    conn.execute('UPDATE gotham_suspeitos SET nome=?,categoria=?,status=?,territorio=?,nivel_ameaca=?,ultima_localizacao=?,observacoes=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?',
        (d.get('nome',row['nome']), d.get('categoria',row['categoria']), d.get('status',row['status']),
         d.get('territorio',row['territorio']), d.get('nivel_ameaca',row['nivel_ameaca']),
         d.get('ultima_localizacao',row['ultima_localizacao']), d.get('observacoes',row['observacoes']), i))
    conn.commit(); updated = conn.execute('SELECT * FROM gotham_suspeitos WHERE id=?',(i,)).fetchone(); conn.close()
    return jsonify(dict(updated))

# ── ERROS ─────────────────────────────────────────────────
@app.errorhandler(400)
@app.errorhandler(403)
@app.errorhandler(404)
@app.errorhandler(409)
def handle_error(e): return jsonify({'error': e.description}), e.code

# ── START ─────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    print('\n╔══════════════════════════════════════════╗')
    print('║   WAYNE INDUSTRIES — BAT-COMPUTADOR      ║')
    print('║   Servidor iniciado em localhost:5000     ║')
    print('║   Abra: http://localhost:5000             ║')
    print('╚══════════════════════════════════════════╝\n')
    app.run(debug=True, port=5000)
