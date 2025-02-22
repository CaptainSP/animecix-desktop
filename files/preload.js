window.nodeRequire = require;
delete window.require;
delete window.exports;
delete window.module;

var i_n_t_erval = setInterval(function () {
  if (!require("electron").ipcRenderer) {
    return;
  }
  if (window.location.href.includes("animecix.com")) {
    clearInterval(i_n_t_erval);
    return;
  }

  if (window.location.href.indexOf("sibnet.ru") >= 0) {
    updateCurrent();
    window.location.href =
      "https://m.animecix.com/animecix-windows-player/?type=sibnet";
  }

  if (
    (window.location.href.indexOf("ok.ru") >= 0 ||
      window.location.href.indexOf("odnoklassniki") >= 0) &&
    window.location.href.includes("videoembed")
  ) {
    //window.location.href = "https://m.animecix.com/windows/sources.html#odnok"
  }

  var url = window.location.href;
  var interval;

  if (
    url.indexOf("fembed") >= 0 ||
    url.indexOf("femax20") >= 0 ||
    url.indexOf("feurl") >= 0 ||
    url.indexOf("mrdhan") >= 0 ||
    url.indexOf("/v/") >= 0
  ) {
    interval = setInterval(function () {
      if (jwplayer("vstr").getConfig().sources) {
        const { ipcRenderer } = nodeRequire("electron");
        updateCurrent();
        ipcRenderer.send(
          "Fembed",
          JSON.stringify(jwplayer("vstr").getConfig().sources)
        );
        clearInterval(interval);
        window.location.href =
          "https://m.animecix.com/animecix-windows-player/?type=sources";
      } else {
        var bound = document
          .querySelector(".loading-container > svg")
          .getBoundingClientRect();
        click(bound.x, bound.y);
        //document.querySelector(".loading-container > svg").click();
      }
    }, 1000);

    var videoId = window.location.href
      .split("/v/")[1]
      .split("?")[0]
      .split("#")[0];

    fetch("/api/source/" + videoId, {
      method: "POST",
      body: JSON.stringify({
        r: "",
        d: location.hostname,
      }),
    }).then((res) => {
      res.json().then((data) => {
        fetch("https://v3.fstats.xyz/watch", {
          method: "POST",
          body: JSON.stringify({ id: videoId, user: USER_ID, ref: "", vip: 0 }),
        }).then((res) => {});

        const { ipcRenderer } = nodeRequire("electron");

        //console.log("AAAA", data)
        updateCurrent();
        ipcRenderer.send("Fembed", JSON.stringify(data.data));
        clearInterval(interval);
        window.location.href =
          "https://m.animecix.com/animecix-windows-player/?type=sources";
      });
    });
  }

  if (url.indexOf("vk.com") >= 0 && url.indexOf("href.li") < 0) {
    let sources = [];
    let obj = JSON.parse(
      document.body.innerHTML
        .split("var playerParams = ")[1]
        .split("var container =")[0]
        .slice(0, -2)
    );
    obj = obj["params"][0];

    if (obj["url240"]) {
      sources.add({
        label: "240P",
        file: obj["url240"],
        type: "mp4",
      });
    }

    if (obj["url360"]) {
      sources.add({
        label: "360P",
        file: obj["url360"],
        type: "mp4",
      });
    }

    if (obj["url480"]) {
      sources.add({
        label: "480P",
        file: obj["url480"],
        type: "mp4",
      });
    }

    if (obj["url720"]) {
      sources.add({
        label: "720P HD",
        file: obj["url720"],
        type: "mp4",
      });
    }

    if (obj["url1080"]) {
      sources.add({
        label: "1080P FHD",
        file: obj["url1080"],
        type: "mp4",
      });
    }

    const { ipcRenderer } = nodeRequire("electron");
    updateCurrent();
    ipcRenderer.send("Fembed", JSON.stringify(sources));
    window.location.href =
      "https://m.animecix.com/animecix-windows-player/?type=sources";
  }

  if (url.indexOf("streamtape") >= 0 || url.indexOf("stape.fun") >= 0) {
    var interval = setInterval(function () {
      if (
        document.querySelector("video") &&
        document.querySelector("video").src
      ) {
        const { ipcRenderer } = nodeRequire("electron");
        updateCurrent();
        ipcRenderer.send("Standart", document.querySelector("video").src);
        window.location.href =
          "https://m.animecix.com/animecix-windows-player?type=standart";
        clearInterval(interval);
      }
    }, 1000);
  }

  if (url.indexOf("uqload") >= 0 && document.querySelectorAll("video")[0].src) {
    const { ipcRenderer } = nodeRequire("electron");
    if (document.querySelectorAll("video")[0].src.length > 7) {
      updateCurrent();
      ipcRenderer.send("Standart", document.querySelectorAll("video")[0].src);
      window.location.href =
        "https://m.animecix.com/animecix-windows-player?type=standart";
    } else {
      ipcRenderer.send("Next", true);
    }
  }

  if (
    url.indexOf("vudeo.net") >= 0 &&
    document.querySelectorAll("video")[0].src
  ) {
    const { ipcRenderer } = nodeRequire("electron");
    if (document.querySelectorAll("video")[0].src.length > 7) {
      updateCurrent();
      ipcRenderer.send("Standart", document.querySelectorAll("video")[0].src);
      window.location.href = "https://m.animecix.com/animecix-windows-player";
    } else {
      ipcRenderer.send("Next", true);
    }
  }

  if (url.indexOf("mail.ru") >= 0 && !url.indexOf("/hv/") >= 0) {
    var interval = setInterval(function () {
      if (jQuery) {
        var url = JSON.parse(
          document
            .querySelector("div[data-mru-fragment='video/embed/main']")
            .querySelector("script").textContent
        )["flashVars"]["metadataUrl"];
        jQuery.get("https:" + url, function (data) {
          var sources = [];

          data["videos"].reverse().forEach(function (item) {
            var source = {
              label: item.key,
              file: "https:" + item.url,
            };
            sources.push(source);
          });
          const { ipcRenderer } = nodeRequire("electron");
          updateCurrent();
          //ipcRenderer.send("Fembed", JSON.stringify(sources));
          //window.location.href = "https://m.animecix.com/windows/sources.html"
        });
        clearInterval(interval);
      }
    }, 1000);
  }

  function click(x, y) {
    var ev = document.createEvent("MouseEvent");
    var el = document.elementFromPoint(x, y);
    ev.initMouseEvent(
      "click",
      true,
      true,
      window,
      null,
      x,
      y,
      0,
      0,
      false,
      false,
      false,
      false,
      0,
      null
    );
    el.dispatchEvent(ev);
  }

  function updateCurrent() {
    require("electron").ipcRenderer.send("updateCurrent", window.location.href);
  }
}, 1000);
