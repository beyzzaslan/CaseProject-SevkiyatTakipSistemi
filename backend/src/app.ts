import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { getDatabasePool } from './database/connection.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { shipmentRouter } from "./modules/shipments/shipment.routes.js";
export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/api/auth', authRouter);
app.use("/api/shipments", shipmentRouter);

app.get('/api/health', (_request, response) => {
  response.status(200).json({
    status: 'ok',
    service: 'factory-queue-api',
    timestamp: new Date().toISOString(),
  });
});
app.get('/api/health/database', async (_request, response) => {
  try {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .query<{ databaseName: string }>(
        'SELECT DB_NAME() AS databaseName',
      );

    response.status(200).json({
      status: 'ok',
      database: result.recordset[0]?.databaseName,
    });
  } catch (error) {
    console.error('Database connection failed:', error);

    response.status(503).json({
      status: 'error',
      database: 'unavailable',
    });
  }
});