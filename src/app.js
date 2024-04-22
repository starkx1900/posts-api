import express from 'express';
import authRoute from './routes/auth.route.js';
import postRoute from './routes/posts.route.js';
import morgan from 'morgan';

const app = express();
app.use(express.json());
app.use(morgan('combined'));

// Routes
app.use('/auth', authRoute);
app.use('/posts', postRoute);

// catch all route
app.all('*', (req, res) => {
  res.status(404);
  res.json({
    message: 'Not found',
  });
});

export default app;
