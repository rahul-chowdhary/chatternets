// Generated by CoffeeScript 1.6.3
(function() {
  var Chatternet, initialContainer,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  console.log("chatternets loaded");

  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

  Chatternet = (function() {
    function Chatternet(ui) {
      this.ui = ui;
      this.handlePeerError = __bind(this.handlePeerError, this);
      this.addPeerVideoCall = __bind(this.addPeerVideoCall, this);
      this.removePeerVideoCall = __bind(this.removePeerVideoCall, this);
      this.handlePeerCalling = __bind(this.handlePeerCalling, this);
      this.handlePeerOpen = __bind(this.handlePeerOpen, this);
      this.callPeer = __bind(this.callPeer, this);
      this.handleStartedLocalStream = __bind(this.handleStartedLocalStream, this);
      this.startLocalStream = __bind(this.startLocalStream, this);
      this.initPeerConnections = __bind(this.initPeerConnections, this);
      this.getInitDataFromServer = __bind(this.getInitDataFromServer, this);
      this.start = __bind(this.start, this);
      this.peer = null;
      this.urlId = null;
      this.pageId = window.location.toString().split("?")[1].split("=")[1];
      this.rawUrl = document.referrer;
      console.log(this.rawUrl);
      this.openCalls = {};
    }

    Chatternet.prototype.start = function() {
      return this.getInitDataFromServer();
    };

    Chatternet.prototype.getInitDataFromServer = function() {
      var _this = this;
      console.log("getting init data from server..");
      return $.ajax({
        url: "/new_peer",
        type: "POST",
        data: {
          "full_url": this.rawUrl,
          "page_id": this.pageId
        },
        success: function(jsonData) {
          return _this.initPeerConnections(jsonData);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log("ERROR");
          console.log(textStatus);
          return console.log(jqXHR);
        }
      });
    };

    Chatternet.prototype.initPeerConnections = function(jsonData) {
      var data,
        _this = this;
      console.log("Opening connections");
      data = JSON.parse(jsonData);
      console.log(data);
      this.urlId = data.url_id;
      console.log(data.peer_id);
      this.peer = new Peer(data.peer_id, {
        key: 'rrvwvw4tuyxpqfr',
        debug: true
      });
      this.peer.on("open", function() {
        return _this.handlePeerOpen();
      });
      this.peer.on("call", function(call) {
        return _this.handlePeerCalling(call);
      });
      this.peer.on("error", function(err) {
        return _this.handlePeerError(err);
      });
      return this.startLocalStream(data.peers);
    };

    Chatternet.prototype.startLocalStream = function(peerIdsToConnect) {
      var _this = this;
      console.log('starting local stream');
      return navigator.getUserMedia({
        audio: true,
        video: true
      }, function(stream) {
        return _this.handleStartedLocalStream(stream, peerIdsToConnect);
      }, function() {
        console.error("Error starting local stream!");
        $('#setup-error').show();
        return $("#setup-instructions").hide();
      });
    };

    Chatternet.prototype.handleStartedLocalStream = function(stream, peerIdsToConnect) {
      var peerId, _i, _len, _results;
      $('#setup-instructions').addClass('animated slideOutUp');
      $('.intro').fadeOut('slow');
      $('#video-container').show();
      $('#my-video').prop('src', window.URL.createObjectURL(stream));
      window.localStream = stream;
      console.log("Loaded local stream");
      _results = [];
      for (_i = 0, _len = peerIdsToConnect.length; _i < _len; _i++) {
        peerId = peerIdsToConnect[_i];
        _results.push(this.callPeer(peerId));
      }
      return _results;
    };

    Chatternet.prototype.callPeer = function(peerId) {
      var call;
      console.log("attempting to call peer " + peerId);
      call = this.peer.call(peerId, window.localStream);
      console.log(call);
      return this.addPeerVideoCall(call);
    };

    Chatternet.prototype.handlePeerOpen = function() {
      console.log("peer opened with id " + this.peer.id);
      console.log(this.peer);
      return $('#my-id').text(this.peer.id);
    };

    Chatternet.prototype.handlePeerCalling = function(call) {
      call.answer(window.localStream);
      return this.addPeerVideoCall(call);
    };

    Chatternet.prototype.removePeerVideoCall = function(call, videoSelector) {
      $(videoSelector).remove();
      delete this.openCalls[call.peer];
      if ($.isEmptyObject(this.openCalls)) {
        return this.ui.usersIsZero();
      }
    };

    Chatternet.prototype.addPeerVideoCall = function(call) {
      var videoClass, videoSelector,
        _this = this;
      console.log("call peer id is " + call.peer);
      videoClass = "their-video " + call.peer;
      videoSelector = "#video-container .their-video." + call.peer;
      $("#video-container").append("<div class='user other'><video class='" + videoClass + "' autoplay></video><div class='mic'>" + "<i class='fa fa-microphone-slash'></i></div></div>").trigger('user_connected');
      call.on('stream', function(stream) {
        return $(videoSelector).prop('src', URL.createObjectURL(stream));
      });
      call.on('close', function() {
        return _this.removePeerVideoCall(call, videoSelector);
      });
      call.on('error', function() {
        return _this.removePeerVideoCall(call, videoSelector);
      });
      return this.openCalls[call.peer] = call;
    };

    Chatternet.prototype.handlePeerError = function(err) {
      console.log("== PEER ERROR: ==");
      return console.log(err);
    };

    return Chatternet;

  })();

  initialContainer = (function() {
    function initialContainer() {
      this.waitingForUsers = true;
    }

    initialContainer.prototype.start = function() {
      var $container, $videoContainer, interval, numUsersAdded,
        _this = this;
      $('#setup-instructions').addClass('animated slideInDown');
      $container = $('#sample-user-container');
      $container.masonry({
        columnWidth: 10,
        itemSelector: '.sample-user',
        isOriginLeft: true
      });
      numUsersAdded = 0;
      interval = setInterval(function() {
        var elem, icon;
        if (numUsersAdded > 0) {
          $(".sample-user").removeClass("u" + (numUsersAdded - 1)).addClass("u" + numUsersAdded);
          elem = $("<div />").addClass("sample-user other u" + numUsersAdded);
          icon = $("<i />").addClass("fa fa-users");
          elem.append(icon);
        } else {
          elem = $('<div class="sample-user me"><i class="fa fa-user"></i></div>');
        }
        $container.append(elem);
        $container.masonry('appended', elem);
        $container.masonry();
        numUsersAdded += 1;
        if (numUsersAdded === 3) {
          return window.clearInterval(interval);
        }
      }, 400);
      $videoContainer = $("#video-container");
      return $videoContainer.on("user_connected", function() {
        var $myVideo;
        console.log("on user_connected");
        if (_this.waitingForUsers) {
          $(".waiting-message").slideUp();
          _this.waitingForUsers = false;
          $myVideo = $(".my-video-container-waiting");
          if ($myVideo) {
            $myVideo.removeClass("well my-video-container-waiting");
            $myVideo.addClass("my-video-container user");
          }
          return console.log("no longer Waiting for users");
        }
      });
    };

    initialContainer.prototype.usersIsZero = function() {
      this.waitingForUsers = true;
      return $(".waiting-message").slideDown();
    };

    return initialContainer;

  })();

  $(document).ready(function() {
    var chatternet, ui,
      _this = this;
    ui = new initialContainer();
    ui.start();
    chatternet = new Chatternet(ui);
    chatternet.start();
    return $("#video-container").on('click', "video.their-video", function(evt) {
      var micElem, videoElem;
      videoElem = $(evt.currentTarget);
      micElem = videoElem.parent().find(".mic i");
      console.log(videoElem);
      if (videoElem.prop('muted')) {
        videoElem.prop('muted', false);
        videoElem.attr('muted', false);
        videoElem.removeClass("muted-video");
        micElem.removeClass("fa-microphone").addClass("fa-microphone-slash");
      } else {
        videoElem.prop('muted', true);
        videoElem.attr('muted', true);
        videoElem.addClass("muted-video");
        micElem.removeClass("fa-microphone-slash").addClass("fa-microphone");
      }
      return console.log(videoElem.prop('muted'));
    });
  });

}).call(this);
