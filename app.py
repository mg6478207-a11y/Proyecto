from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
#import MySQLdb
import psycopg2
import psycopg2.extras
import matplotlib.pyplot as plt
import io
import base64
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
    conn = psycopg2.connect(
        host="dpg-d3so92h5pdvs73fp0460-a.oregon-postgres.render.com",
        database="retomate_db",
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
        cur = db.cursor(cursor_factory=psycopg2.extras.DictCursor)
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

        # --- Encriptar ---
        hash_contrasena = generate_password_hash(contrasena, method='pbkdf2:sha256', salt_length=16)

        # --- Guardar ---
        db = conectar()
        cur = db.cursor()
        cur.execute("INSERT INTO usuarios (nombre, correo, contrasena, tipo) VALUES (%s, %s, %s, %s)",
                    (nombre, correo, hash_contrasena, tipo))
        db.commit()
        db.close()

        flash("Usuario registrado correctamente.", "success")
        return redirect(url_for('login'))

    return render_template("registro.html")

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


# -------------------- Unidad 3 --------------------
@app.route('/unidad3')
def unidad3():
    if 'id' not in session:
        return redirect(url_for('login'))
    return render_template('unidad3.html')

# -------------------- Unidad 5 --------------------
@app.route('/unidad5')
def unidad5():
    if 'id' not in session:
        return redirect(url_for('login'))
    return render_template('unidad5.html')

# -------------------- Unidad 7 --------------------
@app.route('/unidad7')
def unidad7():
    if 'id' not in session:
        return redirect(url_for('login'))
    return render_template('unidad7.html')


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


# -------------------- Progreso del administrador --------------------
@app.route('/progreso')
def progreso():
    if 'id' not in session:
        return redirect(url_for('login'))

    db = conectar()
    cur = db.cursor()

    if session['tipo'] == 'administrador':
        # traemos nombre, unidad, puntaje, fecha
        cur.execute("""
            SELECT u.nombre, p.unidad, p.puntaje, p.fecha
            FROM progreso p
            JOIN usuarios u ON p.usuario_id = u.id
            ORDER BY p.fecha, u.nombre, p.unidad
        """)
        datos = cur.fetchall()  # lista de tuplas (nombre, unidad, puntaje, fecha)

        grafico_general = None
        graficos_individuales = []  # lista de dicts: {'nombre':..., 'img':...}

        if datos:
            # --- PREPARAR DATOS ORDENADOS POR FECHA PARA GRÁFICO GENERAL ---
            # Convertir fecha a objeto datetime si es string
            registros = []
            for d in datos:
                nombre, unidad, puntaje, fecha = d
                # detectar tipo de fecha
                if isinstance(fecha, str):
                    try:
                        fecha_dt = datetime.strptime(fecha, "%Y-%m-%d %H:%M:%S")
                    except Exception:
                        # intento con ISO
                        fecha_dt = datetime.fromisoformat(fecha)
                else:
                    fecha_dt = fecha  # ya es datetime
                registros.append((fecha_dt, nombre, unidad, float(puntaje)))

            # ordenar por fecha (aunque la query ya ordenó)
            registros.sort(key=lambda x: x[0])

            # X global será índice temporal 0,1,2,...
            y_all = np.array([r[3] for r in registros], dtype=float)
            x_all = np.arange(len(y_all))

            # cálculo de regresión global (si hay al menos 2 puntos)
            if len(x_all) >= 2:
                m_all, b_all = np.polyfit(x_all, y_all, 1)
                linea_all = m_all * x_all + b_all
            else:
                m_all = b_all = None
                linea_all = None

            # generar gráfico general
            plt.figure(figsize=(6,4))
            plt.scatter(x_all, y_all, label='Puntajes', s=30)
            if linea_all is not None:
                plt.plot(x_all, linea_all, color='red', label='Regresión lineal')
            plt.xlabel('Registro (tiempo)')
            plt.ylabel('Puntaje (%)')
            plt.title('Rendimiento general')
            plt.legend()
            plt.tight_layout()

            # pasar a base64
            img = io.BytesIO()
            plt.savefig(img, format='png', bbox_inches='tight')
            img.seek(0)
            grafico_general = base64.b64encode(img.getvalue()).decode()
            plt.close()

            # --- GRÁFICOS INDIVIDUALES (por estudiante) ---
            # Agrupar por nombre
            from collections import defaultdict
            grupos = defaultdict(list)  # nombre -> list de (fecha, unidad, puntaje)
            for fecha_dt, nombre, unidad, puntaje in registros:
                grupos[nombre].append((fecha_dt, unidad, puntaje))

            # Para cada estudiante generar su gráfico individual
            for nombre, lista in grupos.items():
                # ordenar por fecha
                lista.sort(key=lambda x: x[0])
                y = np.array([el[2] for el in lista], dtype=float)
                x = np.arange(len(y))  # 0,1,2,...

                plt.figure(figsize=(5,3))
                plt.scatter(x, y, label='Puntajes', s=30)

                # regresión por estudiante si tiene >=2 puntos
                if len(x) >= 2:
                    m, b = np.polyfit(x, y, 1)
                    linea = m * x + b
                    plt.plot(x, linea, color='red', label='Regresión')
                plt.xlabel('Intentos / Tiempo')
                plt.ylabel('Puntaje (%)')
                plt.title(f'{nombre}')
                plt.ylim(0, 105)
                plt.legend()
                plt.tight_layout()

                img = io.BytesIO()
                plt.savefig(img, format='png', bbox_inches='tight')
                img.seek(0)
                img_b64 = base64.b64encode(img.getvalue()).decode()
                plt.close()

                graficos_individuales.append({'nombre': nombre, 'img': img_b64})

        db.close()
        # renderizamos pasando la tabla 'datos' y las imágenes
        return render_template("progreso_admin.html",
                               datos=datos,
                               grafico_general=grafico_general,
                               graficos_individuales=graficos_individuales)

    else:
        cur.execute("SELECT unidad, puntaje, fecha FROM progreso WHERE usuario_id=%s", (session['id'],))
        progreso = cur.fetchall()
        db.close()
        return render_template("progreso_estudiante.html", progreso=progreso)

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
