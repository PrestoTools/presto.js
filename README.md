# presto.js

## Overview
presto.js is a small JavaScript library for file upload.  
Main features are:
- Faster than normal file uploading - by splitting files into small chunks and uploading them simultaneously.  
- Work well for lots of huge size files.

## Supported browsers
- Chrome (desktop & mobile)
- Firefox
- Microsoft Edge 16+ (Some examples works with 17+)
- Safari 11+ (desktop & mobile)

## Getting started
### Minimal implementation
```html
<form class="uploadForm">
  <input type="file" multiple />
  <input type="submit" value="Upload" />
</form>
```
```javascript
const formEl = document.querySelector('.uploadForm');
new Presto({ element: formEl, url: 'DESTINATION_URL' });
```

## Examples
- [Minimal](https://github.com/PrestoTools/presto.js/tree/master/example/minimal)
- [Progress bar UI](https://github.com/PrestoTools/presto.js/tree/master/example/progress-bar)
- Angular (TBD)
- React (TBD)
- Vue.js (TBD)

Server side examples:
- [PHP](https://github.com/PrestoTools/presto.js/tree/master/example/server-php)
- [Ruby](https://github.com/PrestoTools/presto.js/tree/master/example/server-ruby)
- [Node.js](https://github.com/PrestoTools/presto.js/tree/master/example/server-node)

## Documentation

### Configuration
```javascript
const presto = new Presto({ url: '/api/upload', ... });
```
#### Configuration options
- ```url```: [string] URL of upload destination. (Default: ```''```)
- ```chunkSize```: [integer] Size (byte) of each chunk (Default: ```1048576 //1MB```)
- ```simultaneous```: [integer] Number of chunks to send abreast. 6 is recommended for HTTP/1.1 and 10 is recommended for HTTP/2.  (Default: ```6```)
- ```element```: [HTMLFormElement] If specified, the upload will start automatically when the form is submitted. The element must have a HTMLFormInput[type="file"] as a child. (Default: ```null```)
- ```uniqueIdGenerator```: [function] A custom function that defines a unique ID for each file. The ID is sent with each chunk. (Default: ```fileObject => {return `presto_${UUID_V4_STRING}`; }```)
- ```httpHeaders```: [function] A custom function to add HTTP headers to each chunk send request. (Default: ```PrestoFile => {return {}; }```)
- ```withCredentials```: [boolean] This value is used as the withCredentials option of the chunk send request(XMLHttpRequest). Set ```true``` to send cookies with cross domain request. (Default: ```false```)

### Properties
- ```Presto.fileList```: [array] Array of PrestoFile.
- ```PrestoFile.prestoId```: [string] Unique ID of PrestoFile.
- ```PrestoFile.name```: [string] File name.
- ```PrestoFile.size```: [integer] File size (byte).
- ```PrestoFile.displaySize```: [string] Human readable file size.

### Methods
- ```Presto.on(string eventName, function callback)```: Add event listener to Presto.
- ```Presto.off(string eventName, function callback)```: Remove event listener from Presto.
- ```Presto.add(HTML5 FileList object)```: Add file(s) to Presto.
- ```Presto.remove(string prestoId)```: Remove file from Presto. If nothing is specified, remove all files.
- ```Presto.reset(HTML5 FileList object)```: Replace ```Presto.fileList``` with specified file list. If nothing is specified, remove all files.
- ```Presto.send(string prestoId)```: Start file upload of the specified file. If nothing is specified, upload all files.
- ```Presto.abort(string prestoId)```: Abort file upload of the specified file. If nothing is specified, abort all files.
- ```Presto.progress(string prestoId)```: Return upload progress (float number between 0 - 1) of the specified file. If nothing is specified, return progress for all files.

### Events
```Presto``` offers the following events:
- ```added```: Fires when file is added. Returns array of ```PrestoFile```.
- ```removed```: Fires when file(s) is removed. Returns array of removed file ID.
- ```reset```: Fires when ```Presto.fileList``` is reset.
- ```start```: Fires when uploading is started.
- ```abort```: Fires when uploading is aborted.
- ```complete```: Fires when uploading is completed. Returns duration of uploading(msec).
- ```progress```: Fires whenever chunk upload succeeds. Returns progress for all files(float number between 0 - 1).
- ```fileStart```: Fires whenever uploading of each file is started. Returns ```PrestoFile```.
- ```fileAbort```: Fires whenever uploading of each file is aborted. Returns ```PrestoFile```.
- ```fileComplete```: Fires whenever uploading of each file is completed. Returns ```PrestoFile```.
- ```fileProgress```: Fires whenever chunk upload succeeds. Returns ```fileProgress```(float number between 0 - 1), ```PrestoFile```.
- ```fileError```: Fires when chunk upload fails. Returns ```chunkIndex```, ```HTTP status code```, ```HTTP status text```, ```PrestoFile```.

```PrestoFile``` offers the following events:
- ```start```: Fires when upload started. Returns ```PrestoFile```.
- ```abort```: Fires when upload aborted. Returns ```PrestoFile```.
- ```complete```: Fires when upload completed. Returns ```PrestoFile```.
- ```progress```: Fires whenever chunk upload succeed. Returns ```fileProgress```(float number between 0 - 1), ```PrestoFile```.
- ```error```: Fires when chunk upload failed. Returns ```chunkIndex```, ```XMLHttpRequest.status```, ```XMLHttpRequest.statusText```, ```PrestoFile```.

## Acknowledgement
The idea of simultaneous upload came from [resumable.js](http://www.resumablejs.com/) and [flow.js](https://github.com/flowjs).

Presto project is spun off from the [jPOST project](https://jpostdb.org/).
