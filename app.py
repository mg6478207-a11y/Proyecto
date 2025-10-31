from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
#import MySQLdb
import psycopg
from psycopg.rows import dict_row
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

# ---------- CONFIGURACIÓN DE CORREO (Flask-Mail) - COLOCAR AQUÍ ----------
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'retomateproy@gmail.com'               # <- tu email remitente
app.config['MAIL_PASSWORD'] = 'xpyt uhsl oglx gdjt'       # <- contraseña de aplicación (ver abajo)
mail = Mail(app)

# -------------------- Conexión a la base de datos --------------------
def conectar():
    conn = psycopg.connect(
        host="dpg-d3so92h5pdvs73fp0460-a.oregon-postgres.render.com",
        dbname="retomate_db",
        user="retomate_db_user",
        password="miZj09YIgbDHOeWmL6OBUgmJ2hgj1kVX",
        port="5432",
        sslmode="require"
    )
    # fijar la zona horaria de la sesión a Colombia (America/Bogota)
    with conn.cursor() as cur:
        cur.execute("SET TIME ZONE 'America/Bogota';")
    return conn

# -------------------- Página principal --------------------
@app.route('/')
def home():
    return render_template("index.html")

# -------------------- LOGIN --------------------
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        correo = request.form['correo']
        contrasena = request.form['contrasena']
        aceptar = request.form.get('aceptar')

        # Validar aceptación de políticas
        if not aceptar:
            flash("Debes aceptar las políticas de tratamiento de datos.", "warning")
            return render_template("login.html")

        db = conectar()
        cur = db.cursor(row_factory=dict_row)
        cur.execute("SELECT * FROM usuarios WHERE correo=%s", (correo,))
        usuario = cur.fetchone()
        db.close()

        if usuario:
            if check_password_hash(usuario['contrasena'], contrasena):
                session['id'] = usuario['id']
                session['nombre'] = usuario['nombre']
                session['tipo'] = usuario['tipo']

                flash(f"Bienvenido {session['nombre']} ({session['tipo']})", "success")

                # 🔹 Redirigir según tipo de usuario
                if session['tipo'] == 'administrador':
                    return redirect(url_for('progreso'))
                else:
                    return redirect(url_for('tematicas'))
            else:
                flash("Contraseña incorrecta.", "danger")
        else:
            flash("El correo no está registrado.", "danger")

    return render_template("login.html")


# -------------------- Registro --------------------
@app.route('/registro', methods=['GET', 'POST'])
def registro():
    if request.method == 'POST':
        nombre = request.form['nombre']
        correo = request.form['correo']
        contrasena = request.form['contrasena']
        confirmar = request.form['confirmar']
        tipo = request.form['tipo']

        # --- Validar contraseñas ---
        if contrasena != confirmar:
            flash("Las contraseñas no coinciden.", "danger")
            return redirect(url_for('registro'))

        # --- Validar complejidad ---
        patron = r'^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$'
        if not re.match(patron, contrasena):
            flash("La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.", "warning")
            return redirect(url_for('registro'))

        hash_contrasena = generate_password_hash(contrasena, method='pbkdf2:sha256', salt_length=16)

        db = conectar()
        cur = db.cursor()
        cur.execute("INSERT INTO usuarios (nombre, correo, contrasena, tipo) VALUES (%s, %s, %s, %s) RETURNING id",
                    (nombre, correo, hash_contrasena, tipo))
        usuario_id = cur.fetchone()[0]
        db.commit()
        db.close()

        # Si es estudiante, pasar a llenar información adicional
        if tipo == 'estudiante':
            session['nuevo_usuario_id'] = usuario_id
            flash("Por favor completa tu información académica.", "info")
            return redirect(url_for('registro_estudiante'))

        flash("Usuario registrado correctamente.", "success")
        return redirect(url_for('login'))

    return render_template("registro.html")

#-----------------------------------Registro_estudiante------------------------------------
@app.route('/registro_estudiante', methods=['GET', 'POST'])
def registro_estudiante():
    if 'nuevo_usuario_id' not in session:
        return redirect(url_for('registro'))

    if request.method == 'POST':
        data = request.form
        db = conectar()
        cur = db.cursor()
        cur.execute("""
            INSERT INTO informacion_estudiantes (
                usuario_id, edad, genero, vive_con_padres, estrato, trabaja,
                horas_estudio_dia, promedio_anterior, nivel_educativo_padres,
                acceso_internet, dispositivo_estudio, distancia_colegio,
                motivacion, estres, apoyo_familiar, satisfaccion_estudio, fecha_registro
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """, (
            session['nuevo_usuario_id'], data['edad'], data['genero'], data['vive_con_padres'],
            data['estrato'], data['trabaja'], data['horas_estudio_dia'], data['promedio_anterior'],
            data['nivel_educativo_padres'], data['acceso_internet'], data['dispositivo_estudio'],
            data['distancia_colegio'], data['motivacion'], data['estres'], data['apoyo_familiar'],
            data['satisfaccion_estudio']
        ))
        db.commit()
        db.close()

        session.pop('nuevo_usuario_id', None)
        flash("Información del estudiante registrada correctamente.", "success")
        return redirect(url_for('login'))

    return render_template('registro_estudiante.html')


