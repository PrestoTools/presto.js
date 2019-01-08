import Presto from '../src/Presto';
import PrestoFile from '../src/core/PrestoFile';

describe('PrestoFile initialize', () => {
  const presto = new Presto();
  test('Generate PrestoFile instance', () => {
    const prestoFile = new PrestoFile({}, {}, presto.options);
    expect(prestoFile).toBeInstanceOf(PrestoFile);
  });
});

describe('PrestoFile event listener', () => {
  const presto = new Presto({});
  const prestoFile = new PrestoFile({}, {}, presto.options);
  const callback = jest.fn();

  test('Add event listener', () => {
    prestoFile.on('start', callback);
    prestoFile.send();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('Remove event listener', () => {
    prestoFile.on('start', callback);
    prestoFile.off('start', callback);
    prestoFile.send();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('Get file properties', () => {
  const presto = new Presto({});
  const dummyFileObject = {
    name: 'testFileName',
    size: 123456789
  };
  const prestoFile = new PrestoFile(dummyFileObject, {}, presto.options);
  test('Get file properties', () => {
    expect(prestoFile.name).toBe('testFileName');
    expect(prestoFile.size).toBe(123456789);
    expect(prestoFile.displaySize).toBe('117.7 MB');
    expect(prestoFile.totalChunkNumber).toBe(118);
  });
});

describe('Send / Abort file', () => {
  const presto = new Presto({});
  const dummyFileObject = {
    name: 'testFileName',
    size: 123456
  };
  const prestoFile = new PrestoFile(dummyFileObject, {}, presto.options);

  test('Send file', () => {
    const sendCallback = jest.fn();
    prestoFile.on('start', sendCallback);
    prestoFile.send();
    expect(prestoFile.status).toBe('ready');
    expect(sendCallback).toHaveBeenCalledWith(prestoFile);
  });

  test('Abort file', () => {
    const abortCallback = jest.fn();
    prestoFile.on('abort', abortCallback);
    prestoFile.status = 'waiting';
    prestoFile.abort();
    expect(prestoFile.status).not.toBe('pending');
    expect(abortCallback).toHaveBeenCalledTimes(0);
    prestoFile.status = 'ready';
    prestoFile.abort();
    expect(prestoFile.status).toBe('pending');
    expect(abortCallback).toHaveBeenCalledWith(prestoFile);
  });
});

describe('Get next chunk', () => {
  const presto = new Presto({});
  const dummyFileObject = {
    name: 'testFileName',
    size: 3500000,
    slice: () => {
      return new Blob();
    }
  };
  const prestoFile = new PrestoFile(dummyFileObject, { testParam: 'test_text' }, presto.options);

  test('Not in the queue', () => {
    expect(prestoFile.getNextChunk()).toBeNull();
  });

  test('Chunk number', () => {
    expect(prestoFile.totalChunkNumber).toBe(4);
  });

  test('Request first chunk', () => {
    prestoFile.send();
    const firstChunk = prestoFile.getNextChunk();
    prestoFile.chunkSuccess();
    expect(firstChunk).toHaveProperty('chunkIndex', 0);
  });

  test('Optional form data', () => {
    const chunk = prestoFile.getNextChunk();
    prestoFile.chunkSuccess();
    expect(chunk.data.testParam).toBe('test_text');
  });

  test('Request last chunk', () => {
    prestoFile.getNextChunk();
    prestoFile.chunkSuccess();
    const nextChunk = prestoFile.getNextChunk();
    expect(nextChunk).not.toBeNull();
    expect(prestoFile.status).toBe('closing');
  });

  test('Request after last chunk', () => {
    const nextChunk = prestoFile.getNextChunk();
    expect(nextChunk).toBeNull();
    expect(prestoFile.status).toBe('closing');
  });
});

describe('Chunk success', () => {
  const presto = new Presto({});
  const dummyFileObject = {
    name: 'testFileName',
    size: 2500000
  };
  const prestoFile = new PrestoFile(dummyFileObject, {}, presto.options);
  const callback = jest.fn();
  prestoFile.on('progress', callback);

  test('Success first chunk', () => {
    prestoFile.chunkSuccess();
    expect(prestoFile.successChunkCount).toBe(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('Success last chunk', () => {
    prestoFile.chunkSuccess();
    prestoFile.chunkSuccess();
    expect(callback).toHaveBeenCalledWith(1, prestoFile);
    expect(prestoFile.status).toBe('done');
  });
});

describe('Chunk error', () => {
  const presto = new Presto({});
  const dummyFileObject = {
    name: 'testFileName',
    size: 2500000,
    slice: () => {
      return new Blob();
    }
  };
  const prestoFile = new PrestoFile(dummyFileObject, {}, presto.options);
  const callback = jest.fn();
  prestoFile.on('error', callback);

  test('Error first chunk', () => {
    prestoFile.getNextChunk();
    prestoFile.chunkError(0, 500, 'Internal Server Error');
    expect(prestoFile.successChunkCount).toBe(0);
    expect(prestoFile.errorChunkIndexList).toEqual([0]);
    expect(callback).toHaveBeenCalledWith(0, 500, 'Internal Server Error', prestoFile);
  });

  test('Error last chunk', () => {
    prestoFile.getNextChunk();
    prestoFile.chunkSuccess();
    prestoFile.getNextChunk();
    prestoFile.chunkSuccess();
    prestoFile.getNextChunk();
    prestoFile.getNextChunk();
    expect(prestoFile.status).toBe('closing');
    prestoFile.chunkError(0, 500, 'Internal Server Error');
    expect(prestoFile.status).toBe('sending');
  });
});

describe('Slice blob', () => {
  const presto = new Presto({});
  const dummyFileObject = {
    name: 'testFileName',
    size: 2500000,
    slice: (start, stop) => {
      return stop > 2500000 ? 2500000 : stop;
    }
  };
  const prestoFile = new PrestoFile(dummyFileObject, {}, presto.options);
  test('Bigger than file size', () => {
    const blob = prestoFile._sliceBlob(5);
    expect(blob).toBeNull;
  });
  test('Last blob', () => {
    const blob = prestoFile._sliceBlob(2);
    expect(blob).toBe(2500000);
  });
});
