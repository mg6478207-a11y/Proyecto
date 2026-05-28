from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, send_file
import pyodbc
import uuid
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen        import canvas as rl_canvas
from io                      import BytesIO
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.preprocessing import LabelEncoder
from sklearn.neighbors import KNeighborsClassifier
import io
import base64
import pandas as pd
import numpy as np
from flask_mail import Mail, Message
import random
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import re

app = Flask(__name__)
app.secret_key = 'clave_secreta'

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'retomateproy@gmail.com'
app.config['MAIL_PASSWORD'] = 'xpyt uhsl oglx gdjt'
mail = Mail(app)

# ─── CURSOS DISPONIBLES ───────────────────────────────────────────────────────
# Mapeo curso → qué grados/rutas puede ver
CURSOS_DISPONIBLES = {
    'Primero':   {'grado': 1,  'rutas': ['Grado1_modulo']},
    'Segundo':   {'grado': 2,  'rutas': ['Grado2_modulo']},
    'Tercero':   {'grado': 3,  'rutas': ['Grado3_modulo']},
    'Cuarto':    {'grado': 4,  'rutas': ['Grado4_modulo']},
    'Quinto':    {'grado': 5,  'rutas': ['Grado5_modulo']},
    'Sexto':     {'grado': 6,  'rutas': ['Grado6_modulo', 'unidad']},
}

# ─── HELPER: verificar que el estudiante pertenece al curso de esa ruta ───────
def verificar_acceso_curso(prefijo_ruta):
    """
    prefijo_ruta: p.ej. 'Grado5_modulo' o 'Grado4_modulo'
    Devuelve True si el estudiante tiene acceso, False si no.
    El administrador siempre tiene acceso.
    """
    if 'id' not in session:
        return False
    if session.get('tipo') == 'administrador':
        return True
    curso = session.get('curso', '')
    info  = CURSOS_DISPONIBLES.get(curso, {})
    rutas = info.get('rutas', [])
    return any(prefijo_ruta.startswith(r) for r in rutas)

# ─── CONEXIÓN ─────────────────────────────────────────────────────────────────
def conectar():
    conn_str = (
        "Driver={ODBC Driver 18 for SQL Server};"
        "Server=servidor-nataly-udec.database.windows.net,1433;"
        "Database=retomate_DB;"
        "Uid=nataly_admin;"
        "Pwd=ServiNata.07;"
        "Encrypt=yes;"
        "TrustServerCertificate=no;"
        "Connection Timeout=30;"
    )
    return pyodbc.connect(conn_str)

# ─── HOME ─────────────────────────────────────────────────────────────────────
@app.route('/')
def home():
    return render_template("index.html")

# ─── LOGIN ────────────────────────────────────────────────────────────────────
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        correo    = request.form['correo']
        contrasena = request.form['contrasena']
        aceptar   = request.form.get('aceptar')

        if not aceptar:
            flash("Debes aceptar las políticas de tratamiento de datos.", "warning")
            return render_template("login.html")

        db  = conectar()
        cur = db.cursor()
        cur.execute(
            "SELECT id, nombre, correo, contrasena, tipo FROM usuarios WHERE correo=?",
            (correo,)
        )
        row = cur.fetchone()
        db.close()

        if row:
            usuario = {"id": row[0], "nombre": row[1], "correo": row[2],
                       "contrasena": row[3], "tipo": row[4]}

            if check_password_hash(usuario['contrasena'], contrasena):
                session['id']     = usuario['id']
                session['nombre'] = usuario['nombre']
                session['tipo']   = usuario['tipo']

                # ── Cargar curso del estudiante desde informacion_estudiantes ──
                if usuario['tipo'] == 'estudiante':
                    db2  = conectar()
                    cur2 = db2.cursor()
                    cur2.execute(
                        "SELECT curso FROM informacion_estudiantes WHERE usuario_id=?",
                        (usuario['id'],)
                    )
                    fila_curso = cur2.fetchone()
                    db2.close()
                    session['curso'] = fila_curso[0] if fila_curso else None

                    # Verificar si tiene suscripción activa vigente
                    db3  = conectar()
                    cur3 = db3.cursor()
                    cur3.execute("""
                        SELECT [plan] FROM suscripciones
                        WHERE usuario_id = ?
                          AND activa = 1
                          AND fecha_fin >= CAST(GETDATE() AS DATE)
                    """, (usuario['id'],))
                    fila_plan = cur3.fetchone()
                    db3.close()
                    session['plan'] = fila_plan[0] if fila_plan else 'gratuito'

                flash(f"Bienvenido {session['nombre']} ({session['tipo']})", "success")

                if session['tipo'] == 'administrador':
                    return redirect(url_for('progreso'))
                else:
                    return redirect(url_for('tematicas'))
            else:
                flash("Contraseña incorrecta.", "danger")
        else:
            flash("El correo no está registrado.", "danger")

    return render_template("login.html")