# -------------------- Menú de videos --------------------
@app.route('/videos')
def videos():
    return render_template('videos.html')


# -------------------- Menú de temáticas --------------------
@app.route('/tematicas')
def tematicas():
    if 'id' not in session:
        return redirect(url_for('login'))
    return render_template("tematicas.html")


# -------------------- Unidad 1 --------------------
@app.route('/unidad1')
def unidad1():
    if 'id' not in session:
        return redirect(url_for('login'))
    return render_template('unidad1.html')

# -------------------- Unidad 2 --------------------
@app.route('/unidad2')
def unidad2():
    if 'id' not in session:
        return redirect(url_for('login'))
    return render_template('unidad2.html')
# -------------------- Unidad 3 --------------------
@app.route('/unidad3')
def unidad3():
    if 'id' not in session:
        return redirect(url_for('login'))
    return render_template('unidad3.html')

# -------------------- Unidad 4 --------------------
@app.route('/unidad4')
def unidad4():
    if 'id' not in session:
        return redirect(url_for('login'))
    return render_template('unidad4.html')

# -------------------- Unidad 5 --------------------
@app.route('/unidad5')
def unidad5():
    if 'id' not in session:
        return redirect(url_for('login'))
    return render_template('unidad5.html')

# -------------------- Unidad 6 --------------------
@app.route('/unidad6')
def unidad6():
    if 'id' not in session:
        return redirect(url_for('login'))
    return render_template('unidad6.html')

# -------------------- Unidad 7 --------------------
@app.route('/unidad7')
def unidad7():
    if 'id' not in session:
        return redirect(url_for('login'))
    return render_template('unidad7.html')


# -------------------- Unidad 8 --------------------
@app.route('/unidad8')
def unidad8():
    if 'id' not in session:
        return redirect(url_for('login'))
    return render_template('unidad8.html')
# -------------------- Guardar progreso --------------------
@app.route('/guardar_progreso', methods=['POST'])
def guardar_progreso():
    if 'id' not in session:
        return jsonify({"error": "No has iniciado sesión"}), 401

    data = request.get_json()
    unidad = data.get("unidad")
    aciertos = data.get("aciertos")
    total = data.get("total")
    puntaje = data.get("puntaje")

    db = conectar()
    cur = db.cursor()
    cur.execute("""
        INSERT INTO progreso (usuario_id, unidad, aciertos, total, puntaje, fecha)
        VALUES (%s, %s, %s, %s, %s, NOW())
    """, (session['id'], unidad, aciertos, total, puntaje))
    db.commit()
    db.close()

    return jsonify({"success": True, "unidad": unidad, "puntaje": puntaje})

# -------------------- Progreso del estudiante --------------------
@app.route('/progreso_estudiante')
def progreso_estudiante():
    if 'id' not in session:
        return redirect(url_for('login'))

    db = conectar()
    cur = db.cursor()
    cur.execute("""
        SELECT unidad, puntaje, fecha
        FROM progreso
        WHERE usuario_id = %s
        ORDER BY fecha DESC
    """, (session['id'],))
    progreso = cur.fetchall()
    db.close()

    return render_template("progreso_estudiante.html", progreso=progreso)


