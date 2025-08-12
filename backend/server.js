import express, { json } from 'express';
import cors from 'cors';
import db from './db/db.js'
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { parseAndInsertCSV } from './csvFolder/csv.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(json());

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config to push CSV files to a temporal folder
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.csv';
      cb(null, `csv_${Date.now()}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const isCsv = file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv');
    if (!isCsv) return cb(new Error('Solo se permiten archivos .csv'));
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Endpoint with push CSV and load to DB
app.post('/api/csv/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

    const result = await parseAndInsertCSV(req.file.path);

    // Limpia el archivo temporal (no hace fallar si ya no existe)
    await fs.promises.unlink(req.file.path).catch(() => {});

    res.json({ message: 'CSV procesado', ...result });
  } catch (err) {
    console.error('Error procesando CSV:', err);
    res.status(500).json({ error: err.message || 'Error interno' });
  }
});

// Get all of customers
app.get('/api/customers', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM customers');
    res.json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Add new customer
app.post('/api/customers', async (req, res) => {
  const { customerName, address, telephone, email } = req.body;
  console.log('Datos del customer recibidos:', req.body);
  try {
    await db.query('INSERT INTO customers ("customerName", address, telephone, email) VALUES ($1, $2, $3, $4)', [customerName, address, telephone, email]);
    res.json({ message: 'customer agregado' });
  } catch (err) {
    console.error('Error al agregar customer:', err);
    res.status(500).json({ error: err.message, details: err });
  }
});

// update customer
app.put('/api/customers/:id', async (req, res) => {
  const { customerID } = req.params;
  const { customerName, address, telephone, email } = req.body;
  console.log('Actualizando customer:', customerID, req.body);
  try {
    await db.query('UPDATE customers SET "customerName" = $1, address = $2, telephone = $3, email = $4 WHERE "customerID" = $5', [customerName, address, telephone, email, customerID]);
    res.json({ message: 'customer actualizado' });
  } catch (err) {
    console.error('Error al actualizar customer:', err);
    res.status(500).json({ error: err.message, details: err });
  }
});

// Delete customer
app.delete('/api/customers/:id', async (req, res) => {
  const { customerID } = req.params;
  console.log('Eliminando customer con ID:', customerID);
  try {
    await db.query('DELETE FROM customers WHERE "customerID" = $1', [customerID]);
    res.json({ message: 'customer eliminado' });
  } catch (err) {
    console.error('Error al eliminar customer:', err);
    res.status(500).json({ error: err.message, details: err });
  }
});

// Add new user
app.post('/api/users', async (req, res) => {
  const { name, lastName, age, password, role } = req.body;
  console.log('Datos recibidos:', req.body);
  try {
    const hashed = await bcrypt.hash(String(password), 10);
    await db.query('INSERT INTO users (name, "lastName", age, password, role) VALUES ($1, $2, $3, $4, $5)', [name, lastName, age, hashed, role]);
    res.json({ message: 'Usuario agregado' });
  } catch (err) {
    console.error('Error al agregar usuario:', err);
    res.status(500).json({ error: err.message, details: err });
  }
});

// Login: verufy password with bcrypt
app.post('/api/auth/login', async (req, res) => {
  try {
    const username = req.body.user || req.body.name;
    const password = String(req.body.password || '');
    if (!username || !password) return res.status(400).json({ error: 'Faltan credenciales' });

    const { rows } = await db.query('SELECT id, "name", password, role FROM users WHERE user = $1 OR "name" = $1 LIMIT 1', [username]);
    const u = rows[0];
    if (!u) return res.status(401).json({ error: 'Usuario o contraseña inválidos' });

    const stored = u.password == null ? '' : String(u.password);

    let ok = false;
    if (stored.startsWith('$2')) {
      // Parece hash bcrypt
      ok = await bcrypt.compare(password, stored);
    } else {
      // Posible texto plano (compatibilidad)
      ok = stored === password;
      if (ok) {
        // Actualiza a hash para mayor seguridad
        try {
          const newHash = await bcrypt.hash(password, 10);
          await db.query('UPDATE users SET password = $1 WHERE id = $2', [newHash, u.id]);
        } catch (_) {
          // Silenciar error de actualización, el login sigue siendo válido
        }
      }
    }

    if (!ok) return res.status(401).json({ error: 'Usuario o contraseña inválidos' });

    res.json({ ok: true, role: u.role || 'user', user: u.name || u.user });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: err.message || 'Error interno' });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));