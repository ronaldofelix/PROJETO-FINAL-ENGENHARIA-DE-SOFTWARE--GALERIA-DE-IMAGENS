const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;

// Configurar CORS
app.use(cors());
app.use(express.json());

// Configurar o Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        // Criar pasta uploads se não existir
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Gerar nome único para o arquivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro para aceitar apenas imagens
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
        fileSize: 5 * 1024 * 1024 // limite de 5MB
    }
});

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static('uploads'));

// Rota para upload de imagens
app.post('/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        // Retorna o caminho do arquivo salvo
        res.json({
            message: 'Upload realizado com sucesso',
            filePath: `/uploads/${req.file.filename}`
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
    }
});

// Rota para listar todas as imagens
app.get('/images', (req, res) => {
    const uploadDir = 'uploads';

    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao listar arquivos' });
        }

        const images = files.map(file => ({
            name: file,
            path: `/uploads/${file}`
        }));

        res.json(images);
    });
});

// Rota para deletar uma imagem
app.delete('/images/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, 'uploads', filename);

    fs.unlink(filepath, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao deletar arquivo' });
        }
        res.json({ message: 'Arquivo deletado com sucesso' });
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});