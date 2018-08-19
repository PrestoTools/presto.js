import { genUUIDv4 } from './utils';

export const defaultOptions = {
  element: null,
  chunkSize: 1 * 1024 * 1024, //1MB
  simultaneous: 6,
  url: '',
  httpHeaders: () => {
    return {};
  },
  uniqueIdGenerator: fileObject => {
    return `presto_${genUUIDv4()}`;
  },
  withCredentials: false
};
