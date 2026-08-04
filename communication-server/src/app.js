import express from 'express';
import cors from 'cors';
import messageRoutes from './routes/messageRoute.js';
import conversationRoutes from './routes/conversationRoutes.js';
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/conversations', conversationRoutes);

app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => {
  res.send('Communication server is running');
});
export default app;