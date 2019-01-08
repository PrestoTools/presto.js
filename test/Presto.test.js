import Presto from '../src/Presto';
import PrestoFile from '../src/core/PrestoFile';

describe('Presto initialize', () => {
  test('Generate Presto instance', () => {
    const presto = new Presto({});
    expect(presto).toBeInstanceOf(Presto);
  });
});

describe('Presto event listener', () => {
  const presto = new Presto({});
  const callback = jest.fn();

  test('Add event listener', () => {
    presto.on('reset', callback);
    presto.reset();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('Remove event listener', () => {
    presto.on('reset', callback);
    presto.off('reset', callback);
    presto.reset();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('Add / Remove / Reset files', () => {
  const presto = new Presto({});
  const dummyFileListObjct = [{ name: 'testFileName' }];
  const anotherFileListObjct = [{ name: 'anotherFileName' }];

  test('Add files', () => {
    presto.add(dummyFileListObjct, {});
    expect(presto.fileList).toHaveLength(1);
    expect(presto.fileList[0]).toBeInstanceOf(PrestoFile);
  });

  test('Remove files', () => {
    const prestoId = presto.fileList[0].prestoId;
    presto.remove(prestoId);
    expect(presto.fileList).toHaveLength(0);
    presto.add(dummyFileListObjct, {});
    presto.remove();
    expect(presto.fileList).toHaveLength(0);
  });

  test('Reset files', () => {
    presto.add(dummyFileListObjct, {});
    presto.reset();
    expect(presto.fileList).toHaveLength(0);
    presto.add(dummyFileListObjct, {});
    presto.reset(anotherFileListObjct, {});
    expect(presto.fileList).toHaveLength(1);
    expect(presto.fileList[0].name).toBe('anotherFileName');
  });
});

describe('Start / Abort', () => {
  const presto = new Presto({});
  const dummyFileObject = {
    size: 3500000,
    slice: () => {
      return new Blob();
    }
  };
  const prestoFile1 = new PrestoFile(dummyFileObject, {}, presto.options);
  const prestoFile2 = new PrestoFile(dummyFileObject, {}, presto.options);
  presto.fileList.push(prestoFile1, prestoFile2);
  beforeAll(() => {
    const _uploaderLoopSpy = jest.spyOn(presto.uploader, '_loop').mockImplementation();
  });
  afterAll(() => {
    _uploaderLoopSpy.mockRestore();
  });

  test('Start all', () => {
    presto.send();
    expect(prestoFile1.status).toBe('ready');
    expect(prestoFile2.status).toBe('ready');
    expect(presto.uploader.sending).toBeTruthy;
  });

  test('Abort all', () => {
    presto.abort();
    expect(presto.uploader.sending).toBeFalsy;
    prestoFile1.send();
    presto.abort(prestoFile1.prestoId);
    expect(prestoFile1.status).toBe('ready');
  });

  test('Start each', () => {
    prestoFile1.abort();
    prestoFile2.abort();
    presto.uploader.stop();
    presto.send(prestoFile1.prestoId);
    expect(prestoFile1.status).toBe('ready');
    expect(prestoFile2.status).toBe('pending');
    expect(presto.uploader.sending).toBeTruthy;
  });

  test('Abort each', () => {
    prestoFile1.send();
    prestoFile2.send();
    presto.uploader.start();
    presto.abort(prestoFile1.prestoId);
    expect(prestoFile1.status).toBe('pending');
    expect(prestoFile2.status).toBe('ready');
  });

  test('Try to send completed file', () => {
    prestoFile1.status = 'done';
    prestoFile2.abort();
    presto.uploader.stop();
    presto.send(prestoFile1.prestoId);
    expect(prestoFile1.status).toBe('done');
    expect(presto.uploader.sending).toBeFalsy;
  });
});

describe('Progress', () => {
  const presto = new Presto({});
  const prestoFile1 = new PrestoFile({ size: 3500000 }, {}, presto.options);
  const prestoFile2 = new PrestoFile({ size: 1500000 }, {}, presto.options);
  presto.fileList.push(prestoFile1, prestoFile2);
  test('No progress yet', () => {
    expect(presto.progress()).toBe(0);
  });
  test('Upload on going', () => {
    prestoFile1.chunkSuccess(); // 1/4
    prestoFile1.chunkSuccess(); // 2/4
    prestoFile2.chunkSuccess(); // 1/2
    expect(presto.progress()).toBe(0.5);
  });
});

describe('Get next chunk', () => {
  const presto = new Presto({});
  const prestoFile1 = new PrestoFile({ size: 3500000 }, {}, presto.options);
  const prestoFile2 = new PrestoFile({ size: 1500000 }, {}, presto.options);
  beforeAll(() => {
    const _file1SliceBlobSpy = jest.spyOn(prestoFile1, '_sliceBlob').mockImplementation();
    const _file2SliceBlobSpy = jest.spyOn(prestoFile2, '_sliceBlob').mockImplementation();
  });
  afterAll(() => {
    _file1SliceBlobSpy.mockRestore();
    _file2SliceBlobSpy.mockRestore();
  });
  presto.fileList.push(prestoFile1, prestoFile2);
  const callback = jest.fn();
  presto.on('complete', callback);
  test('No file in the queue', () => {
    const nextChunk = presto.getNextChunk();
    expect(nextChunk).toBeNull();
    expect(callback).toHaveBeenCalledTimes(1);
  });
  test('Get next chunk from file', () => {
    prestoFile1.send();
    const nextChunk = presto.getNextChunk();
    expect(nextChunk).not.toBeNull();
  });
  test('Get no chunk while aborting', () => {
    prestoFile1.abort();
    prestoFile2.abort();
    const nextChunk = presto.getNextChunk();
    expect(nextChunk).toBeNull();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('Listen file events', () => {
  const presto = new Presto({});
  const prestoFile = new PrestoFile({}, {}, presto.options);
  presto._setFileEvents(prestoFile);
  const fileProgressCallback = jest.fn();
  const progressCallback = jest.fn();
  const fileStartCallback = jest.fn();
  const fileAbortCallback = jest.fn();
  const fileCompleteCallback = jest.fn();
  const fileErrorCallback = jest.fn();
  presto.on('fileProgress', fileProgressCallback);
  presto.on('progress', progressCallback);
  presto.on('fileStart', fileStartCallback);
  presto.on('fileAbort', fileAbortCallback);
  presto.on('fileComplete', fileCompleteCallback);
  presto.on('fileError', fileErrorCallback);
  test('Listen events', () => {
    prestoFile.fire('progress', []);
    expect(fileProgressCallback).toHaveBeenCalledTimes(1);
    expect(progressCallback).toHaveBeenCalledTimes(1);
    prestoFile.fire('start', []);
    expect(fileStartCallback).toHaveBeenCalledTimes(1);
    prestoFile.fire('abort', []);
    expect(fileAbortCallback).toHaveBeenCalledTimes(1);
    prestoFile.fire('complete', []);
    expect(fileCompleteCallback).toHaveBeenCalledTimes(1);
    prestoFile.fire('error', []);
    expect(fileErrorCallback).toHaveBeenCalledTimes(1);
  });
});
