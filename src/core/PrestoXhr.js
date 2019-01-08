export default class PrestoXhr {
  constructor(options) {
    this.options = options;
    this.xhr = new XMLHttpRequest();
    this.xhr.withCredentials = options.withCredentials;
    this.formData = new FormData();
  }

  sendChunk(chunkData) {
    this.xhr.open('POST', this.options.url, true);
    this._setHeaders(chunkData);
    this._setFormData(chunkData);
    return new Promise((resolve, reject) => {
      this.xhr.onload = () => {
        if (this.xhr.status < 400) {
          resolve();
        } else {
          reject(chunkData.chunkIndex, this.xhr.status, this.xhr.statusText);
        }
      };
      this.xhr.onerror = error => {
        reject(chunkData.chunkIndex, this.xhr.status, this.xhr.statusText);
      };
      this.xhr.send(this.formData);
    });
  }

  _setFormData(chunkData) {
    let setMethod = 'set';
    if (this.formData.set === undefined) {
      //Safari and Edge don't have 'set' method.
      //See https://developer.mozilla.org/ja/docs/Web/API/FormData#Browser_compatibility
      this.formData = new FormData();
      setMethod = 'append';
    }
    this.formData[setMethod]('prestoId', chunkData.prestoId);
    this.formData[setMethod]('prestoChunkIndex', chunkData.chunkIndex);
    this.formData[setMethod]('chunk', chunkData.blob);
    this.formData[setMethod]('totalChunkNumber', chunkData.totalChunkNumber);
    this.formData[setMethod]('name', chunkData.name);
    this.formData[setMethod]('size', chunkData.size);
    Object.keys(chunkData.data).forEach(key => {
      this.formData[setMethod](key, chunkData.data[key]);
    });
  }

  _setHeaders() {
    const headers = this.options.httpHeaders();
    Object.keys(headers).forEach(key => {
      this.xhr.setRequestHeader(key, headers[key]);
    });
  }
}
