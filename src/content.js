function injectScript(src) {
  const script = document.createElement('script');
  script.innerHTML = src;
  document.documentElement.appendChild(script);
}

function init() {
  function wait(condition, onResult) {
    var loop = () => {
      if (condition()) {
        onResult();
        return;
      }

      setTimeout(loop, 300);
    };

    loop();
  }

  function addUi(subs, player) {
    var wrapper = document.querySelector('.sizing-wrapper') || document.body;
    if (!wrapper) return;

    var overlay = document.createElement('div');
    overlay.id = 'extensionOverlay';
    overlay.style.position = 'fixed';
    overlay.style.userSelect = 'text';
    overlay.style.zIndex = '1000';
    overlay.style.right = '0';
    overlay.style.top = '0';
    overlay.style.bottom = '0';
    overlay.style.width = '200px';
    overlay.style.overflow = 'auto';
    overlay.style.backgroundColor = 'black';
    overlay.style.color = 'white';
    overlay.style.fontSize = '14px';
    overlay.style.transition = 'right 300ms ease-in';

    var closeButton = document.createElement('div');
    closeButton.id = 'extensionOverlayClose';
    closeButton.textContent = '✕';
    closeButton.style.userSelect = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.style.position = 'fixed';
    closeButton.style.right = '5px';
    closeButton.style.top = '5px';
    closeButton.style.color = 'gold';
    closeButton.style.transition = 'right 300ms ease-in';

    closeButton.onclick = () => {
      closeButton.style.right = '-200px';
      overlay.style.right = '-200px';
      wrapper.style.right = '0';
    };
    overlay.appendChild(closeButton);

    subs.forEach(function (sub) {
      var item = document.createElement('div');
      item.textContent = sub.blocks.map(block => block.textNodes.map(function (t) { return t.text; }).join(' ')).join('\n');
      item.style.padding = '10px';
      item.style.cursor = 'pointer';

      item.onclick = () => player.seek(sub.startTime);

      overlay.appendChild(item);
    });

    wrapper.appendChild(overlay);
    wrapper.style.right = '200px';

    var subscribeToVideo = () => {
      var video = document.querySelector('video');

      var curSub;
      video.addEventListener('timeupdate', () => {
        var time = player.getCurrentTime();
        var idx = subs.findIndex(item => item.startTime >= time);

        if (curSub) { curSub.style.color = 'white'; }

        curSub = overlay.children[idx];
        if (curSub) {
          curSub.style.color = 'gold';

          curSub.scrollIntoViewIfNeeded ?
            curSub.scrollIntoViewIfNeeded() :
            curSub.scrollIntoView({ behavior: 'smooth' });
        }
      });
    };

    wait(() => document.querySelector('video'), subscribeToVideo);
  }

  function start() {
    var videoPlayer = window.netflix
      .appContext
      .state
      .playerApp
      .getAPI()
      .videoPlayer

    // Getting player id
    var playerSessionId = videoPlayer
      .getAllPlayerSessionIds()[0]

    var player = videoPlayer
      .getVideoPlayerBySessionId(playerSessionId);

    if (!subs.length) {
      var allTracks = player.getTimedTextTrackList();
      var track = player.getTimedTextTrack();
      var noneTrack = allTracks.find(t => !t.bcp47) || allTracks.find(t => t.displayName === 'off');

      if (!track || !track.bcp47 || track.displayName === 'Off') {
        track = allTracks.find(t => t.bcp47 === 'en' && t.displayName !== 'Off') ||
          allTracks.find(t => t.bcp47 && t.displayName !== 'Off');
      }

      if (track) {
        player.setTimedTextTrack(noneTrack);
        player.setTimedTextTrack(track);
      }
    }

    wait(() => subs.length, () => {
      addUi(subs.slice(), player);
      subs.length = 0;
    });
  }

  window.toggleSubtitlesSidebar = () => {
    var overlay = document.querySelector('#extensionOverlay');

    if (!overlay) {
      start();
      return;
    }

    var wasHidden = (overlay.style.right === '-200px');
    overlay.style.right = wasHidden ? '0' : '-200px';

    var closeButton = document.querySelector('#extensionOverlayClose');
    closeButton.style.right = wasHidden ? '5px' : '-200px';

    var wrapper = overlay.parentNode;
    wrapper.style.transition = 'right 300ms ease-in';
    wrapper.style.right = wasHidden ? '200px' : '0';
  };


  var subs = [];
  (() => {
    var push = Array.prototype.push;

    Array.prototype.push = function (...args) {
      var arg0 = args[0];
      if (arg0 && arg0.blocks) {
        subs[subs.length] = arg0;
      }
      return push.apply(this, args);
    };
  })();
}


injectScript((`(${ init })();`));


chrome.runtime.onMessage.addListener(data => {
  if (data.toggleSidebar) {
    injectScript('window.toggleSubtitlesSidebar()');
  }
});
