import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'pdf-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/v1/pdf/generate', async (req, res) => {
  // TODO: Implement PDF generation
  res.json({ success: true, message: 'PDF generation endpoint - coming soon' });
});

app.post('/api/v1/pdf/merge', async (req, res) => {
  // TODO: Implement PDF merging
  res.json({ success: true, message: 'PDF merge endpoint - coming soon' });
});

app.listen(PORT, () => {
  console.log(`PDF service running on port ${PORT}`);
});

export { app };
