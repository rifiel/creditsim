const request = require('supertest');

function removeSignalHandlers(app) {
  process.removeListener('SIGINT', app.handleSigint);
  process.removeListener('SIGTERM', app.handleSigterm);
}

describe('App module edge cases', () => {
  let loadedApp;

  afterEach(() => {
    if (loadedApp) {
      removeSignalHandlers(loadedApp);
      loadedApp = null;
    }
    jest.restoreAllMocks();
    delete process.env.NODE_ENV;
  });

  test('root route serves the main HTML file', async () => {
    loadedApp = require('../src/app');

    const response = await request(loadedApp)
      .get('/')
      .expect(200);

    expect(response.headers['content-type']).toMatch(/text\/html/);
  });

  test('global error handler hides internal details outside development', () => {
    loadedApp = require('../src/app');
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();

    loadedApp.errorHandler(new Error('sensitive details'), {}, { status, json }, jest.fn());

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: 'Something went wrong!',
      message: 'Internal server error'
    });
  });

  test('global error handler returns the real error message in development', () => {
    process.env.NODE_ENV = 'development';
    loadedApp = require('../src/app');
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();

    loadedApp.errorHandler(new Error('visible details'), {}, { status, json }, jest.fn());

    expect(json).toHaveBeenCalledWith({
      error: 'Something went wrong!',
      message: 'visible details'
    });
  });

  test('startServer initializes the database and starts listening', async () => {
    jest.resetModules();

    const initializeDatabase = jest.fn().mockResolvedValue(undefined);
    jest.doMock('../src/database/database', () => ({ initializeDatabase }));

    loadedApp = require('../src/app');
    const listenSpy = jest.spyOn(loadedApp, 'listen').mockImplementation((port, callback) => {
      callback();
      return {};
    });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await loadedApp.startServer();

    expect(initializeDatabase).toHaveBeenCalledTimes(1);
    expect(listenSpy).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(consoleSpy).toHaveBeenCalledWith('Database initialized successfully');
  });

  test('startServer exits the process when initialization fails', async () => {
    jest.resetModules();

    const initializeDatabase = jest.fn().mockRejectedValue(new Error('boot failed'));
    jest.doMock('../src/database/database', () => ({ initializeDatabase }));

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    loadedApp = require('../src/app');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await loadedApp.startServer();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to start server:', expect.any(Error));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('SIGINT handler exits the process cleanly', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    loadedApp = require('../src/app');

    loadedApp.handleSigint();

    expect(consoleSpy).toHaveBeenCalledWith('\nReceived SIGINT. Graceful shutdown...');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('SIGTERM handler exits the process cleanly', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    loadedApp = require('../src/app');

    loadedApp.handleSigterm();

    expect(consoleSpy).toHaveBeenCalledWith('\nReceived SIGTERM. Graceful shutdown...');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});
