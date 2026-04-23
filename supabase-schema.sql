-- TABLA USUARIOS (entrenadores y alumnos)
create table public.usuarios (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  nombre text not null,
  rol text not null check (rol in ('entrenador', 'alumno')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABLA ALUMNOS (ficha completa)
create table public.alumnos (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references public.usuarios(id) on delete set null,
  nombre text not null,
  rut text unique not null,
  fecha_nacimiento date not null,
  categoria text not null,
  enfermedades text,
  contacto_emergencia_nombre text not null,
  contacto_emergencia_telefono text not null,
  activo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABLA EVALUACIONES
create table public.evaluaciones (
  id uuid default gen_random_uuid() primary key,
  alumno_id uuid references public.alumnos(id) on delete cascade not null,
  tipo text not null check (tipo in ('velocidad', 'fuerza', 'potencia', 'resistencia')),
  fecha date not null,
  -- Velocidad
  distancia_metros numeric,
  tiempo_segundos numeric,
  -- Fuerza
  ejercicio text,
  repeticiones integer,
  -- Potencia
  distancia_salto_cm numeric,
  -- Resistencia
  distancia_recorrida_metros numeric,
  tiempo_minutos numeric,
  notas text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABLA CALENDARIO
create table public.calendario (
  id uuid default gen_random_uuid() primary key,
  fecha date not null,
  titulo text not null,
  descripcion text,
  tipo_aptitud text check (tipo_aptitud in ('velocidad', 'fuerza', 'potencia', 'resistencia', 'mixto')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABLA ASISTENCIA
create table public.asistencia (
  id uuid default gen_random_uuid() primary key,
  alumno_id uuid references public.alumnos(id) on delete cascade not null,
  fecha date not null,
  estado text not null check (estado in ('presente', 'ausente', 'justificado', 'licencia_medica')),
  notas text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(alumno_id, fecha)
);

-- TABLA PAGOS
create table public.pagos (
  id uuid default gen_random_uuid() primary key,
  alumno_id uuid references public.alumnos(id) on delete cascade not null,
  mes integer not null check (mes between 1 and 12),
  anio integer not null,
  monto integer default 5000,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'subido', 'verificado', 'rechazado')),
  comprobante_url text,
  notas text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(alumno_id, mes, anio)
);

-- RLS POLICIES
alter table public.usuarios enable row level security;
alter table public.alumnos enable row level security;
alter table public.evaluaciones enable row level security;
alter table public.calendario enable row level security;
alter table public.asistencia enable row level security;
alter table public.pagos enable row level security;

-- Usuarios pueden ver su propio perfil
create policy "usuarios pueden ver su perfil" on public.usuarios
  for select using (auth.uid() = id);

create policy "usuarios pueden actualizar su perfil" on public.usuarios
  for update using (auth.uid() = id);

-- Entrenadores tienen acceso total
create policy "entrenadores acceso total alumnos" on public.alumnos
  for all using (
    exists (select 1 from public.usuarios where id = auth.uid() and rol = 'entrenador')
  );

-- Alumnos solo ven su propia ficha
create policy "alumnos ven su ficha" on public.alumnos
  for select using (usuario_id = auth.uid());

-- Entrenadores acceso total evaluaciones
create policy "entrenadores acceso total evaluaciones" on public.evaluaciones
  for all using (
    exists (select 1 from public.usuarios where id = auth.uid() and rol = 'entrenador')
  );

-- Alumnos ven sus evaluaciones
create policy "alumnos ven sus evaluaciones" on public.evaluaciones
  for select using (
    exists (select 1 from public.alumnos where id = alumno_id and usuario_id = auth.uid())
  );

-- Calendario visible para todos
create policy "todos ven calendario" on public.calendario
  for select using (auth.uid() is not null);

create policy "entrenadores gestionan calendario" on public.calendario
  for all using (
    exists (select 1 from public.usuarios where id = auth.uid() and rol = 'entrenador')
  );

-- Asistencia
create policy "entrenadores acceso total asistencia" on public.asistencia
  for all using (
    exists (select 1 from public.usuarios where id = auth.uid() and rol = 'entrenador')
  );

create policy "alumnos ven su asistencia" on public.asistencia
  for select using (
    exists (select 1 from public.alumnos where id = alumno_id and usuario_id = auth.uid())
  );

-- Pagos
create policy "entrenadores acceso total pagos" on public.pagos
  for all using (
    exists (select 1 from public.usuarios where id = auth.uid() and rol = 'entrenador')
  );

create policy "alumnos gestionan sus pagos" on public.pagos
  for all using (
    exists (select 1 from public.alumnos where id = alumno_id and usuario_id = auth.uid())
  );

-- Bucket para comprobantes de pago y logo
insert into storage.buckets (id, name, public) values ('comprobantes', 'comprobantes', false);
insert into storage.buckets (id, name, public) values ('logo', 'logo', true);

-- Storage policies
create policy "alumnos suben comprobantes" on storage.objects
  for insert with check (bucket_id = 'comprobantes' and auth.uid() is not null);

create policy "entrenadores ven comprobantes" on storage.objects
  for select using (
    bucket_id = 'comprobantes' and
    exists (select 1 from public.usuarios where id = auth.uid() and rol = 'entrenador')
  );

create policy "alumnos ven sus comprobantes" on storage.objects
  for select using (bucket_id = 'comprobantes' and auth.uid() is not null);

create policy "logo publico" on storage.objects
  for select using (bucket_id = 'logo');

create policy "entrenadores suben logo" on storage.objects
  for insert with check (
    bucket_id = 'logo' and
    exists (select 1 from public.usuarios where id = auth.uid() and rol = 'entrenador')
  );
