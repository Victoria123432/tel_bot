require('dotenv').config();
const express      = require('express');
const fs           = require('fs');
const path         = require('path');
const config       = require('./config');
const { winstonLogger, morganMiddleware } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const weatherRouter  = require('./routes/weather');
const currencyRouter = require('./routes/currency');
const newsRouter     = require('./routes/news');

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(express.json());
app.use(morganMiddleware);

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Info REST API is running',
    endpoints: {
      weather:  'GET /weather?city=<city>&units=metric&lang=en',
      currency: 'GET /currency?base=USD&symbols=EUR,UAH,GBP',
      news:     'GET /news?q=<keyword>&lang=en&country=ua&max=10',
    },
  });
});

app.use('/weather',  weatherRouter);
app.use('/currency', currencyRouter);
app.use('/news',     newsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { status: 404, message: `Route ${req.method} ${req.path} not found.` },
  });
});

// Centralised error handler (must be last)
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  winstonLogger.info(`Server started on http://localhost:${config.port}`);
  winstonLogger.info('Available routes: GET /weather  GET /currency  GET /news');
});
