function getRouteLayer(app, path) {
  return app._router.stack.find((layer) => layer.route && layer.route.path === path);
}

function getErrorHandler(app) {
  return app._router.stack.find((layer) => layer.handle.length === 4);
}

describe('App module edge cases', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.NODE_ENV;
  });

  test('root route sends the main HTML file', () => {
    const app = require('../src/app');
    const routeLayer = getRouteLayer(app, '/');
    const sendFile = jest.fn();

    routeLayer.route.stack[0].handle({}, { sendFile });

    expect(sendFile).toHaveBeenCalledWith(expect.stringMatching(/public\/index\.html$/));
  });

  test('global error handler hides internal details outside development', () => {
    const app = require('../src/app');
    const errorLayer = getErrorHandler(app);
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();

    errorLayer.handle(new Error('sensitive details'), {}, { status, json }, jest.fn());

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: 'Something went wrong!',
      message: 'Internal server error'
    });
  });

  test('global error handler returns the real error message in development', () => {
    process.env.NODE_ENV = 'development';
    const app = require('../src/app');
    const errorLayer = getErrorHandler(app);
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();

    errorLayer.handle(new Error('visible details'), {}, { status, json }, jest.fn());

    expect(json).toHaveBeenCalledWith({
      error: 'Something went wrong!',
      message: 'visible details'
    });
  });

  test('SIGINT handler exits the process cleanly', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const baselineListeners = process.listeners('SIGINT');

    jest.isolateModules(() => {
      require('../src/app');
    });

    const sigintHandler = process.listeners('SIGINT').find((listener) => !baselineListeners.includes(listener));
    sigintHandler();

    expect(consoleSpy).toHaveBeenCalledWith('\nReceived SIGINT. Graceful shutdown...');
    expect(exitSpy).toHaveBeenCalledWith(0);

    process.removeListener('SIGINT', sigintHandler);
  });

  test('SIGTERM handler exits the process cleanly', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const baselineListeners = process.listeners('SIGTERM');

    jest.isolateModules(() => {
      require('../src/app');
    });

    const sigtermHandler = process.listeners('SIGTERM').find((listener) => !baselineListeners.includes(listener));
    sigtermHandler();

    expect(consoleSpy).toHaveBeenCalledWith('\nReceived SIGTERM. Graceful shutdown...');
    expect(exitSpy).toHaveBeenCalledWith(0);

    process.removeListener('SIGTERM', sigtermHandler);
  });
});
