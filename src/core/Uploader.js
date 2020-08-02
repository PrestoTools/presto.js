import PrestoXhr from './PrestoXhr';

export default class Uploader {
  constructor(options, getNextChunk) {
    this.options = options;
    this.getNextChunk = getNextChunk;
    this.pool = Array(options.simultaneous)
      .fill(null)
      .map((s) => {
        return new PrestoXhr(options);
      });
    this.sending = false;
  }

  start() {
    this.sending = true;
    this.startTime = Date.now();
    this.pool.forEach((prestoXhr) => {
      this._loop(prestoXhr);
    });
  }

  stop() {
    this.sending = false;
  }

  _loop(prestoXhr) {
    const chunkData = this.getNextChunk();
    if (chunkData === null) {
      setTimeout(() => {
        if (this.sending === true) {
          this._loop(prestoXhr);
        }
      }, 100);
      return;
    }
    prestoXhr.sendChunk(chunkData).then(
      (chunkIndex) => {
        chunkData.onSuccess();
        if (this.sending === true) {
          this._loop(prestoXhr);
        }
      },
      (chunkIndex, statusCode, statusText) => {
        chunkData.onError(chunkIndex, statusCode, statusText);
        if (this.sending === true) {
          this._loop(prestoXhr);
        }
      }
    );
  }
}
