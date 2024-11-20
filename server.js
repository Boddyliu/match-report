const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

const app = express();
const port = process.env.PORT || 3000;

// 安全中间件
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "blob:", "*"],
            "script-src": ["'self'", "'unsafe-inline'"],
            "style-src": ["'self'", "'unsafe-inline'"],
            "connect-src": ["'self'", "data:", "blob:", "*"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
}));

// 中间件
app.use(cors());
app.use(express.json({
    limit: '50mb'
}));
app.use(express.urlencoded({
    limit: '50mb',
    extended: true
}));

// 静态文件服务
app.use(express.static('public'));

// API 路由
app.post('/api/save-image', async (req, res) => {
    try {
        const { imageData } = req.body;
        
        if (!imageData) {
            return res.status(400).json({
                success: false,
                message: 'No image data provided'
            });
        }

        // 在实际生产环境中，这里应该将图片保存到云存储服务
        // 现在我们直接返回图片数据
        res.json({
            success: true,
            imageUrl: imageData
        });
    } catch (error) {
        console.error('Error saving image:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving image'
        });
    }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 处理所有其他路由
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 仅在非 Vercel 环境下启动服务器
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

// 导出 app 以供 Vercel 使用
module.exports = app;
