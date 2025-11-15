import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { routesRouter } from '../adapters/inbound/http/routes.js';
import { complianceRouter } from '../adapters/inbound/http/compliance.js';
import { bankingRouter } from '../adapters/inbound/http/banking.js';
import { poolsRouter } from '../adapters/inbound/http/pools.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/routes', routesRouter);
app.use('/compliance', complianceRouter);
app.use('/banking', bankingRouter);
app.use('/pools', poolsRouter);

// error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	console.error(err);
	res.status(400).json({ error: err?.message ?? 'Unknown error' });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
	console.log(`Server running on :${port}`);
});



