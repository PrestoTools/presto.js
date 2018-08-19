import EventDispatcher from '../src/core/EventDispatcher';

describe('Event dispatcher initialize', () => {
  test('Generate EventDispatcher instance', () => {
    const eventDispatcher = new EventDispatcher();
    expect(eventDispatcher).toBeInstanceOf(EventDispatcher);
  });
});

describe('Add listener', () => {
  test('Add listener', () => {
    const eventDispatcher = new EventDispatcher();
    const callback = jest.fn();
    eventDispatcher.addListener('testEvent', callback);
    expect(eventDispatcher.events).toHaveProperty('testEvent', [callback]);
  });
});

describe('Remove listener', () => {
  const eventDispatcher = new EventDispatcher();
  const callback1 = jest.fn();
  const callback2 = jest.fn();

  test('Remove all listeners', () => {
    eventDispatcher.addListener('testEvent', callback1);
    eventDispatcher.removeListener();
    expect(eventDispatcher.events).toEqual({});
  });

  test('Remove listener', () => {
    eventDispatcher.addListener('testEvent', callback1);
    eventDispatcher.removeListener('testEvent');
    expect(eventDispatcher.events).toHaveProperty('testEvent', [callback1]);

    eventDispatcher.removeListener('testEvent', callback1);
    expect(eventDispatcher.events).toHaveProperty('testEvent', []);

    eventDispatcher.events['testEvent'] = 'invalid string';
    eventDispatcher.removeListener('testEvent', callback1);
    expect(eventDispatcher.events).toHaveProperty('testEvent', []);
  });

  test('Remove 1 event out of 2', () => {
    eventDispatcher.addListener('testEvent', callback1);
    eventDispatcher.addListener('testEvent2', callback2);
    eventDispatcher.removeListener('testEvent', callback1);
    expect(eventDispatcher.events).toHaveProperty('testEvent2', [callback2]);
  });
});