# ─── REGISTRO USUARIO ─────────────────────────────────────────────────────────
@app.route('/registro', methods=['GET', 'POST'])
def registro():
    if request.method == 'POST':
        nombre    = request.form['nombre']
        correo    = request.form['correo']
        contrasena = request.form['contrasena']
        confirmar = request.form['confirmar']
        tipo      = request.form['tipo']

        if contrasena != confirmar:
            flash("Las contraseñas no coinciden.", "danger")
            return redirect(url_for('registro'))

        patron = r'^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$'
        if not re.match(patron, contrasena):
            flash("La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.", "warning")
            return redirect(url_for('registro'))

        contrasena_hash = generate_password_hash(contrasena)
        db  = conectar()
        cur = db.cursor()
        cur.execute("SELECT id FROM usuarios WHERE correo = ?", (correo,))
        if cur.fetchone():
            db.close()
            flash("El correo ya está registrado.", "warning")
            return redirect(url_for('registro'))

        cur.execute("""
            INSERT INTO usuarios (nombre, correo, contrasena, tipo)
            OUTPUT INSERTED.id
            VALUES (?, ?, ?, ?)
        """, (nombre, correo, contrasena_hash, tipo))
        row = cur.fetchone()

        if row and row[0]:
            user_id = int(row[0])
        else:
            db.close()
            flash("Error al obtener el ID del usuario.", "danger")
            return redirect(url_for('registro'))

        db.commit()
        db.close()

        if tipo == 'estudiante':
            session['nuevo_usuario_id'] = user_id
            flash("Por favor completa tu información académica.", "info")
            return redirect(url_for('registro_estudiante'))

        flash("Usuario registrado correctamente.", "success")
        return redirect(url_for('login'))

    return render_template("registro.html")

# ─── REGISTRO ESTUDIANTE (ahora incluye campo "curso") ────────────────────────
@app.route('/registro_estudiante', methods=['GET', 'POST'])
def registro_estudiante():
    if 'nuevo_usuario_id' not in session:
        return redirect(url_for('registro'))

    if request.method == 'POST':
        data = request.form
        db   = conectar()
        cur  = db.cursor()

        cur.execute("""
            INSERT INTO informacion_estudiantes (
                usuario_id, edad, genero, vive_con_padres, estrato, trabaja,
                horas_estudio_dia, promedio_anterior, nivel_educativo_padres,
                acceso_internet, dispositivo_estudio, distancia_colegio,
                motivacion, estres, apoyo_familiar, satisfaccion_estudio,
                curso, fecha_registro
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())
        """, (
            session['nuevo_usuario_id'],
            data['edad'], data['genero'], data['vive_con_padres'],
            data['estrato'], data['trabaja'], data['horas_estudio_dia'],
            data['promedio_anterior'], data['nivel_educativo_padres'],
            data['acceso_internet'], data['dispositivo_estudio'],
            data['distancia_colegio'], data['motivacion'], data['estres'],
            data['apoyo_familiar'], data['satisfaccion_estudio'],
            data['curso']   # ← NUEVO CAMPO
        ))
        db.commit()
        db.close()
        session.pop('nuevo_usuario_id', None)
        flash("Información del estudiante registrada correctamente.", "success")
        return redirect(url_for('login'))

    return render_template('registro_estudiante.html', cursos=list(CURSOS_DISPONIBLES.keys()))

# ─── VIDEOS ───────────────────────────────────────────────────────────────────
@app.route('/videos')
def videos():
    return render_template('videos.html')

# ─── TEMÁTICAS ────────────────────────────────────────────────────────────────
@app.route('/tematicas')
def tematicas():
    if 'id' not in session:
        return redirect(url_for('login'))
    # Pasar el curso al template para mostrar solo las unidades correspondientes
    return render_template("tematicas.html", curso=session.get('curso'), tipo=session.get('tipo'))

# ─── DECORATOR GENÉRICO PARA MÓDULOS CON CONTROL DE ACCESO ───────────────────
# Mapeo de prefijo de ruta → nombre de curso legible
_PREFIJO_A_CURSO = {
    'Grado1_modulo': ['Primero'],
    'Grado2_modulo': ['Segundo'],
    'Grado3_modulo': ['Tercero'],
    'Grado4_modulo': ['Cuarto'],
    'Grado5_modulo': ['Quinto'],
    'Grado6_modulo': ['Sexto'],
    'unidad':        ['Sexto'],   # rutas legado de grado 6
}

def _curso_esperado(prefijo):
    """Devuelve los cursos que corresponden a un prefijo de ruta."""
    for p, cursos in _PREFIJO_A_CURSO.items():
        if prefijo.startswith(p):
            return cursos
    return []

