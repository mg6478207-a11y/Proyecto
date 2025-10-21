# probar_hash.py
import MySQLdb
from werkzeug.security import check_password_hash

def conectar():
    return MySQLdb.connect(
        host='localhost',
        user='root',
        passwd='',
        db='retomate',
        charset='utf8'
    )

correo_a_probar = input("Correo a probar: ").strip()
clave_a_probar = input("Contraseña a probar (texto plano): ").strip()

db = conectar()
cur = db.cursor(MySQLdb.cursors.DictCursor)
cur.execute("SELECT * FROM usuarios WHERE correo=%s", (correo_a_probar,))
usuario = cur.fetchone()
db.close()

if not usuario:
    print("-> No se encontró usuario con ese correo.")
else:
    print("-> Usuario encontrado. Información en BD (clave visible abajo):")
    # Mostrar las keys que vienen en el dict (por si el nombre de la columna se mapea raro)
    print("Keys del registro:", list(usuario.keys()))
    # Mostrar el valor crudo (y su tipo) de la contraseña almacenada
    hash_bd = usuario.get('contraseña') or usuario.get('contrasena') or usuario.get('password')
    print("Tipo del valor hash en BD:", type(hash_bd))
    print("Longitud del hash:", len(hash_bd) if hash_bd else None)
    print("Hash (primeros 120 chars):", (hash_bd[:120] if hash_bd else "NULO"))
    print("--- Ahora verifico check_password_hash ---")
    try:
        ok = check_password_hash(hash_bd, clave_a_probar)
        print("check_password_hash ->", ok)
    except Exception as e:
        print("Error al ejecutar check_password_hash:", repr(e))
