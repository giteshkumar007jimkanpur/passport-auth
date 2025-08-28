import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import { isProd } from './env.config.js';

/** ignore query fields that is not in schema */
mongoose.set('strictQuery', true);

const connectDB = async (mongoUri) => {
  try {
    await mongoose.connect(mongoUri, {
      autoIndex: !isProd /** Build index automatically only on development */,
      maxPoolSize: 10 /** Max 10 concurrent connections in pool */,
      retryWrites: true /** Improve reliability by retrying safe writes automatically */,
      serverSelectionTimeoutMS: 10000 /** Don't wait forever to connect -> kill after 10sec */,
      socketTimeoutMS: 45000 /** Don't let queries hang forever */,
    });
    logger.info(`✅ MongoDB Connected`);
  } catch (error) {
    logger.error('❌ MongoDB connection error', error);
    throw error;
  }

  mongoose.connection.on('disconnected', () =>
    logger.warn('MongoDB Disconnected'),
  );
  mongoose.connection.on('reconnected', () =>
    logger.warn('MongoDB Reconnected'),
  );
};

export default connectDB;
