var gui = require('nw.gui');
var win = gui.Window.get();
win.setPosition('center');

win.showDevTools();

var current_version = 001;
var version;
var version_checked = false;
var version_data_downloaded = false;
var online;
var connection_tested = false;

var download_info;

var fs = require('fs'),
    path = require('path'),
    https = require('https'),
    sys = require('util'),
    exec = require('child_process').exec;

// Output console to html
(function() {
  var old = console.log;
  console.log = function(message) {
    if (typeof message == 'object') {
      document.getElementById('log').innerHTML += (JSON && JSON.stringify ? JSON.stringify(message) : message) + '<br />';
    } else {
      document.getElementById('log').innerHTML += message + '<br />';
    }
  }
})();

// Inject mod script
var execPath = path.dirname( process.execPath );

var mod_dir = path.join(execPath, 'mods'),
    mod_dir_ls = fs.readdirSync(mod_dir);
    
fs.createReadStream(mod_dir + '/mods.js').pipe(fs.createWriteStream(main_dir + 'mods.js'));

var main_dir_index = global.module.filename,
    main_dir = main_dir_index.replace('/load.html', '/');

// See if client is connected to the internet
function checkConnection() {
  var xhr = new XMLHttpRequest();
  var file = 'https://raw.githubusercontent.com/DoubloonDevs/snoop-slayer-source/master/src/download.DATA';
  var randomNum = Math.round(Math.random() * 10000);
 
  xhr.open('HEAD', file + "?rand=" + randomNum, true);
  xhr.send();
   
  xhr.addEventListener("readystatechange", processRequest, false);
 
  function processRequest(e) {
    if (xhr.readyState == 4) {
      if (xhr.status >= 200 && xhr.status < 304) {
        online = true;
        connection_tested = true;
        console.log('online!');
        self.location = 'index.html';
        //download_data('https://raw.githubusercontent.com/DoubloonDevs/snoop-slayer-source/master/src/download.DATA', main_dir + 'download.DATA');
      } else {
        online = false;
        console.log('offline :(');
        self.location = 'index.html'; // Start game if offline
      }
    }
  }
}
checkConnection();

var download_data = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = https.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, calls cb after close completes.
      version_data_downloaded = true;
      version = fs.readFileSync('download.DATA', 'utf8');
      console.log('Download Complete : ' + url);
      if (version == current_version) self.location = 'index.html'; // Start game if up to date
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};

var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = https.get(url, function(response) {
    response.pipe(file);
    var len = parseInt(response.headers['content-length'] || response.headers['x-goog-stored-content-length'], 10);
    var total = len / 1048576;
    var cur = 0;
    console.log('Downloading & Updating : ' + url);
     response.on("data", function(chunk) {
        cur += chunk.length;
        download_info = "Downloading " + (100.0 * cur / len).toFixed(2) + "% " + (cur / 1048576).toFixed(2) + " mb\r" + " Total size: " + total.toFixed(2) + " mb";
        //console.log(download_info);
        document.getElementById('downloader').innerHTML = download_info;
    });
    file.on('finish', function() {
      file.close(cb);
      console.log('Download Complete : ' + url);
      console.log('Please exit and run update.exe in ' + dest);
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file 
    if (cb) cb(err.message);
  });
};

function loop() {
  if (online && connection_tested) {
    if (version_data_downloaded) {
      if (version != current_version) {
        download('https://raw.githubusercontent.com/DoubloonDevs/snoop-slayer-source/master/src/update.exe', execPath + '\\update.exe');
        current_version = version;
      }
    }
  }
}
setInterval(loop, 0);

document.onkeydown = keyPressed;
function keyPressed(e) {
  e = e || window.event;
}
document.onkeyup = keyReleased;
function keyReleased(e) {
  e = e || window.event;
  if (e.keyCode == 223) win.showDevTools();
}