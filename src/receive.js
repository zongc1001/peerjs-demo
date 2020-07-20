import peerjs from 'peerjs';
(function () {
  var lastPeerId = null
  var peer = null // Own peer object
  var peerId = null
  var conn = null
  var recvId = document.getElementById('receiver-id')
  var status = document.getElementById('status')
  var message = document.getElementById('message')
  var standbyBox = document.getElementById('standby')
  var goBox = document.getElementById('go')
  var fadeBox = document.getElementById('fade')
  var offBox = document.getElementById('off')
  var sendMessageBox = document.getElementById('sendMessageBox')
  var sendButton = document.getElementById('sendButton')
  var clearMsgsButton = document.getElementById('clearMsgsButton')
  var iceServers = null;

  function initializeIceServer() {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function ($evt) {
      if (xhr.readyState == 4 && xhr.status == 200) {
        let res = JSON.parse(xhr.responseText);
        console.log("response: ", res);
        iceServers = res.v.iceServers;
        console.log(iceServers);
        initialize();
      }
    }
    xhr.open("PUT", "https://global.xirsys.net/_turn/circle", true);
    xhr.setRequestHeader("Authorization", "Basic " + btoa("zongchen:ef651bc2-ca5c-11ea-a646-0242ac150003"));
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({ "format": "urls" }));
  }

  /**
   * Create the Peer object for our end of the connection.
   *
   * Sets up callbacks that handle any events related to our
   * peer object.
   */
  function initialize() {
    

    //连接阿里云服务器的, 配置了ssl
    peer = new Peer('testrec', {
      host: 'zongchen.xyz',
      port: 9000,
      path: '/',
      key: 'peerjs',
      secure: true,
      debug: 3,
      iceServers: [
        {
          urls: iceServers.urls, username: iceServers.username,
          credential: iceServers.credential
        },
        { url: 'stun:stun.turnservers.com:3478' },
        { url: 'stun:stun01.sipphone.com' },
        { url: 'stun:stun.ekiga.net' },
        { url: 'stun:stun.fwdnet.net' },
        { url: 'stun:stun.ideasip.com' },
        { url: 'stun:stun.iptel.org' },
        { url: 'stun:stun.rixtelecom.se' },
        { url: 'stun:stun.schlund.de' },
        { url: 'stun:stun.l.google.com:19302' },
        { url: 'stun:stun1.l.google.com:19302' },
        { url: 'stun:stun2.l.google.com:19302' },
        { url: 'stun:stun3.l.google.com:19302' },
        { url: 'stun:stun4.l.google.com:19302' },
        { url: 'stun:stunserver.org' },
        { url: 'stun:stun.softjoys.com' },
        { url: 'stun:stun.voiparound.com' },
        { url: 'stun:stun.voipbuster.com' },
        { url: 'stun:stun.voipstunt.com' },
        { url: 'stun:stun.voxgratia.org' },
        { url: 'stun:stun.xten.com' },
        { url: 'turn:homeo@turn.bistri.com:80', credential: 'homeo' },
        { url: 'stun:47.95.119.173:3478' },
        { url: 'turn:0.peerjs.com:3478' },
        {
          url: 'turn:47.95.119.173:3478',
          username: 'zongchen',
          credential: 'onmyown0.',
        },
        {
          url: 'turn:numb.viagenie.ca',
          credential: 'muazkh',
          username: 'webrtc@live.com'
        },
        {
          url: 'turn:192.158.29.39:3478?transport=udp',
          credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
          username: '28224511:1379330808'
        },
        {
          url: 'turn:192.158.29.39:3478?transport=tcp',
          credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
          username: '28224511:1379330808'
        }
      ],
    })


    peer.on('open', function (id) {
      // Workaround for peer.reconnect deleting previous id
      if (peer.id === null) {
        console.log('Received null id from peer open');
        peer.id = lastPeerId;
      } else {
        lastPeerId = peer.id;
      }

      console.log('ID: ' + peer.id);
      recvId.innerHTML = 'ID: ' + peer.id;
      status.innerHTML = 'Awaiting connection...';
    })
    peer.on('connection', function (c) {
      // Allow only a single connection
      if (conn && conn.open) {
        c.on('open', function () {
          c.send('Already connected to another client')
          setTimeout(function () {
            c.close()
          }, 500)
        })
        return
      }

      conn = c
      peerId = conn.peer;
      console.log('Connected to: ' + conn.peer)
      status.innerHTML = 'Connected'
      ready()
    })
    peer.on('disconnected', function () {
      status.innerHTML = 'Connection lost. Please reconnect'
      console.log('Connection lost. Please reconnect')

      // Workaround for peer.reconnect deleting previous id
      peer.id = lastPeerId
      peer._lastServerId = lastPeerId
      peer.reconnect()
    })
    peer.on('close', function () {
      conn = null
      status.innerHTML = 'Connection destroyed. Please refresh'
      console.log('Connection destroyed')
    })
    peer.on('error', function (err) {
      console.log(err)
      alert('' + err)
    })
  }

  /**
   * Triggered once a connection has been achieved.
   * Defines callbacks to handle incoming data and connection events.
   */
  function ready() {
    conn.on('data', function (data) {
      console.log('Data recieved: ' + data)
      var cueString = '<span class="cueMsg">Cue: </span>'
      switch (data) {
        case 'Go':
          go()
          addMessage(cueString + data)
          break
        case 'Fade':
          fade()
          addMessage(cueString + data)
          break
        case 'Off':
          off()
          addMessage(cueString + data)
          break
        case 'Reset':
          reset()
          addMessage(cueString + data)
          break
        default:
          addMessage('<span class="peerMsg">Peer: </span>' + data.action + " at " + data.curTime)
          break
      }
    })
    conn.on('close', function () {
      status.innerHTML = 'Connection reset<br>Awaiting connection...'
      conn = null
    })
  }

  function go() {
    standbyBox.className = 'display-box hidden'
    goBox.className = 'display-box go'
    fadeBox.className = 'display-box hidden'
    offBox.className = 'display-box hidden'
    return
  }

  function fade() {
    standbyBox.className = 'display-box hidden'
    goBox.className = 'display-box hidden'
    fadeBox.className = 'display-box fade'
    offBox.className = 'display-box hidden'
    return
  }

  function off() {
    standbyBox.className = 'display-box hidden'
    goBox.className = 'display-box hidden'
    fadeBox.className = 'display-box hidden'
    offBox.className = 'display-box off'
    return
  }

  function reset() {
    standbyBox.className = 'display-box standby'
    goBox.className = 'display-box hidden'
    fadeBox.className = 'display-box hidden'
    offBox.className = 'display-box hidden'
    return
  }

  function addMessage(msg) {
    var now = new Date()
    var h = now.getHours()
    var m = addZero(now.getMinutes())
    var s = addZero(now.getSeconds())

    if (h > 12) h -= 12
    else if (h === 0) h = 12

    function addZero(t) {
      if (t < 10) t = '0' + t
      return t
    }

    message.innerHTML =
      '<br><span class="msg-time">' +
      h +
      ':' +
      m +
      ':' +
      s +
      '</span>  -  ' +
      msg +
      message.innerHTML
  }

  function clearMessages() {
    message.innerHTML = ''
    addMessage('Msgs cleared')
  }

  // Listen for enter in message box
  sendMessageBox.addEventListener('keypress', function (e) {
    var event = e || window.event
    var char = event.which || event.keyCode
    if (char == '13') sendButton.click()
  })
  // Send message
  sendButton.addEventListener('click', function () {
    console.log(peer);
    if (conn && conn.open) {
      var msg = sendMessageBox.value
      sendMessageBox.value = ''
      conn.send({
        action: msg,
        curTime: 20
      })
      console.log('Sent: ' + msg)
      addMessage('<span class="selfMsg">Self: </span>' + msg)
    } else {
      conn = peer.connect(peerId, {
        reliable: true,
      })
      console.log('Connection is closed')
    }
  })

  // Clear messages box
  clearMsgsButton.addEventListener('click', clearMessages)

  initializeIceServer()
})()
