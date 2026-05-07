import pyodbc

conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost\\SQLEXPRESS;"
    "DATABASE=retomate;"
    "Trusted_Connection=yes;"
)

print("Conexión exitosa")