def ruta_modulo(ruta, template):
    """Crea una ruta de módulo que verifica el curso del estudiante."""
    def vista():
        if 'id' not in session:
            return redirect(url_for('login'))

        # Los administradores tienen acceso libre
        if session.get('tipo') == 'administrador':
            return render_template(template)

        import re as _re
        match  = _re.match(r'^(.*?modulo)', ruta)
        prefijo = match.group(1) if match else ruta

        curso_estudiante = session.get('curso', '')
        cursos_validos   = _curso_esperado(prefijo)

        if curso_estudiante not in cursos_validos:
            cursos_str = ', '.join(cursos_validos) if cursos_validos else 'otro curso'
            flash(
                f"⚠️ Este módulo corresponde a {cursos_str}. "
                f"Tú estás registrado en '{curso_estudiante}'. "
                f"Solo puedes acceder a los módulos de tu curso.",
                "danger"
            )
            return redirect(url_for('tematicas'))

        # 2. Verificar límite freemium: módulos 5-8 requieren suscripción
        num_match  = _re.search(r'(\d+)$', ruta)
        num_modulo = int(num_match.group(1)) if num_match else 0

        if num_modulo > 4:
            plan = session.get('plan', 'gratuito')
            if plan == 'gratuito':
                flash(
                    "🔒 Este módulo requiere una suscripción activa. "
                    "Los módulos 1 al 4 son gratuitos. "
                    "¡Suscríbete para desbloquear los módulos 5 al 8!",
                    "warning"
                )
                return redirect(url_for('planes'))

        return render_template(template)

    vista.__name__ = ruta  # Flask necesita nombres únicos
    return vista

# ─── UNIDADES GRADO 1-3 (legado) ─────────────────────────────────────────────
for _n in range(1, 9):
    app.add_url_rule(
        f'/unidad{_n}',
        endpoint=f'unidad{_n}',
        view_func=ruta_modulo(f'unidad{_n}', f'unidad{_n}.html')
    )
# ─── MÓDULOS GRADO 1 ──────────────────────────────────────────────────────────
for _n in range(1, 9):
    app.add_url_rule(
        f'/Grado1_modulo{_n}',
        endpoint=f'Grado1_modulo{_n}',
        view_func=ruta_modulo(f'Grado1_modulo{_n}', f'Grado1_modulo{_n}.html')
    )

# ─── MÓDULOS GRADO 2 ──────────────────────────────────────────────────────────
for _n in range(1, 9):
    app.add_url_rule(
        f'/Grado2_modulo{_n}',
        endpoint=f'Grado2_modulo{_n}',
        view_func=ruta_modulo(f'Grado2_modulo{_n}', f'Grado2_modulo{_n}.html')
    )

# ─── MÓDULOS GRADO  3──────────────────────────────────────────────────────────
for _n in range(1, 9):
    app.add_url_rule(
        f'/Grado3_modulo{_n}',
        endpoint=f'Grado3_modulo{_n}',
        view_func=ruta_modulo(f'Grado3_modulo{_n}', f'Grado3_modulo{_n}.html')
    )

# ─── MÓDULOS GRADO 4 ──────────────────────────────────────────────────────────
for _n in range(1, 9):
    app.add_url_rule(
        f'/Grado4_modulo{_n}',
        endpoint=f'Grado4_modulo{_n}',
        view_func=ruta_modulo(f'Grado4_modulo{_n}', f'Grado4_modulo{_n}.html')
    )

# ─── MÓDULOS GRADO 5 ──────────────────────────────────────────────────────────
for _n in range(1, 9):
    app.add_url_rule(
        f'/Grado5_modulo{_n}',
        endpoint=f'Grado5_modulo{_n}',
        view_func=ruta_modulo(f'Grado5_modulo{_n}', f'Grado5_modulo{_n}.html')
    )

# ─── MÓDULOS GRADO 6 ──────────────────────────────────────────────────────────
for _n in range(1, 9):
    app.add_url_rule(
        f'/Grado6_modulo{_n}',
        endpoint=f'Grado6_modulo{_n}',
        view_func=ruta_modulo(f'Grado6_modulo{_n}', f'Grado6_modulo{_n}.html')
    )

# ─── INSIGNIAS ───────────────────────────────────────────────────────────────
def verificar_insignias(usuario_id):
    """Evalúa y otorga insignias al estudiante según su actividad en progreso."""
    db  = conectar()
    cur = db.cursor()

    def otorgar(codigo):
        try:
            cur.execute("""
                INSERT INTO insignias_estudiante (usuario_id, insignia_id)
                SELECT ?, id FROM insignias_catalogo WHERE codigo = ?
                  AND NOT EXISTS (
                    SELECT 1 FROM insignias_estudiante ie
                    JOIN insignias_catalogo ic ON ic.id = ie.insignia_id
                    WHERE ie.usuario_id = ? AND ic.codigo = ?
                  )
            """, (usuario_id, codigo, usuario_id, codigo))
        except Exception:
            pass

    cur.execute("""
        SELECT COUNT(*)                                     AS partidas,
               SUM(CASE WHEN fallos = 0 THEN 1 ELSE 0 END) AS sin_fallos,
               MAX(puntaje)                                 AS max_puntaje,
               COUNT(DISTINCT unidad)                       AS modulos_distintos
        FROM progreso WHERE usuario_id = ?
    """, (usuario_id,))
    row = cur.fetchone()
    partidas, sin_fallos, max_puntaje, modulos = row[0], row[1], row[2], row[3]

    if partidas and partidas >= 1:  otorgar('primer_juego')
    if sin_fallos and sin_fallos >= 1:  otorgar('sin_errores')
    if max_puntaje and max_puntaje >= 100:  otorgar('puntaje_100')
    if modulos and modulos >= 4:  otorgar('modulo_5')
    if modulos and modulos >= 8:  otorgar('grado_completo')
    if partidas and partidas >= 10: otorgar('constante')

    cur.execute("""
        SELECT DISTINCT CAST(fecha AS DATE) AS dia
        FROM progreso WHERE usuario_id = ?
        ORDER BY dia DESC
    """, (usuario_id,))
    dias = [r[0] for r in cur.fetchall()]
    racha = 1
    for i in range(len(dias) - 1):
        if (dias[i] - dias[i + 1]).days == 1:
            racha += 1
        else:
            break
    if racha >= 3: otorgar('racha_3')
    if racha >= 7: otorgar('racha_7')

    db.commit()
    db.close()

