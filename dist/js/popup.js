window.onload = function() {
  console.log(logFmt('Inspecting the extension popup console'))

  document.getElementById('openReloadLink').onclick = function(e) {
    console.log(logFmt('Triggered manual refresh'));
    var promise = new Promise(tunedUpdateAESR);

    promise
      .then(finalPromiseSuccess)
      .catch(finalPromiseFail);
  }
}
