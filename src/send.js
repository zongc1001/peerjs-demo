import peerjs from 'peerjs';
(function () {
  var lastPeerId = null
  var peer = null // own peer object
  var conn = null
  var recvIdInput = document.getElementById('receiver-id')
  var status = document.getElementById('status')
  var message = document.getElementById('message')
  var goButton = document.getElementById('goButton')
  var resetButton = document.getElementById('resetButton')
  var fadeButton = document.getElementById('fadeButton')
  var offButton = document.getElementById('offButton')
  var sendMessageBox = document.getElementById('sendMessageBox')
  var sendButton = document.getElementById('sendButton')
  var clearMsgsButton = document.getElementById('clearMsgsButton')
  var connectButton = document.getElementById('connect-button')
  var cueString = '<span class="cueMsg">Cue: </span>'

  /**
   * Create the Peer object for our end of the connection.
   *
   * Sets up callbacks that handle any events related to our
   * peer object.
   */
  function initialize() {
    // Create own peer object with connection to shared PeerJS server
    peer = new Peer('testsend', {
      host: 'zongchen.xyz',
      port: 9000,
      path: '/',
      key: 'peerjs',
      secure: true,
      debug: 3,
      iceServers: [
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
        { url: 'stun:47.95.119.173:3478' },
        {
          url: 'turn:47.95.119.173:3478',
          username: 'zongchen',
          credential: 'onmyown0.',
          credentialType: 'password',
        },
        {
          url: 'turn:47.95.119.173:3478?transport=tcp',
          username: 'zongchen:onmyown0.',
        },
        { url: 'turn:homeo@turn.bistri.com:80', credential: 'homeo' },
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
      ]
    })

    peer.on('open', function (id) {
      // Workaround for peer.reconnect deleting previous id
      if (peer.id === null) {
        console.log('Received null id from peer open')
        peer.id = lastPeerId
      } else {
        lastPeerId = peer.id
      }

      console.log('ID: ' + peer.id)
    })
    peer.on('connection', function (c) {
      // Disallow incoming connections
      c.on('open', function () {
        c.send('Sender does not accept incoming connections')
        setTimeout(function () {
          c.close()
        }, 500)
      })
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
   * Create the connection between the two Peers.
   *
   * Sets up callbacks that handle any events related to the
   * connection and data received on it.
   */
  function join() {
    // Close old connection
    if (conn) {
      conn.close()
    }

    // Create connection to destination peer specified in the input field
    conn = peer.connect(recvIdInput.value, {
      reliable: true
    })

    conn.on('open', function () {
      status.innerHTML = 'Connected to: ' + conn.peer
      console.log('Connected to: ' + conn.peer)

      // Check URL params for comamnds that should be sent immediately
      var command = getUrlParam('command')
      if (command) conn.send(command)
    })
    // Handle incoming data (messages only since this is the signal sender)
    conn.on('data', function (data) {
      addMessage('<span class="peerMsg">Peer:</span> ' + data)
    })
    conn.on('close', function () {
      status.innerHTML = 'Connection closed'
    })
  }

  /**
   * Get first "GET style" parameter from href.
   * This enables delivering an initial command upon page load.
   *
   * Would have been easier to use location.hash.
   */
  function getUrlParam(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]')
    var regexS = '[\\?&]' + name + '=([^&#]*)'
    var regex = new RegExp(regexS)
    var results = regex.exec(window.location.href)
    if (results == null) return null
    else return results[1]
  }

  /**
   * Send a signal via the peer connection and add it to the log.
   * This will only occur if the connection is still alive.
   */
  function signal(sigName) {
    if (conn && conn.open) {
      conn.send(sigName)
      console.log(sigName + ' signal sent')
      addMessage(cueString + sigName)
    } else {
      console.log('Connection is closed')
    }
  }

  goButton.addEventListener('click', function () {
    signal('Go')
  })
  resetButton.addEventListener('click', function () {
    signal('Reset')
  })
  fadeButton.addEventListener('click', function () {
    signal('Fade')
  })
  offButton.addEventListener('click', function () {
    signal('Off')
  })

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
    if (conn && conn.open) {
      var msg = sendMessageBox.value
      sendMessageBox.value = ''
      conn.send(msg)
      console.log('Sent: ' + msg)
      addMessage('<span class="selfMsg">Self: </span> ' + msg)
    } else {
      console.log('Connection is closed')
    }
  })

  // Clear messages box
  clearMsgsButton.addEventListener('click', clearMessages)
  // Start peer connection on click
  connectButton.addEventListener('click', join)

  // Since all our callbacks are setup, start the process of obtaining an ID
  initialize()
})()