# ─── GUARDAR PROGRESO ─────────────────────────────────────────────────────────
@app.route('/guardar_progreso', methods=['POST'])
def guardar_progreso():
    if 'id' not in session:
        return jsonify({"error": "No has iniciado sesión"}), 401

    data    = request.get_json()
    grado   = data.get("grado", 0)
    unidad  = data.get("unidad")
    aciertos = data.get("aciertos")
    total   = data.get("total")
    puntaje = data.get("puntaje")
    fallos  = total - aciertos if (total and aciertos is not None) else 0

    db  = conectar()
    cur = db.cursor()
    cur.execute("""
        INSERT INTO progreso (usuario_id, grado, unidad, aciertos, fallos, total, puntaje, fecha)
        VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE())
    """, (session['id'], grado, unidad, aciertos, fallos, total, puntaje))
    db.commit()
    db.close()

    try:
        verificar_insignias(session['id'])
    except Exception:
        pass

    return jsonify({"success": True, "grado": grado, "unidad": unidad, "puntaje": puntaje})

# ─── PROGRESO ESTUDIANTE ──────────────────────────────────────────────────────
@app.route('/progreso_estudiante')
def progreso_estudiante():
    if 'id' not in session:
        return redirect(url_for('login'))

    usuario_id = session['id']

    # ── 1. Verificar que el estudiante ya completó su registro académico ──
    db  = conectar()
    cur = db.cursor()
    cur.execute(
        "SELECT curso FROM informacion_estudiantes WHERE usuario_id = ?",
        (usuario_id,)
    )
    fila_info = cur.fetchone()
    db.close()

    if not fila_info:
        # El estudiante aún no llenó su información → redirigir al formulario
        session['nuevo_usuario_id'] = usuario_id
        flash("Debes completar tu información académica antes de ver tu progreso.", "warning")
        return redirect(url_for('registro_estudiante'))

    curso_registrado = fila_info[0]
    # Asegurar que la sesión tenga el curso actualizado
    session['curso'] = curso_registrado

    # ── 2. Obtener el progreso del estudiante ──
    db  = conectar()
    cur = db.cursor()
    cur.execute("""
        SELECT grado, unidad, aciertos, fallos, total, puntaje, fecha
        FROM progreso
        WHERE usuario_id = ?
        ORDER BY fecha DESC
    """, (usuario_id,))
    filas = cur.fetchall()
    db.close()

    progreso = []
    for f in filas:
        progreso.append({
            "grado":    f[0],
            "unidad":   f[1],
            "aciertos": f[2],
            "fallos":   f[3],
            "total":    f[4],
            "puntaje":  round(f[5], 1) if f[5] else 0,
            "fecha":    f[6]
        })

    # ── 3. Estadísticas resumen ──
    total_jugadas  = len(progreso)
    total_aciertos = sum(p['aciertos'] or 0 for p in progreso)
    total_fallos   = sum(p['fallos']   or 0 for p in progreso)
    promedio       = round(sum(p['puntaje'] for p in progreso) / total_jugadas, 1) if total_jugadas else 0

    # ── 4. Calcular módulos completados vs total del curso ──
    info_curso     = CURSOS_DISPONIBLES.get(curso_registrado, {})
    total_modulos  = 8   # cada curso tiene 8 módulos/unidades
    # Unidades únicas jugadas que pertenecen al curso actual
    unidades_jugadas = set(p['unidad'] for p in progreso if p['unidad'])
    modulos_completados = len(unidades_jugadas)
    curso_completado    = modulos_completados >= total_modulos

    # ── 5. Consultar insignias ──
    db  = conectar()
    cur = db.cursor()
    cur.execute("""
        SELECT c.nombre, c.emoji, c.descripcion, c.color, e.fecha
        FROM insignias_estudiante e
        JOIN insignias_catalogo c ON c.id = e.insignia_id
        WHERE e.usuario_id = ?
        ORDER BY e.fecha DESC
    """, (usuario_id,))
    insignias_ganadas = [
        {"nombre": r[0], "emoji": r[1], "descripcion": r[2], "color": r[3], "fecha": r[4]}
        for r in cur.fetchall()
    ]
    cur.execute("""
        SELECT nombre, emoji, descripcion, color
        FROM insignias_catalogo
        WHERE id NOT IN (
            SELECT insignia_id FROM insignias_estudiante WHERE usuario_id = ?
        )
    """, (usuario_id,))
    insignias_pendientes = [
        {"nombre": r[0], "emoji": r[1], "descripcion": r[2], "color": r[3]}
        for r in cur.fetchall()
    ]
    db.close()

    return render_template(
        "progreso_estudiante.html",
        progreso=progreso,
        curso=curso_registrado,
        total_jugadas=total_jugadas,
        total_aciertos=total_aciertos,
        total_fallos=total_fallos,
        promedio=promedio,
        modulos_completados=modulos_completados,
        total_modulos=total_modulos,
        curso_completado=curso_completado,
        insignias_ganadas=insignias_ganadas,
        insignias_pendientes=insignias_pendientes,
    )

