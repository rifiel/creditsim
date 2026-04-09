function removeSignalHandlers(app) {
  process.removeListener('SIGINT', app.handleSigint);
  process.removeListener('SIGTERM', app.handleSigterm);
}

describe('App module edge cases', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.NODE_ENV;
  });

  test('root route sends the main HTML file', () => {
    const app = require('../src/app');
    const sendFile = jest.fn();

    app.rootHandler({}, { sendFile });

    expect(sendFile).toHaveBeenCalledWith(expect.stringMatching(/public\/index\.html$/));
    removeSignalHandlers(app);
  });

  test('global error handler hides internal details outside development', () => {
    const app = require('../src/app');
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();

    app.errorHandler(new Error('sensitive details'), {}, { status, json }, jest.fn());

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: 'Something went wrong!',
      message: 'Internal server error'
    });
    removeSignalHandlers(app);
  });

  test('global error handler returns the real error message in development', () => {
    process.env.NODE_ENV = 'development';
    const app = require('../src/app');
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();

    app.errorHandler(new Error('visible details'), {}, { status, json }, jest.fn());

    expect(json).toHaveBeenCalledWith({
      error: 'Something went wrong!',
      message: 'visible details'
    });
    removeSignalHandlers(app);
  });

  test('startServer initializes the database and starts listening', async () => {
    jest.resetModules();

    const initializeDatabase = jest.fn().mockResolvedValue(undefined);
    jest.doMock('../src/database/database', () => ({ initializeDatabase }));

    const app = require('../src/app');
    const listenSpy = jest.spyOn(app, 'listen').mockImplementation((port, callback) => {
      callback();
      return {};
    });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await app.startServer();

    expect(initializeDatabase).toHaveBeenCalledTimes(1);
    expect(listenSpy).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(consoleSpy).toHaveBeenCalledWith('Database initialized successfully');

    removeSignalHandlers(app);
  });

  test('startServer exits the process when initialization fails', async () => {
    jest.resetModules();

    const initializeDatabase = jest.fn().mockRejectedValue(new Error('boot failed'));
    jest.doMock('../src/database/database', () => ({ initializeDatabase }));

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const app = require('../src/app');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await app.startServer();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to start server:', expect.any(Error));
    expect(exitSpy).toHaveBeenCalledWith(1);

    removeSignalHandlers(app);
  });

  test('SIGINT handler exits the process cleanly', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const app = require('../src/app');

    app.handleSigint();

    expect(consoleSpy).toHaveBeenCalledWith('\nReceived SIGINT. Graceful shutdown...');
    expect(exitSpy).toHaveBeenCalledWith(0);
    removeSignalHandlers(app);
  });

  test('SIGTERM handler exits the process cleanly', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const app = require('../src/app');

    app.handleSigterm();

    expect(consoleSpy).toHaveBeenCalledWith('\nReceived SIGTERM. Graceful shutdown...');
    expect(exitSpy).toHaveBeenCalledWith(0);
    removeSignalHandlers(app);
  });
});