# -------------------- Progreso del administrador con KNN --------------------
# -------------------- Progreso del administrador con predicción inteligente --------------------
@app.route('/progreso')
def progreso():
    if 'id' not in session:
        return redirect(url_for('login'))

    if session['tipo'] != 'administrador':
        db = conectar()
        cur = db.cursor()
        cur.execute("SELECT unidad, puntaje, fecha FROM progreso WHERE usuario_id=%s", (session['id'],))
        progreso = cur.fetchall()
        db.close()
        return render_template("progreso_estudiante.html", progreso=progreso)

    # === ADMINISTRADOR ===
    db = conectar()
    cur = db.cursor()
    cur.execute("SELECT * FROM vista_datos_prediccion")
    rows = cur.fetchall()
    cols = [desc[0] for desc in cur.description]
    db.close()

    df = pd.DataFrame(rows, columns=cols)

    if df.empty:
        return render_template("progreso_admin.html", datos=[], grafico_knn=None)

    df = df.fillna(value=np.nan)

    # --- Normalizar acceso_internet ---
    if 'acceso_internet' in df.columns:
        df['acceso_internet_norm'] = df['acceso_internet'].astype(str).str.lower().map({
            't': True, 'f': False, 'true': True, 'false': False,
            '1': True, '0': False, 'yes': True, 'no': False
        })
        df['acceso_internet_norm'] = df['acceso_internet_norm'].fillna(False)
    else:
        df['acceso_internet_norm'] = False

    # --- Asegurar numéricos ---
    numeric_cols = ['edad', 'estrato', 'horas_estudio_dia', 'promedio_anterior',
                    'motivacion', 'estres', 'apoyo_familiar', 'satisfaccion_estudio',
                    'promedio_puntaje', 'progreso_general']
    for c in numeric_cols:
        df[c] = pd.to_numeric(df.get(c, 0), errors='coerce').fillna(0)

    # --- Codificar rendimiento ---
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

    # --- Entrenar KNN ---
    if len(set(y.tolist())) > 1 and X.shape[0] > 1:
        knn = KNeighborsClassifier(n_neighbors=3)
        try:
            knn.fit(X, y)
            df['prediccion_label'] = knn.predict(X)
        except Exception:
            df['prediccion_label'] = y
    else:
        df['prediccion_label'] = y

    # --- Decodificar etiquetas ---
    try:
        df['rendimiento_predicho'] = le.inverse_transform(df['prediccion_label'].astype(int))
    except Exception:
        df['rendimiento_predicho'] = df['rendimiento_real'].astype(str)

    # === DESCRIPCIONES NATURALES ===
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

        if not motivos:
            texto = "Demuestra un equilibrio saludable entre sus hábitos de estudio y bienestar personal."
        else:
            texto = "Su rendimiento podría mejorar, ya que " + ", ".join(motivos) + "."
        descripciones.append(texto)
    df['descripcion'] = descripciones

    # === COLORES SEGÚN RENDIMIENTO ===
    def color_por_rendimiento(valor):
        valor = str(valor).lower()
        if "alto" in valor:
            return "#b6fcb6"  # verde claro
        elif "medio" in valor:
            return "#fff5ba"  # amarillo claro
        elif "bajo" in valor:
            return "#fcb6b6"  # rojo claro
        else:
            return "#ffffff"  # blanco por defecto
    df['color_fila'] = df['rendimiento_predicho'].apply(color_por_rendimiento)

    # === GRAFICO KNN ===
    plt.figure(figsize=(6, 5))
    plt.scatter(df['promedio_puntaje'], df['progreso_general'],
                c=df['prediccion_label'], cmap='coolwarm', s=80, edgecolor='k')
    plt.xlabel('Promedio de Puntaje (%)')
    plt.ylabel('Progreso General (%)')
    plt.title('Predicción de Rendimiento Académico (KNN)')

    img = io.BytesIO()
    plt.savefig(img, format='png', bbox_inches='tight')
    img.seek(0)
    grafico_knn = base64.b64encode(img.getvalue()).decode()
    plt.close()

    # === Enviar a plantilla ===
    return render_template("progreso_admin.html",
                           datos=df.to_dict(orient='records'),
                           grafico_knn=grafico_knn)


# -------------------- Recuperar contraseña --------------------

@app.route('/recuperar', methods=['GET', 'POST'])
def recuperar():
    if request.method == 'POST':
        correo = request.form['correo']

        conexion = conectar()
        cursor = conexion.cursor()
        cursor.execute("SELECT id FROM usuarios WHERE correo = %s", (correo,))
        usuario = cursor.fetchone()
        conexion.close()

        if usuario:
            codigo = str(random.randint(100000, 999999))
            session['codigo_verificacion'] = codigo
            session['correo_usuario'] = correo

            # Enviar correo
            msg = Message('Código de verificación - RETOMATE',
                          sender=app.config['MAIL_USERNAME'],
                          recipients=[correo])
            msg.body = f'Tu código de verificación es: {codigo}'
            mail.send(msg)

            flash('Se ha enviado un código de verificación a tu correo.', 'success')
            return redirect(url_for('verificar_codigo'))
        else:
            flash('El correo no está registrado.', 'danger')

    return render_template('recuperar.html')

#--------------------- Verificar --------------------

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

# -------------------- Nueva contraseña --------------------
@app.route('/nueva_contrasena', methods=['GET', 'POST'])
def nueva_contrasena():
    if request.method == 'POST':
        nueva_contrasena = request.form['contrasena']
        correo = session.get('correo_usuario')

        if correo:
            hashed = generate_password_hash(nueva_contrasena)

            conexion = conectar()
            cursor = conexion.cursor()
            cursor.execute("UPDATE usuarios SET contrasena = %s WHERE correo = %s", (hashed, correo))
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
# -------------------- politicas --------------------
@app.route('/politicas')
def politicas():
    return render_template('politicas.html')

# -------------------- Logout --------------------
@app.route('/logout')
def logout():
    session.clear()
    flash("Sesión cerrada correctamente", "info")
    return redirect(url_for('login'))


# -------------------- Main --------------------
if __name__ == '__main__':
    app.run(debug=True)