# ─── PROGRESO ADMINISTRADOR CON KNN + FILTRO POR CURSO ────────────────────────
@app.route('/progreso')
def progreso():
    if 'id' not in session:
        return redirect(url_for('login'))

    # ── ESTUDIANTE ──
    if session['tipo'] != 'administrador':
        return redirect(url_for('progreso_estudiante'))

    # ── ADMINISTRADOR ──
    curso_filtro = request.args.get('curso', 'Todos')

    db  = conectar()
    cur = db.cursor()

    # Vista que combina usuarios + informacion_estudiantes + progreso
    cur.execute("SELECT * FROM vista_datos_prediccion")
    rows = cur.fetchall()
    cols = [desc[0] for desc in cur.description]
    db.close()

    df = pd.DataFrame.from_records(rows, columns=cols)

    if df.empty:
        return render_template("progreso_admin.html",
                               datos=[], grafico_knn=None,
                               cursos=list(CURSOS_DISPONIBLES.keys()),
                               curso_filtro=curso_filtro)

    # ── Filtrar por curso si se seleccionó uno ──
    if curso_filtro != 'Todos' and 'curso' in df.columns:
        df = df[df['curso'] == curso_filtro].copy()

    if df.empty:
        return render_template("progreso_admin.html",
                               datos=[], grafico_knn=None,
                               cursos=list(CURSOS_DISPONIBLES.keys()),
                               curso_filtro=curso_filtro)

    df = df.fillna(value=np.nan)

    # Normalizar acceso_internet
    if 'acceso_internet' in df.columns:
        df['acceso_internet_norm'] = df['acceso_internet'].astype(str).str.lower().map({
            't': True, 'f': False, 'true': True, 'false': False,
            '1': True, '0': False, 'yes': True, 'no': False
        }).fillna(False)
    else:
        df['acceso_internet_norm'] = False

    numeric_cols = ['edad', 'estrato', 'horas_estudio_dia', 'promedio_anterior',
                    'motivacion', 'estres', 'apoyo_familiar', 'satisfaccion_estudio',
                    'promedio_puntaje', 'progreso_general']
    for c in numeric_cols:
        df[c] = pd.to_numeric(df.get(c, 0), errors='coerce').fillna(0)

    # Aciertos y fallos por estudiante (desde tabla progreso)
    db2  = conectar()
    cur2 = db2.cursor()
    cur2.execute("""
        SELECT usuario_id,
               SUM(aciertos) AS total_aciertos,
               SUM(fallos)   AS total_fallos,
               COUNT(*)      AS partidas
        FROM progreso
        GROUP BY usuario_id
    """)
    filas_prog = cur2.fetchall()
    db2.close()

    prog_dict = {f[0]: {"aciertos": f[1], "fallos": f[2], "partidas": f[3]} for f in filas_prog}
    df['total_aciertos'] = df['usuario_id'].apply(lambda uid: prog_dict.get(uid, {}).get('aciertos', 0))
    df['total_fallos']   = df['usuario_id'].apply(lambda uid: prog_dict.get(uid, {}).get('fallos',   0))
    df['partidas']       = df['usuario_id'].apply(lambda uid: prog_dict.get(uid, {}).get('partidas', 0))

    # Codificar rendimiento
    if 'rendimiento_real' not in df.columns:
        df['rendimiento_real'] = 'Sin datos'
    le = LabelEncoder()
    try:
        df['rendimiento_label'] = le.fit_transform(df['rendimiento_real'].astype(str))
    except Exception:
        df['rendimiento_label'] = 0
        le.classes_ = np.array([str(x) for x in df['rendimiento_real'].unique()])

    X = df[numeric_cols].values
    y = df['rendimiento_label'].values

    # Entrenar KNN
    if len(set(y.tolist())) > 1 and X.shape[0] > 1:
        knn = KNeighborsClassifier(n_neighbors=min(3, len(df)))
        try:
            knn.fit(X, y)
            df['prediccion_label'] = knn.predict(X)
        except Exception:
            df['prediccion_label'] = y
    else:
        df['prediccion_label'] = y

    try:
        df['rendimiento_predicho'] = le.inverse_transform(df['prediccion_label'].astype(int))
    except Exception:
        df['rendimiento_predicho'] = df['rendimiento_real'].astype(str)

    # Descripciones naturales
    descripciones = []
    for _, row in df.iterrows():
        motivos = []
        if not row['acceso_internet_norm']:
            motivos.append("no cuenta con acceso estable a internet")
        if row['horas_estudio_dia'] < 1:
            motivos.append("dedica poco tiempo diario al estudio")
        if row['motivacion'] <= 2:
            motivos.append("muestra baja motivación académica")
        if row['estres'] >= 4:
            motivos.append("presenta altos niveles de estrés")
        if row['apoyo_familiar'] <= 2:
            motivos.append("recibe poco apoyo familiar")
        if row.get('total_fallos', 0) > row.get('total_aciertos', 0):
            motivos.append("tiene más fallos que aciertos en los juegos")

        if not motivos:
            texto = "Demuestra un equilibrio saludable entre sus hábitos de estudio y bienestar personal."
        else:
            texto = "Su rendimiento podría mejorar, ya que " + ", ".join(motivos) + "."
        descripciones.append(texto)
    df['descripcion'] = descripciones

    def color_por_rendimiento(valor):
        v = str(valor).lower()
        if "alto"  in v: return "#b6fcb6"
        if "medio" in v: return "#fff5ba"
        if "bajo"  in v: return "#fcb6b6"
        return "#ffffff"
    df['color_fila'] = df['rendimiento_predicho'].apply(color_por_rendimiento)

    # Gráfico KNN
    fig, ax = plt.subplots(figsize=(7, 5))
    scatter = ax.scatter(
        df['promedio_puntaje'], df['progreso_general'],
        c=df['prediccion_label'], cmap='RdYlGn', s=100, edgecolor='k', alpha=0.85
    )
    plt.colorbar(scatter, ax=ax, label='Nivel de rendimiento')
    ax.set_xlabel('Promedio de Puntaje (%)')
    ax.set_ylabel('Progreso General (%)')
    titulo = f'Rendimiento Académico KNN — {curso_filtro}' if curso_filtro != 'Todos' else 'Rendimiento Académico KNN — Todos los cursos'
    ax.set_title(titulo)
    ax.grid(True, alpha=0.3)

    # Anotar nombres en el gráfico
    for _, r in df.iterrows():
        ax.annotate(str(r.get('nombre', '')),
                    (r['promedio_puntaje'], r['progreso_general']),
                    fontsize=7, alpha=0.7,
                    xytext=(3, 3), textcoords='offset points')

    img = io.BytesIO()
    plt.savefig(img, format='png', bbox_inches='tight', dpi=100)
    img.seek(0)
    grafico_knn = base64.b64encode(img.getvalue()).decode()
    plt.close()

    return render_template(
        "progreso_admin.html",
        datos=df.to_dict(orient='records'),
        grafico_knn=grafico_knn,
        cursos=list(CURSOS_DISPONIBLES.keys()),
        curso_filtro=curso_filtro
    )

