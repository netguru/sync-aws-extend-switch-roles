//  Example response from API:
//   {
//   "name": "example.txt",
//   "path": "example.txt",
//   "sha": "e206172b0e2eb4334fa90a975f91c9bd9509d837",
//   "size": 294,
//   "url": "https://api.github.com/repos/<org>/<repo>/contents/example.txt?ref=master",
//   "html_url": "https://github.com/<org>/<repo>/blob/master/example.txt",
//   "git_url": "https://api.github.com/repos/<org>/<repo>/git/blobs/e206172b0e2eb4334fa90a975f91c9bd9509d837",
//   "download_url": "https://raw.githubusercontent.com/<org>/<repo>/master/example.txt?token=REDACTED",
//   "type": "file",
//   "content": "W3Byb2ZpbGUgd3d3XQpyb2xlX2FybiA9IGFybjphd3M6aWFtOjoxMjM0NTY3\nODkwMTI6cm9sZS9ibGFoCmNvbG9yID0gY29mZmVlCgpbdGVyZWZlcmVdCmF3\nc19hY2NvdW50X2lkID0gOTg3NjU0MzIxOTg4CnJvbGVfbmFtZSA9IGZpa3Vt\naWt1CgpbeWVhaF0KYXdzX2FjY291bnRfaWQgPSA5ODc2NTQzMjE5ODgKcm9s\nZV9uYW1lID0gYXRoaXJkcm9sZQppbWFnZSA9ICJodHRwczovL3ZpYS5wbGFj\nZWhvbGRlci5jb20vMTUwIgoKW3F3ZXJdCmF3c19hY2NvdW50X2lkID0gMTIz\nMTIzMTIzCnJvbGVfbmFtZSA9IGZhc2QK\n",
//   "encoding": "base64",
//   "_links": {
//     "self": "https://api.github.com/repos/<org>/<repo>/contents/example.txt?ref=master",
//     "git": "https://api.github.com/repos/<org>/<repo>/git/blobs/e206172b0e2eb4334fa90a975f91c9bd9509d837",
//     "html": "https://github.com/<org>/<repo>/blob/master/example.txt"
//   }
// }

function genUUID(){
  var dt = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (dt + Math.random()*16)%16 | 0;
    dt = Math.floor(dt/16);
    return (c=='x' ? r :(r&0x3|0x8)).toString(16);
  });
  return uuid;
}

function dateFmt() {
  var n = new Date();
  var dd = n.getDate();
  var mm = n.getMonth()+1; // starts with 0
  var yyyy = n.getFullYear();
  var hh = n.getHours();
  var mi = n.getMinutes();
  var ss = n.getSeconds();
  if(dd<10) { dd='0'+dd; }
  if(mm<10) { mm='0'+mm; }
  if(hh<10) { hh='0'+hh; }
  if(mi<10) { mi='0'+mi; }
  if(ss<10) { ss='0'+ss; }
  return yyyy+'-'+mm+'-'+dd+'T'+hh+':'+mi+':'+ss;
}

function logFmt(input) {
  return dateFmt() + ' ' + input;
}

function status(response) {
  if (response.status >= 200 && response.status < 300) {
    console.log(logFmt('Request response in range 200-299'))
    return Promise.resolve(response)
  } else {
    console.error(logFmt("Request response not in range 200-299"))
    return Promise.reject(new Error(response.statusText))
  }
}

function json(response) {
  console.log(logFmt('Return JSON from API'))
  return response.json()
}

