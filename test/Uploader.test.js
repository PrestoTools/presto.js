import Presto from '../src/Presto';
import Uploader from '../src/core/Uploader';
import PrestoXhr from '../src/core/PrestoXhr';

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

describe('Setup form data', () => {
  const presto = new Presto({
    httpHeaders: () => {
      return { 'X-Presto-Header': 'test_header' };
    }
  });
  const uploader = new Uploader(presto.options, presto.getNextChunk.bind(presto));
  const prestoXhr = uploader.pool[0];
  const spy = jest.fn();
  prestoXhr.xhr.setRequestHeader = spy;
  const dummyChunk = {
    prestoId: 'presto-xxxxx',
    chunkIndex: 0,
    blob: new Blob(),
    totalChunkNumber: 10,
    name: 'dummyFileName',
    size: 10000000,
    data: { optionalFormData: 'test_text' }
  };

  test('Initialize pool', () => {
    expect(prestoXhr).toBeInstanceOf(PrestoXhr);
  });

  test('Set HTTP header', () => {
    prestoXhr.xhr.open('POST', 'dummyUrl', true);
    prestoXhr._setHeaders();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('Set form data', () => {
    prestoXhr._setFormData(dummyChunk);
    expect(prestoXhr.formData.get('prestoId')).toBe('presto-xxxxx');
    expect(prestoXhr.formData.get('prestoChunkIndex')).toBe('0');
    expect(prestoXhr.formData.get('chunk')).toBeInstanceOf(Blob);
    expect(prestoXhr.formData.get('totalChunkNumber')).toBe('10');
    expect(prestoXhr.formData.get('name')).toBe('dummyFileName');
    expect(prestoXhr.formData.get('size')).toBe('10000000');
    expect(prestoXhr.formData.get('optionalFormData')).toBe('test_text');
  });
});