# ─── RECUPERAR CONTRASEÑA ─────────────────────────────────────────────────────
@app.route('/recuperar', methods=['GET', 'POST'])
def recuperar():
    if request.method == 'POST':
        correo = request.form['correo']
        conexion = conectar()
        cursor   = conexion.cursor()
        cursor.execute("SELECT id FROM usuarios WHERE correo = ?", (correo,))
        usuario = cursor.fetchone()
        conexion.close()
        if usuario:
            codigo = str(random.randint(100000, 999999))
            session['codigo_verificacion'] = codigo
            session['correo_usuario']      = correo
            msg = Message('Código de verificación - RETOMATE',
                          sender=app.config['MAIL_USERNAME'], recipients=[correo])
            msg.body = f'Tu código de verificación es: {codigo}'
            mail.send(msg)
            flash('Se ha enviado un código de verificación a tu correo.', 'success')
            return redirect(url_for('verificar_codigo'))
        else:
            flash('El correo no está registrado.', 'danger')
    return render_template('recuperar.html')

@app.route('/verificar', methods=['GET', 'POST'])
def verificar_codigo():
    if request.method == 'POST':
        codigo = request.form['codigo']
        if 'codigo_verificacion' in session and codigo == session['codigo_verificacion']:
            return redirect(url_for('nueva_contrasena'))
        else:
            flash('Código incorrecto. Intenta nuevamente.', 'danger')
            return redirect(url_for('verificar_codigo'))
    return render_template('verificar.html')

