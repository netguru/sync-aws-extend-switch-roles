function elById(id) {
  return document.getElementById(id);
}

window.onload = function() {
  console.log(logFmt('Inspecting the options window console'))

  elById('configUrlText').onchange = function() {
    var rawStrConfigUrl = this.value;
    var expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
    var regex = new RegExp(expression)
    if (rawStrConfigUrl.match(regex)) {
      console.log(logFmt('url does match regex: '+rawStrConfigUrl))
      msgSpan.innerHTML = '<span style="color:#11dd18">ALL OK</span> - url: <b>'+rawStrConfigUrl+'</b> does match regex.';
    } else {
      console.log(logFmt('url: '+rawStrConfigUrl+' does not match regex'))
      msgSpan.innerHTML = '<span style="color:#dd1111">ERROR</span> - url: <b>'+rawStrConfigUrl+'</b> does <span style="color:#dd1111">NOT</span> match regex!';
      return
    }

    try {
      chrome.storage.sync.set({ configUrl: rawStrConfigUrl },
        function() {
          const { lastError } = chrome.runtime;
          if (lastError) {
            msgSpan.innerHTML = Sanitizer.escapeHTML`${lastError.message}`;
            return;
          }
        });
    } catch (e) {
      msgSpan.innerHTML = 'Failed to save because of invalid format!';
    }
  }

  elById('ghTokenText').onchange = function() {
    console.log(logFmt('setting: ' + 'ghToken' + ' as ' + this.value))
    chrome.storage.sync.set({ ghToken: this.value });
  }

  elById('targetExtIdText').onchange = function() {
    console.log(logFmt('setting: ' + 'targetExtId' + ' as ' + this.value))
    chrome.storage.sync.set({ targetExtId: this.value });
  }

  elById('autoRefreshCheckBox').onchange = function() {
    console.log(logFmt('setting: ' + 'autoRefresh' + ' as ' + this.checked))
    chrome.storage.sync.set({ autoRefresh: this.checked });
  }

  elById('debugModeCheckBox').onchange = function() {
    console.log(logFmt('setting: ' + 'debugMode' + ' as ' + this.checked))
    chrome.storage.sync.set({ debugMode: this.checked });
  }

  chrome.storage.sync.get(['configUrl', 'ghToken', 'targetExtId', 'autoRefresh', 'debugMode'], function(data) {
    elById('configUrlText').value = data.configUrl || '';
    elById('ghTokenText').value = data.ghToken || '';
    elById('targetExtIdText').value = data.targetExtId || '';
    elById('autoRefreshCheckBox').checked = data.autoRefresh || false;
    elById('debugModeCheckBox').checked = data.debugMode || false;
  });
}
