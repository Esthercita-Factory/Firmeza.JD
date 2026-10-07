# Firmeza

Sistema web de venta y distribución de materiales de construcción.

Gestiona el inventario de productos, el padrón de clientes y el registro de ventas, con un panel de métricas para el administrador.

---

## Requisitos

| Herramienta | Versión | Necesaria para |
|---|---|---|
| .NET SDK | 10.0 | Compilar y ejecutar |
| Docker + Compose | reciente | Levantar PostgreSQL |
| Node.js | 22+ | Frontend Angular (`ClientApp`) |

Verifica que los tengas:

```bash
dotnet --version
docker --version
node --version
```

---

## Levantar el proyecto

### Opción A: Base de datos en Docker, app local (recomendada para desarrollo)

Levanta solo PostgreSQL y deja la app corriendo desde el IDE, con recarga en caliente al compilar.

```bash
docker compose up -d db
dotnet run --project Firmeza.Web
```

La app queda en **http://localhost:5035** y el navegador se abre solo (`launchSettings.json` define ese puerto y `launchBrowser: true`).

Para desarrollo con recarga automática al guardar:

```bash
dotnet watch run --project Firmeza.Web
```

### Opción B: Todo con Docker

```bash
docker compose up -d --build
```

App en **http://localhost:8080**, PostgreSQL en `localhost:5432`.

Detener y borrar también los volúmenes (esto **borra la base de datos**):

```bash
docker compose down -v
```

### Opción C: PostgreSQL instalado en tu máquina

Si ya tienes Postgres, crea la base y ajusta la cadena de conexión:

```bash
createdb firmeza_db
```

Edita `Firmeza.Web/appsettings.json` si tu usuario o contraseña difieren de `postgres` / `mysecretpassword`.

---

## Credenciales de acceso

El usuario administrador se crea automáticamente en el primer arranque, mediante el seeder de `Firmeza.Web/Program.cs`:

| Campo | Valor |
|---|---|
| Usuario | `admin@firmeza.com` |
| Contraseña | `Admin123!` |
| Rol | Administrador |

Si la base ya existe, el seeder no hace nada y esta credencial puede no ser la registrada. En ese caso crea una desde `/Account/Register`.

---

## Rutas de la aplicación

| Ruta | Descripción |
|---|---|
| `/` | Dashboard con métricas (requiere rol Administrador) |
| `/Products` | Listado y CRUD de productos |
| `/Customers` | Listado, búsqueda y CRUD de clientes |
| `/Sales` | Listado de ventas |
| `/Account/Login` | Inicio de sesión |
| `/Account/Register` | Registro de usuarios |

---

## Estructura del proyecto

```
Firmeza/
├── Firmeza.Domain/            # Entidades y reglas de negocio puras (sin dependencias)
├── Firmeza.Application/       # Casos de uso y servicios de la aplicación
├── Firmeza.Infraestructure/   # Acceso a datos, implementaciones concretas
├── Firmeza.Web/               # ASP.NET Core MVC: controladores, vistas, Identity
│   ├── Controllers/           # Home, Products, Customers, Sales, Account, Login
│   ├── Data/                  # ApplicationDbContext y migraciones
│   ├── Models/                # Entidades mapeadas a EF Core
│   ├── ViewModels/            # Modelos de vista y validación de formularios
│   ├── Views/                 # Vistas Razor (.cshtml)
│   ├── Migrations/            # Migraciones de Entity Framework Core
│   ├── wwwroot/               # CSS, JS y assets estáticos
│   └── ClientApp/             # Frontend Angular (en desarrollo, no integrado al build)
├── Firmeza.Tests/             # Pruebas unitarias con xUnit
├── Firmeza.slnx               # Solución de Visual Studio
├── docker-compose.yml         # PostgreSQL 15 + app web
└── Dockerfile                 # Build multi-stage para la imagen de la app
```

La estructura sigue una arquitectura por capas: `Domain` no depende de nada, `Application` depende de `Domain`, `Infrastructure` depende de `Application`, y `Web` depende de `Application` e `Infrastructure`.

---

## Base de datos

PostgreSQL 15, con connection string en `Firmeza.Web/appsettings.json`:

```
Host=localhost;Database=firmeza_db;Username=postgres;Password=mysecretpassword
```

El contexto es `Firmeza.Web/Data/ApplicationDbContext.cs` (hereda de `IdentityDbContext`, por lo que las tablas de Identity conviven con las del negocio).

### Migraciones

```bash
# Aplicar las migraciones existentes
dotnet ef database update --project Firmeza.Web

# Crear una migración nueva
dotnet ef migrations add NombreDelCambio --project Firmeza.Web

# Ver el estado
dotnet ef migrations list --project Firmeza.Web
```

Los datos de Identity (usuarios, roles) se crean por código al arrancar, no por migración.

---

## Pruebas

```bash
dotnet test
```

Estado actual: **3 pruebas, todas en verde**. Cubren la validación de `CustomerViewModel`.

---

## Compilación

```bash
dotnet build Firmeza.slnx
```

Compila los cinco proyectos sin errores. Hay advertencias `NU1901`: el paquete transitivo `NuGet.Packaging` 6.12.1 arrastra una vulnerabilidad de gravedad baja. No afecta al runtime de la aplicación, pero conviene actualizarlo cuando se pueda.

---

## Frontend Angular

`Firmeza.Web/ClientApp/` contiene un frontend Angular 22 con Bootstrap 5. **Todavía no está integrado**: el `.csproj` no lo referencia, así que `dotnet build` no lo compila y el Dockerfile tampoco lo incluye.

Para desarrollarlo por separado:

```bash
cd Firmeza.Web/ClientApp
npm install
npm start          # o: npm run build
```

---

## Problemas frecuentes

**`Npgsql.NpgsqlException: Failed to connect`** — La base no está corriendo. Verifica con `docker compose ps` y levántala con `docker compose up -d db`.

**`dotnet ef` no existe** — Falta el tool global. Instálalo con `dotnet tool install --global dotnet-ef`.

**Conflicto de puertos** — Si el 5432 u 8080 están ocupados, cambia el mapeo en `docker-compose.yml`. Ojo: cambiar el puerto de PostgreSQL exige editar también la connection string en `appsettings.json`.

**No puedo entrar como administrador** — El seeder solo crea el usuario si no existe. Si ya habías corrido la app con otra base, borra el volumen con `docker compose down -v` y vuelve a arrancar.

---

## Notas de seguridad

Estos puntos son conocidos y están pendientes de corrección. No son una lista exhaustiva:

- **Contraseña del admin en texto plano** en `Program.cs` (`Admin123!`). Para desarrollo local es aceptable, pero no debe llegar a producción.
- **Escalada de privilegios en el registro**: `AccountController.Register` permite que cualquiera se cree una cuenta con rol `Administrador` a través del formulario público. Cualquier visitante puede convertirse en admin.
- **Contraseña de PostgreSQL débil** (`mysecretpassword`) tanto en `appsettings.json` como en `docker-compose.yml`, versionados en el repositorio.
- **Sin HTTPS forzado**: solo HTTP en desarrollo. En producción hay que habilitar redirección a HTTPS.