@app.route('/nueva_contrasena', methods=['GET', 'POST'])
def nueva_contrasena():
    if request.method == 'POST':
        nueva = request.form['contrasena']
        correo = session.get('correo_usuario')
        if correo:
            hashed = generate_password_hash(nueva)
            conexion = conectar()
            cursor   = conexion.cursor()
            cursor.execute("UPDATE usuarios SET contrasena = ? WHERE correo = ?", (hashed, correo))
            conexion.commit()
            conexion.close()
            flash('Tu contraseña ha sido actualizada exitosamente.', 'success')
            session.pop('correo_usuario', None)
            session.pop('codigo_verificacion', None)
            return redirect(url_for('login'))
        else:
            flash('Error en la sesión, vuelve a intentarlo.', 'danger')
            return redirect(url_for('recuperar'))
    return render_template('nueva_contrasena.html')

# ─── PLANES / SUSCRIPCIÓN ────────────────────────────────────────────────────
@app.route('/planes')
def planes():
    if 'id' not in session:
        return redirect(url_for('login'))
    plan_actual = session.get('plan', 'gratuito')
    return render_template('planes.html', plan_actual=plan_actual)

@app.route('/activar_plan', methods=['POST'])
def activar_plan():
    """Activa un plan de suscripción para el estudiante."""
    if 'id' not in session:
        return redirect(url_for('login'))

    plan = request.form.get('plan')
    if plan not in ('premium_estudiante', 'institucional'):
        flash("Plan no válido.", "danger")
        return redirect(url_for('planes'))

    usuario_id = session['id']
    db  = conectar()
    cur = db.cursor()

    # Desactivar planes anteriores
    cur.execute("UPDATE suscripciones SET activa = 0 WHERE usuario_id = ?", (usuario_id,))

    # Insertar nueva suscripción activa por 30 días
    cur.execute("""
        INSERT INTO suscripciones (usuario_id, [plan], fecha_inicio, fecha_fin, activa)
        VALUES (?, ?, CAST(GETDATE() AS DATE),
                DATEADD(DAY, 30, CAST(GETDATE() AS DATE)), 1)
    """, (usuario_id, plan))

    db.commit()
    db.close()

    session['plan'] = plan
    nombre_plan = "Premium Estudiante" if plan == 'premium_estudiante' else "Institucional"
    flash(f"✅ ¡Plan {nombre_plan} activado! Tienes acceso completo a los 8 módulos de tu grado.", "success")
    return redirect(url_for('tematicas'))

# ─── CERTIFICADOS ─────────────────────────────────────────────────────────────
def _generar_pdf_certificado(nombre, curso, fecha_str, codigo):
    import os
    buf  = BytesIO()
    W, H = landscape(A4)
    c    = rl_canvas.Canvas(buf, pagesize=landscape(A4))

    # ── Fondo blanco ──────────────────────────────────────────────────────────
    c.setFillColorRGB(1, 1, 1)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # ── Bordes dorados ────────────────────────────────────────────────────────
    c.setStrokeColorRGB(0.85, 0.70, 0.10)
    c.setLineWidth(6)
    c.rect(22, 22, W-44, H-44, fill=0, stroke=1)
    c.setLineWidth(2)
    c.setStrokeColorRGB(1.0, 0.75, 0.10)
    c.rect(32, 32, W-64, H-64, fill=0, stroke=1)

    # ── Logo (izquierda) ──────────────────────────────────────────────────────
    logo_path = os.path.join(os.path.dirname(__file__), 'static', 'img', 'logo.jpg')
    logo_h = 100
    logo_w = 100
    if os.path.exists(logo_path):
        c.drawImage(logo_path, 50, H - 50 - logo_h,
                    width=logo_w, height=logo_h, preserveAspectRatio=True, mask='auto')

    # ── Encabezado ────────────────────────────────────────────────────────────
    c.setFillColorRGB(0.55, 0.35, 0.05)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(W/2, H - 75, "PLATAFORMA EDUCATIVA DE MATEMATICAS")

    c.setFont("Helvetica-Bold", 44)
    c.setFillColorRGB(0.85, 0.60, 0.05)
    c.drawCentredString(W/2, H - 118, "RETOMATE")

    c.setStrokeColorRGB(0.85, 0.65, 0.10)
    c.setLineWidth(1.5)
    c.line(W/2 - 180, H - 130, W/2 + 180, H - 130)

    # ── Cuerpo ────────────────────────────────────────────────────────────────
    c.setFillColorRGB(0.2, 0.2, 0.2)
    c.setFont("Helvetica", 14)
    c.drawCentredString(W/2, H - 165, "Certifica que")

    c.setFont("Helvetica-Bold", 30)
    c.setFillColorRGB(0.70, 0.45, 0.02)
    c.drawCentredString(W/2, H - 208, nombre)
    nw = c.stringWidth(nombre, "Helvetica-Bold", 30)
    c.setStrokeColorRGB(0.85, 0.65, 0.10)
    c.setLineWidth(1)
    c.line(W/2 - nw/2, H - 216, W/2 + nw/2, H - 216)

    c.setFillColorRGB(0.2, 0.2, 0.2)
    c.setFont("Helvetica", 13)
    c.drawCentredString(W/2, H - 248,
        "ha completado satisfactoriamente todos los modulos del curso")

    c.setFont("Helvetica-Bold", 22)
    c.setFillColorRGB(0.70, 0.45, 0.02)
    c.drawCentredString(W/2, H - 280, curso)

    c.setFillColorRGB(0.35, 0.35, 0.35)
    c.setFont("Helvetica-Oblique", 11)
    c.drawCentredString(W/2, H - 310,
        "demostrando dedicacion, esfuerzo y dominio de los conceptos matematicos.")

    c.setFillColorRGB(0.2, 0.2, 0.2)
    c.setFont("Helvetica", 11)
    c.drawCentredString(W/2, H - 340, f"Expedido el  {fecha_str}")

    # ── Firmas (solo 2, centradas) ────────────────────────────────────────────
    firma_h  = 70
    firma_w  = 130
    y_linea  = 125
    y_nombre = 110
    y_cargo  = 95

    firmantes = [
        (W/3,   "Laura Nataly Romero Romero",    "Directora del Proyecto RETOMATE",
         os.path.join(os.path.dirname(__file__), 'static', 'img', 'FNataly.jpeg')),
        (2*W/3, "Maria Alejandra Pena Gonzalez", "Directora del Proyecto RETOMATE",
         os.path.join(os.path.dirname(__file__), 'static', 'img', 'FAlejandra.jpeg')),
    ]

    for cx, nf, cargo, firma_path in firmantes:
        # Foto de firma justo encima de la línea
        if os.path.exists(firma_path):
            c.drawImage(firma_path,
                        cx - firma_w/2, y_linea - firma_h + 50,
                        width=firma_w, height=firma_h,
                        preserveAspectRatio=True, mask='auto')

        # Línea
        c.setStrokeColorRGB(0.55, 0.40, 0.05)
        c.setLineWidth(0.8)
        c.line(cx - 90, y_linea, cx + 90, y_linea)

        # Nombre
        c.setFillColorRGB(0.15, 0.15, 0.15)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(cx, y_nombre, nf)

        # Cargo
        c.setFont("Helvetica", 9)
        c.setFillColorRGB(0.55, 0.40, 0.05)
        c.drawCentredString(cx, y_cargo, cargo)

    # ── Código de verificación ────────────────────────────────────────────────
    c.setFillColorRGB(0.55, 0.50, 0.35)
    c.setFont("Helvetica", 7.5)
    c.drawString(38, 38, f"Codigo de verificacion: {codigo}")

    c.save()
    buf.seek(0)
    return buf
