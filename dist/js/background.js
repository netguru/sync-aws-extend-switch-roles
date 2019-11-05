if (document.body) syncAutoTrigger(true);

function syncAutoTrigger(b) {
  var timeout = 1000*60*15;

  console.log(logFmt('Inspecting the <background> console'))
  if(b) {
    console.log(logFmt('Triggered auto-refresh'));
    var promise = new Promise(tunedUpdateAESR);

    promise
      .then(finalPromiseSuccess)
      .catch(finalPromiseFail);

    setTimeout(timeoutLoop, timeout);
  } else {
    setTimeout(timeoutLoop, timeout);
  }

}

function timeoutLoop() {
  chrome.storage.sync.get(['autoRefresh'], function(data) {
    console.log(logFmt('autoRefresh: '+data.autoRefresh))
    if (data.autoRefresh) {
      syncAutoTrigger(true);
    } else {
      syncAutoTrigger(false);
    }
  })
}
