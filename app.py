from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import pyodbc
from psycopg.rows import dict_row
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
    'Primero':   {'grado': 1,  'rutas': ['unidad']},
    'Segundo':   {'grado': 2,  'rutas': ['unidad']},
    'Tercero':   {'grado': 3,  'rutas': ['unidad']},
    'Cuarto':    {'grado': 4,  'rutas': ['Grado4_modulo']},
    'Quinto':    {'grado': 5,  'rutas': ['Grado5_modulo']},
    'Sexto':     {'grado': 6,  'rutas': ['Grado6_modulo']},
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
    'unidad':        ['Primero', 'Segundo', 'Tercero'],
    'Grado4_modulo': ['Cuarto'],
    'Grado5_modulo': ['Quinto'],
    'Grado6_modulo': ['Sexto'],
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