@app.route('/certificado/<curso>')
def descargar_certificado(curso):
    if 'id' not in session:
        return redirect(url_for('login'))
    if session.get('tipo') == 'administrador':
        flash("Los administradores no tienen certificados.", "info")
        return redirect(url_for('progreso'))

    usuario_id = session['id']
    nombre     = session['nombre']

    db  = conectar()
    cur = db.cursor()
    cur.execute("""
        SELECT COUNT(DISTINCT unidad)
        FROM progreso
        WHERE usuario_id = ? AND puntaje >= 40
    """, (usuario_id,))
    modulos_ok = cur.fetchone()[0] or 0

    if modulos_ok < 8:
        db.close()
        flash(f"Aún no puedes descargar el certificado. Tienes {modulos_ok}/8 módulos aprobados.", "warning")
        return redirect(url_for('progreso_estudiante'))

    cur.execute("""
        SELECT codigo, fecha_emision FROM certificados
        WHERE usuario_id = ? AND curso = ?
    """, (usuario_id, curso))
    fila = cur.fetchone()

    if fila:
        codigo        = fila[0]
        fecha_emision = fila[1]
    else:
        codigo        = str(uuid.uuid4()).upper()[:19]
        fecha_emision = datetime.now()
        cur.execute("""
            INSERT INTO certificados (usuario_id, curso, fecha_emision, codigo)
            VALUES (?, ?, CAST(GETDATE() AS DATE), ?)
        """, (usuario_id, curso, codigo))
        db.commit()

    db.close()

    meses = {1:'enero',2:'febrero',3:'marzo',4:'abril',5:'mayo',6:'junio',
             7:'julio',8:'agosto',9:'septiembre',10:'octubre',11:'noviembre',12:'diciembre'}
    if hasattr(fecha_emision, 'day'):
        fecha_str = f"{fecha_emision.day} de {meses.get(fecha_emision.month,'')} de {fecha_emision.year}"
    else:
        fecha_str = str(fecha_emision)

    buf = _generar_pdf_certificado(nombre, curso, fecha_str, codigo)
    nombre_archivo = f"Certificado_RETOMATE_{curso.replace(' ','_')}_{usuario_id}.pdf"

    return send_file(buf, mimetype='application/pdf',
                     as_attachment=True, download_name=nombre_archivo)

@app.route('/politicas')
def politicas():
    return render_template('politicas.html')

@app.route('/logout')
def logout():
    session.clear()
    flash("Sesión cerrada correctamente", "info")
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True, port=5000)