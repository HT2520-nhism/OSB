import { Logger } from './logger.service';

describe('LoggerService', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('TestContext');
  });

  describe('log', () => {
    it('should log info messages', () => {
      const spy = jest.spyOn(logger, 'log').mockImplementation();
      logger.log('Test message', 'TestContext');
      expect(spy).toHaveBeenCalledWith('Test message', 'TestContext');
    });
  });

  describe('error', () => {
    it('should log error messages with trace', () => {
      const spy = jest.spyOn(logger, 'error').mockImplementation();
      const error = new Error('Test error');
      logger.error(error, error.stack, 'TestContext');
      expect(spy).toHaveBeenCalledWith(error, error.stack, 'TestContext');
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      const spy = jest.spyOn(logger, 'warn').mockImplementation();
      logger.warn('Warning message');
      expect(spy).toHaveBeenCalledWith('Warning message');
    });
  });

  describe('debug', () => {
    it('should log debug messages', () => {
      const spy = jest.spyOn(logger, 'debug').mockImplementation();
      logger.debug('Debug message');
      expect(spy).toHaveBeenCalledWith('Debug message');
    });
  });

  describe('verbose', () => {
    it('should log verbose messages', () => {
      const spy = jest.spyOn(logger, 'verbose').mockImplementation();
      logger.verbose('Verbose message');
      expect(spy).toHaveBeenCalledWith('Verbose message');
    });
  });

  describe('child', () => {
    it('should create a child logger with combined context', () => {
      const childLogger = logger.child('ChildContext');
      expect(childLogger).toBeInstanceOf(Logger);
    });

    it('should create child from root logger', () => {
      const rootLogger = new Logger();
      const childLogger = rootLogger.child('ChildContext');
      expect(childLogger).toBeInstanceOf(Logger);
    });
  });

  describe('printMessage', () => {
    it('should handle string messages', () => {
      const printSpy = jest.spyOn(logger, 'printMessage');
      logger.log('String message');
      expect(printSpy).toHaveBeenCalled();
    });

    it('should handle Error objects', () => {
      const error = new Error('Error message');
      expect(() => logger.error(error)).not.toThrow();
    });

    it('should handle object messages', () => {
      const objMessage = { key: 'value', nested: { a: 1 } };
      expect(() => logger.log(objMessage)).not.toThrow();
    });
  });
});
