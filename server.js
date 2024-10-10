const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

// Inicializa o Firebase Admin SDK usando variáveis de ambiente
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const bucket = admin.storage().bucket();

const app = express();
const port = 3000;

// Resto do seu código permanece igual
app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não suportado!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const file = bucket.file(req.file.originalname);
        const [uploadResponse] = await file.save(req.file.buffer);

        res.json({
            message: 'Upload realizado com sucesso',
            filePath: uploadResponse[0].publicUrl
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
    }
});

app.get('/images', async (req, res) => {
    try {
        const [files] = await bucket.getFiles();
        const images = files.map(file => ({
            name: file.name,
            path: file.publicUrl
        }));
        res.json(images);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar arquivos' });
    }
});

app.delete('/images/:filename', async (req, res) => {
    const filename = req.params.filename;
    const file = bucket.file(filename);

    try {
        await file.delete();
        res.json({ message: 'Arquivo deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar arquivo' });
    }
});

app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});