const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Middleware to mock Supabase response structure
const supabaseResponse = (data, error = null) => ({ data, error });

// Regression Files
app.get('/api/regression_files', async (req, res) => {
    const { id, model_type } = req.query;
    try {
        let query = 'SELECT * FROM regression_files';
        const params = [];

        if (id) {
            query += ' WHERE id = $1';
            params.push(id);
        } else if (model_type) {
            query += ' WHERE model_type = $1';
            params.push(model_type);
        }

        query += ' ORDER BY uploaded_at DESC';
        const { rows } = await pool.query(query, params);
        res.json(supabaseResponse(id ? rows[0] : rows));
    } catch (err) {
        res.status(500).json(supabaseResponse(null, { message: err.message }));
    }
});

app.post('/api/regression_files', async (req, res) => {
    const { file_name, model_type, build_type, release_date, sheet_names } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO regression_files (file_name, model_type, build_type, release_date, sheet_names) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [file_name, model_type, build_type, release_date, sheet_names]
        );
        res.json(supabaseResponse(rows[0]));
    } catch (err) {
        res.status(500).json(supabaseResponse(null, { message: err.message }));
    }
});

// Regression Sheets
app.get('/api/regression_sheets', async (req, res) => {
    const { id, file_id } = req.query;
    try {
        let query = 'SELECT * FROM regression_sheets';
        const params = [];
        if (id) {
            query += ' WHERE id = $1';
            params.push(id);
        } else if (file_id) {
            query += ' WHERE file_id = $1';
            params.push(file_id);
        }
        const { rows } = await pool.query(query, params);
        res.json(supabaseResponse(id ? rows[0] : rows));
    } catch (err) {
        res.status(500).json(supabaseResponse(null, { message: err.message }));
    }
});

app.post('/api/regression_sheets', async (req, res) => {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    try {
        const results = [];
        for (const item of items) {
            const { file_id, sheet_name, headers, data } = item;
            const { rows } = await pool.query(
                'INSERT INTO regression_sheets (file_id, sheet_name, headers, data) VALUES ($1, $2, $3, $4) RETURNING *',
                [file_id, sheet_name, headers, JSON.stringify(data)]
            );
            results.push(rows[0]);
        }
        res.json(supabaseResponse(Array.isArray(req.body) ? results : results[0]));
    } catch (err) {
        res.status(500).json(supabaseResponse(null, { message: err.message }));
    }
});

app.patch('/api/regression_sheets', async (req, res) => {
    const { id } = req.query;
    const { data } = req.body;
    try {
        const { rows } = await pool.query(
            'UPDATE regression_sheets SET data = $1 WHERE id = $2 RETURNING *',
            [JSON.stringify(data), id]
        );
        res.json(supabaseResponse(rows[0]));
    } catch (err) {
        res.status(500).json(supabaseResponse(null, { message: err.message }));
    }
});

// Sheet Comments
app.get('/api/sheet_comments', async (req, res) => {
    const { sheet_id } = req.query;
    try {
        const { rows } = await pool.query('SELECT * FROM sheet_comments WHERE sheet_id = $1 ORDER BY created_at ASC', [sheet_id]);
        res.json(supabaseResponse(rows));
    } catch (err) {
        res.status(500).json(supabaseResponse(null, { message: err.message }));
    }
});

app.post('/api/sheet_comments', async (req, res) => {
    const { sheet_id, author, comment, row_index } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO sheet_comments (sheet_id, author, comment, row_index) VALUES ($1, $2, $3, $4) RETURNING *',
            [sheet_id, author, comment, row_index]
        );
        res.json(supabaseResponse(rows[0]));
    } catch (err) {
        res.status(500).json(supabaseResponse(null, { message: err.message }));
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
