import psycopg2
from werkzeug.security import generate_password_hash

# --- Conexión a tu base de datos ---
def conectar():
    return psycopg2.connect(
        host="dpg-d3so92h5pdvs73fp0460-a.oregon-postgres.render.com",
        database="retomate_db",
        user="retomate_db_user",
        password="miZj09YIgbDHOeWmL6OBUgmJ2hgj1kVX",
        port="5432",
        sslmode="require"
    )

# Crear la conexión
conexion = conectar()
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
