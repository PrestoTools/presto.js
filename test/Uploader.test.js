import Presto from '../src/Presto';
import Uploader from '../src/core/Uploader';

describe('Uploader initialize', () => {
  test('Generate Uploader instance', () => {
    const presto = new Presto({});
    const uploader = new Uploader(presto.options, presto.getNextChunk.bind(presto));
    expect(uploader).toBeInstanceOf(Uploader);
    expect(uploader.pool).toHaveLength(6);
  });
});

describe('Start / Stop', () => {
  const presto = new Presto({});
  const uploader = new Uploader(presto.options, presto.getNextChunk.bind(presto));
  test('start uploader', () => {
    uploader.start();
    expect(uploader.sending).toBeTruthy;
  });

  test('stop uploader', () => {
    uploader.stop();
    expect(uploader.sending).toBeFalsy;
  });
});