function tunedUpdateAESR(resolve, reject) {
  chrome.storage.sync.get(['configUrl', 'ghToken', 'targetExtId', 'configFileShaSum'], function(data) {
    if (typeof data.configUrl === 'undefined' || data.configUrl === '') {
      console.error(logFmt('Rejecting due to `Configuration URL` not set'));
      reject('`Configuration URL` not set');
    } else {
      var configDataUrl = data.configUrl;

      if (typeof data.ghToken === 'undefined' || data.ghToken === '') {
        console.error(logFmt('Rejecting due to `Github Token` not set'));
        reject('`Github Token` not set');
      } else {
        var auth_header_value = 'token ' + data.ghToken;
        var request = new Request(configDataUrl, {
            headers: new Headers({
              'Content-Type': 'application/json',
              'Authorization': auth_header_value
            }),
          });

        if (typeof data.targetExtId === 'undefined' || data.targetExtId === '') {
          console.error(logFmt('Rejecting due to `Target Extension ID` not set'));
          reject('`Target Extension ID` not set');
        } else {
          var aesrExtensionId = data.targetExtId;

          if (typeof data.configFileShaSum === 'undefined' || data.configFileShaSum === '') {
            console.log(logFmt('The `configFileShaSum` is not set, not an error - perhaps initial stage'));
          }

          var configDataFileShaSum = data.configFileShaSum;
          fetch(request)
            .then(status)
            .then(json)
            .then(function(urlData){
              console.log(logFmt('File: ' + urlData.path));
              console.log(logFmt('Sha: ' + urlData.sha));
              console.log(logFmt('Type: ' + urlData.type));
              // console.log(logFmt('encoding: ' + urlData.encoding));
              // console.log(logFmt('content: ' + urlData.content)); // base64 encoded
              if (urlData.sha === configDataFileShaSum) {
                console.log(logFmt('Resolving as CONFIG_FILE_NOT_CHANGED'))
                resolve('CONFIG_FILE_NOT_CHANGED')
              } else {
                try {
                  // TODO: parse the decoded content prior to pushing to AESR
                  console.log(logFmt('Decoding base64 content'));
                  var content_decoded = window.atob(urlData.content);
                  // console.log(logFmt('; content(decoded)): \n\n' + content_decoded)
                } catch (e) {
                  console.error(logFmt('Base64 decode failed: ' + e))
                  reject('Base64 decode failed: ' + e)
                }

                //
                //
                // Send message to `AWS Extend Switch Roles` extension
                //
                //
                console.log(logFmt('Pushing content to AESR'));
                chrome.runtime.sendMessage(aesrExtensionId, {
                  action: 'updateConfig',
                  dataType: 'ini',
                  data: content_decoded
                }, function(response) {
                  if (response.result == 'success') {
                    console.log(logFmt('Successfully pushed config to AESR'))
                    console.log(logFmt('Setting configFileShaSum to: ' + urlData.sha))
                    chrome.storage.sync.set({ configFileShaSum: urlData.sha})
                    resolve('Successfully pushed config to AESR');
                  } else {
                    console.error(logFmt('Failed pushing config to AESR: `' + response.error.message + '`'))
                    reject(response.error.message);
                  }
                });
              }
            })
            .catch(function(error) {
              console.error(logFmt('Fetch failed: ' + error));
              reject('Fetch failed: ' + error);
            });
        }
      }
    }
  });
}

function finalPromiseSuccess(data) {
  console.log(logFmt('AESR Sync succeded'))
  console.log(logFmt('Got resolve msg: ' + data))
  var uuid = genUUID();
  if (data !== 'CONFIG_FILE_NOT_CHANGED') {
    var opt = {
      type: 'basic',
      title: 'AESR Sync succeded',
      message: 'Update in place',
      contextMessage: data,
      iconUrl: chrome.runtime.getURL('img/stefan_48x48.png')
    };
    chrome.notifications.create(uuid, opt, function(id) {});
  } else {
    console.log(logFmt('Skipping notification update'));
  }
  chrome.storage.sync.get(['debugMode'], function(d) {
    if (d.debugMode) {
      console.log(logFmt('debug mode enabled - will not close the window/console/popup automatically'))
    } else {
      // console.log(logFmt('console2:  + window.devtools.isOpen)) // <- doesn't work when console is undocked
      if (window) {
        window.close()
      }
    }
  });
}

function finalPromiseFail(data) {
  console.error(logFmt('AESR Sync failed'));
  console.error(logFmt('Got reject msg: ' + data));
  var uuid = genUUID();
  var opt = {
    type: 'basic',
    title: 'AESR Sync failed!',
    message: 'Check options and console',
    contextMessage: data,
    iconUrl: chrome.runtime.getURL('img/stefan_48x48.png')
  };
  chrome.notifications.create(uuid, opt, function(id) {});
}
