import MySQLdb
from werkzeug.security import generate_password_hash

# --- Conexión a tu base de datos ---
conexion = MySQLdb.connect(
    host='localhost',
    user='root',
    passwd='',
    db='retomate',
    charset='utf8'
)

cursor = conexion.cursor()

# --- Leer usuarios y contraseñas actuales ---
cursor.execute("SELECT id, contraseña FROM usuarios")
usuarios = cursor.fetchall()

# --- Encriptar cada contraseña ---
for id_usuario, contraseña in usuarios:
    # Verificar si ya está encriptada (ya contiene pbkdf2)
    if not contraseña.startswith('pbkdf2:sha256:'):
        hash_contraseña = generate_password_hash(contraseña)
        cursor.execute(
            "UPDATE usuarios SET contraseña = %s WHERE id = %s",
            (hash_contraseña, id_usuario)
        )
        print(f"✅ Usuario {id_usuario} actualizado")

# --- Guardar cambios ---
conexion.commit()
conexion.close()

print("🔒 Todas las contraseñas han sido encriptadas correctamente.")
