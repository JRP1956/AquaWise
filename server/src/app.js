import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';

import authRoutes from './routes/auth.routes.js';
import societyRoutes from './routes/societies.routes.js';
import complaintRoutes from './routes/complaints.routes.js';
import toolRoutes from './routes/tools.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';

export function createApp({ mongoUri, sessionSecret, clientOrigin, isProduction }) {
  const app = express();

  // Render/Heroku put the app behind a proxy; without this the secure cookie never sets.
  if (isProduction) app.set('trust proxy', 1);

  app.use(helmet());                                          // NFR-S6
  app.use(cors({ origin: clientOrigin, credentials: true }));  // NFR-S6
  app.use(express.json({ limit: '100kb' }));
  app.use(mongoSanitize());                                    // NFR-S7

  app.use(session({                                            // NFR-S2
    name: 'aquawise.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongoUri, collectionName: 'sessions', ttl: 2 * 60 * 60 }),
    cookie: {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 2 * 60 * 60 * 1000,
    },
  }));

  app.get('/api/health', (req, res) => res.json({ ok: true, service: 'aquawise-api' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/societies', societyRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api', toolRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
