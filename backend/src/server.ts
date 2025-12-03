import app from './app';
import connectDB from './config/database';
import config from './config';

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDB();

    // Start server
    app.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 MyRush API Server                                ║
║                                                       ║
║   Environment: ${config.nodeEnv.padEnd(38)}║
║   Port: ${config.port.toString().padEnd(46)}║
║   API: ${(config.apiPrefix + '/' + config.apiVersion).padEnd(47)}║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  console.error('❌ Unhandled Rejection:', reason.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

startServer();

