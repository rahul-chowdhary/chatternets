// Generated by CoffeeScript 1.6.3
(function() {
  var MAX_ROOM_SIZE, app, curr_peers, express, generateId, logfmt, normalizeURL, onPeerConnected, onPeerDisconnected, peer_id, peer_id_counter, port, urlIdToPeerIds, urlIdToURL, urlToURLIds, url_id, uuid;

  express = require("express");

  logfmt = require("logfmt");

  uuid = require('node-uuid');

  app = express();

  app.use(logfmt.requestLogger());

  app.use(express.bodyParser());

  normalizeURL = function(urlRaw) {
    var urlNormal;
    urlNormal = urlRaw;
    return urlNormal.replace(/([\?#].*$)/gi, "");
  };

  generateId = function() {
    return uuid.v1();
  };

  MAX_ROOM_SIZE = 5;

  urlToURLIds = {};

  urlIdToURL = {};

  urlIdToPeerIds = {};

  onPeerConnected = function(urlRaw) {
    var peerId, peerIds, urlId, urlNormal, _i, _len, _ref;
    urlNormal = normalizeURL(urlRaw);
    if (!urlToURLIds.hasOwnProperty(urlNormal)) {
      urlId = generateId();
      urlIdToURL[urlId] = urlNormal;
      urlToURLIds[urlNormal] = [urlId];
    }
    peerId = generateId();
    _ref = urlToURLIds[urlNormal];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      urlId = _ref[_i];
      if (!urlIdToPeerIds.hasOwnProperty(urlId)) {
        urlIdToPeerIds[urlId] = [peerId];
        return {
          peerId: peerId,
          urlId: urlId,
          peerIds: []
        };
      }
      if (urlIdToPeerIds[urlId].length < MAX_ROOM_SIZE) {
        peerIds = urlIdToPeerIds[urlId].slice(0);
        urlIdToPeerIds[urlId].push(peerId);
        return {
          peerId: peerId,
          urlId: urlId,
          peerIds: peerIds
        };
      }
    }
    urlId = generateId();
    urlIdToURL[urlId] = urlNormal;
    urlToURLIds[urlNormal].push(urlId);
    urlIdToPeerIds[urlId] = [peerId];
    return {
      peerId: peerId,
      urlId: urlId,
      peerIds: []
    };
  };

  onPeerDisconnected = function(peerId, urlId) {
    var index, url;
    if (!urlIdToPeerIds.hasOwnProperty(urlId)) {
      return {
        success: false,
        message: "That urlId was not recognized"
      };
    }
    index = urlIdToPeerIds[urlId].indexOf(peerId);
    if (index === -1) {
      return {
        success: false,
        message: "That peerId, urlId pair was not recognized"
      };
    }
    urlIdToPeerIds[urlId].splice(index, 1);
    if (urlIdToPeerIds[urlId].length === 0) {
      delete urlIdToPeerIds[urlId];
      url = urlIdToURL[urlId];
      delete urlIdToURL[urlId];
      index = urlToURLIds[url].indexOf(urlId);
      if (index === -1) {
        return;
      }
      urlToURLIds[url].splice(index, 1);
      if (urlToURLIds[url].length === 0) {
        delete urlToURLIds[url];
      }
    }
    return {
      success: true
    };
  };

  app.get('/', function(req, res) {
    return res.sendfile('dashboard/index.html');
  });

  app.get('/bookmarklet/:file', function(req, res) {
    return res.sendfile('bookmarklet/' + req.params.file);
  });

  app.get('/bookmarklet/compiled/:file', function(req, res) {
    return res.sendfile('bookmarklet/compiled/' + req.params.file);
  });

  peer_id = "peernum";

  url_id = "onlyurl";

  peer_id_counter = 0;

  curr_peers = [];

  app.post('/new_peer', function(req, res) {
    var result;
    result = onPeerConnected(req.body.full_url);
    console.log(JSON.stringify(urlToURLIds, null, 4));
    console.log(JSON.stringify(urlIdToURL, null, 4));
    console.log(JSON.stringify(urlIdToPeerIds, null, 4));
    return res.send(result);
  });

  app.post('/delete_peer', function(req, res) {
    var result;
    result = onPeerDisconnected(req.body.peer_id, req.body.url_id);
    console.log(JSON.stringify(urlToURLIds, null, 4));
    console.log(JSON.stringify(urlIdToURL, null, 4));
    console.log(JSON.stringify(urlIdToPeerIds, null, 4));
    if (result.success) {
      return res.send(200);
    } else {
      return res.send(500, {
        error: result.message
      });
    }
  });

  app.post('/update_peer', function(req, res) {
    return res.send('TODO - not implemented');
  });

  port = process.env.PORT || 5000;

  app.listen(port, function() {
    return console.log("Listening on " + port);
  });

}).call(this);
