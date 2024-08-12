window.nodeRequire = require;
delete window.require;
delete window.exports;
delete window.module;
let lastRequestTime = 0;
let cachedData = null;
let dataPromise = null;

async function getData(retryCount = 0) {
  console.log("getData çağrıldı, deneme sayısı:", retryCount);
  const now = Date.now();
  const throttleDuration = 5000; // 5 seconds
  const maxRetries = 3; // Maksimum yeniden deneme sayısı

  if (dataPromise && now - lastRequestTime < throttleDuration) {
    console.log("Mevcut istek kullanılıyor");
    return dataPromise;
  }

  if (cachedData && now - lastRequestTime < throttleDuration) {
    console.log("Önbellek kullanılıyor");
    return cachedData;
  }

  lastRequestTime = now;

  dataPromise = new Promise((resolve, reject) => {
    const ipcRenderer = require("electron").ipcRenderer;
    const timeoutId = setTimeout(async () => {
      console.error(
        `getData zaman aşımına uğradı (Deneme: ${retryCount + 1}/${
          maxRetries + 1
        })`
      );
      if (retryCount < maxRetries) {
        try {
          const result = await getData(retryCount + 1);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      } else {
        console.error("Maksimum yeniden deneme sayısına ulaşıldı");
        resolve(cachedData || {}); // Eğer cachedData null ise boş nesne döndür
      }
    }, throttleDuration);

    ipcRenderer.once("settingsDetails", (event, d) => {
      console.log("settingsDetails alındı", d);
      clearTimeout(timeoutId);
      cachedData = d || {}; // Eğer d null ise boş nesne kullan
      resolve(cachedData);
    });

    console.log("settingsGet gönderiliyor");
    ipcRenderer.send("settingsGet");
  });

  try {
    const result = await dataPromise;
    console.log("getData başarıyla tamamlandı");
    return result;
  } catch (error) {
    console.error("getData hatası:", error);
    return cachedData || {}; // Eğer cachedData null ise boş nesne döndür
  } finally {
    dataPromise = null;
  }
}
window.addEventListener("DOMContentLoaded", () => {
  if (!require("electron").ipcRenderer) {
    return;
  }
  if (window.trustedTypes) {
    const policy = trustedTypes.createPolicy("default", {
      createScriptURL: (url) => url,
    });

    const script = document.createElement("script");
    script.src = policy.createScriptURL(
      "https://cdn.jsdelivr.net/npm/sweetalert2@11"
    );
    script.type = "text/javascript";
    document.head.appendChild(script);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = policy.createScriptURL(
      "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
    );
    document.head.appendChild(link);
  } else {
    console.error("Trusted Types is not supported in this environment.");
    // Fallback code
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    script.type = "text/javascript";
    document.head.appendChild(script);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css";
    document.head.appendChild(link);
  }

  const style = document.createElement("style");
  style.id = "themeController";
  style.innerHTML = `player{display:block;width:100%;height:100%;background-color:#000;color:var(--be-hint-text)}`;
  document.body.appendChild(style);
  const renderer = require("electron").ipcRenderer;
  let lasthref;

  let remains = new Map();
  let founded = new Set();
  const observer = new MutationObserver((mutations) => {
    let skipButton = document.querySelectorAll("#skip");
    let video = document.getElementById("vidd");
    let skipButtonsArray = Array.from(skipButton);
    let filteredSkipButtons = skipButtonsArray.filter((button) => {
      return !founded.has(button);
    });
    if (filteredSkipButtons.length > 0 && video) {
      console.log("Skip button detected via MutationObserver:", skipButton);
      filteredSkipButtons.forEach((button) => {
        founded.add(button);
        getData().then((x) => {
          skipScript(button, video, x.autoSkip);
        });
      });
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  function skipScript(skip, video, autoSkip) {
    if (autoSkip) {
      let remainCount = remains.get(skip) || 0;

      if (skip.style.display === "block" && !video.paused) {
        if (remainCount >= 3) {
          skip.textContent = "Bu kısmı atla";
          remains.set(skip, 0);
          skip.click();
        } else {
          remainCount++;
          remains.set(skip, remainCount);
          skip.textContent = `Bu kısmı atla (${4 - remainCount})`;
        }
        if (skip && video)
          setTimeout(() => {
            skipScript(skip, video, autoSkip);
          }, 1000);
      } else {
        skip.textContent = "Bu kısmı atla (iptal)";
        remains.delete(skip);
        setTimeout(() => {
          skip.textContent = "Bu kısmı atla";
        }, 1000);
      }
   
    }
  }

  function Render() {
    if (lasthref !== window.location.href) {
      console.log(window.location.href);

      renderer.send("rpc-href", window.location.href);
      lasthref = window.location.href;
      const theme = document.documentElement.classList.contains("be-dark-mode")
        ? "dark"
        : "light";

      const intervalId = setInterval(() => {
        const colSmDivs = document.querySelectorAll(
          "#appMenu .col-sm-9 .col-sm"
        );

        if (colSmDivs.length) {
          changeTheme();
          colSmDivs.forEach((colSmDiv) => {
            const button = colSmDiv.querySelector("#settings");
            if (button) return;
            const newButton = document.createElement("button");
            newButton.setAttribute("mat-button", "");
            newButton.classList.add(
              "mat-focus-indicator",
              "mat-button",
              "mat-button-base"
            );

            const buttonContent = document.createElement("span");
            buttonContent.id = "settings";
            buttonContent.classList.add("mat-button-wrapper");
            buttonContent.textContent = "Ayarlar";
            newButton.appendChild(buttonContent);

            const rippleSpan1 = document.createElement("span");
            rippleSpan1.classList.add("mat-ripple", "mat-button-ripple");
            newButton.appendChild(rippleSpan1);

            const rippleSpan2 = document.createElement("span");
            rippleSpan2.classList.add("mat-button-focus-overlay");
            newButton.appendChild(rippleSpan2);
            colSmDiv.appendChild(newButton);
            newButton.onclick = onButtonClick;
          });
          clearInterval(intervalId);
        }
      }, 1000);
    }
  }
  Render();
  setInterval(() => Render(), 1000);
});
function changeTheme() {
  const theme = document.documentElement.classList.contains("be-dark-mode")
    ? "dark"
    : "light";
  const style = document.querySelector("#themeController");
  const button2 = document.querySelectorAll("button.mat-icon-button");
  const translatorText = document.querySelector(".translator-link h2");
  const otherTranslates = document.querySelectorAll(".more-videos h3");
  const buttons = document.querySelectorAll("button.mat-button");
  const buttons2 = document.querySelectorAll("button.mat-icon-button");
  const elements = document.querySelectorAll(
    "player .mat-drawer.mat-drawer-end"
  );

  if (theme == "light") {
    style.innerHTML = `.plyr__control--overlaid, .plyr__control--overlaid, .plyr--video {background: #F44336; background: var(--plyr-video-control-background-hover,var(--plyr-color-main,var(--plyr-color-main,#F44336)));} player .related-video.active {background-color: var(--be-primary-lighter);font-weight: 500;} player .action-toolbar.active .toolbar-bg-wrapper {background-color: #fff;border-bottom-left-radius: 4px;border-bottom-right-radius: 4px;padding-top: 4px;height: 56px;text-align: center;} .added-at-column, .translator-column, .video-name, .text-quality{color:#000;} .material-table > td, .material-table th{color:#000} player{display:block;width:100%;height:100%;background-color:#fff;color:var(--be-hint-text)} toolbar-bg-wrapper{background-color:#fff;border-bottom-left-radius:4px;border-bottom-right-radius:4px;padding-top:4px;height:56px;text-align:center}`;
    button2.forEach((button) => {
      button.style.color = "black";
    });
    otherTranslates.forEach((button) => {
      button.style.color = "black";
    });
    translatorText && (translatorText.style.color = "black");
    buttons.forEach((button) => {
      if (button.textContent.includes("Discord")) {
        button.style.color = "black";
      }
    });
    buttons2.forEach((button) => {
      button.style.color = "black";
    });
    elements.forEach((element) => {
      element.style.color = "black";
    });
  }
  if (theme == "dark") {
    style.innerHTML = `.plyr__control--overlaid, .plyr__control--overlaid, .plyr--video {background: #00b3ff; background: var(--plyr-video-control-background-hover,var(--plyr-color-main,var(--plyr-color-main,#00b3ff)));} player .related-video.active {background-color: #2e2e2e;font-weight: 500;} player .action-toolbar.active .toolbar-bg-wrapper {background-color: #000; border-bottom-left-radius: 4px;border-bottom-right-radius: 4px;padding-top: 4px;height: 56px;text-align: center;} .added-at-column, .translator-column, .video-name, .text-quality{color:#fff;} .material-table > td, .material-table th{color:#fff} player{display:block;width:100%;height:100%;background-color:#000;color:var(--be-hint-text)} toolbar-bg-wrapper{background-color:#000;border-bottom-left-radius:4px;border-bottom-right-radius:4px;padding-top:4px;height:56px;text-align:center}`;
    button2.forEach((button) => {
      button.style.color = "white";
    });
    otherTranslates.forEach((button) => {
      button.style.color = "white";
    });
    translatorText && (translatorText.style.color = "white");
    buttons.forEach((button) => {
      if (button.textContent.includes("Discord")) {
        button.style.color = "white";
      }
    });
    buttons2.forEach((button) => {
      button.style.color = "white";
    });
    elements.forEach((element) => {
      element.style.color = "var(--be-accent-contrast)";
    });
  }
}
function onButtonClick() {
  const renderer = require("electron").ipcRenderer;
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    background: document.documentElement.classList.contains("be-dark-mode")
      ? "#1c1c1c"
      : "#ffffff", // Arka plan rengini ayarla
    color: document.documentElement.classList.contains("be-dark-mode")
      ? "#ffffff"
      : "#1c1c1c", // Yazı rengini ayarla
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });
  Toast.fire({
    icon: "info",
    title: "Veri alınıyor...",
  });
  getData().then((data) => {
    Swal.fire({
      title: "Ayarlar",
      background: document.documentElement.classList.contains("be-dark-mode")
        ? "#1c1c1c"
        : "#ffffff", // Arka plan rengini ayarla
      color: document.documentElement.classList.contains("be-dark-mode")
        ? "#ffffff"
        : "#1c1c1c", // Yazı rengini ayarla
      showClass: {
        popup: `
            animate__animated
            animate__slideInDown
            animate__faster
          `,
      },
      hideClass: {
        popup: `
            animate__animated
            animate__slideOutDown
            animate__faster
          `,
      },
      html: `
        <div>
          <label>
            <input type="checkbox" id="checkbox1"> Karanlık mod
          </label><br>
          <label>
            <input type="checkbox" id="checkbox2"> Discord RPC
          </label><br>    <label>
            <input type="checkbox" id="checkbox3"> Otomatik atlama
          </label><br> <label>
            <input type="checkbox" id="checkbox4"> Sistem başlangıcı
          </label><br>  <label for="myInput">Bildirilecek animelerin id'si (, ile ayırın)</label>
<textarea id="myInput" name="Bildirilecek animeler" style="overflow:hidden;resize:both; width:300px; height:100px;"></textarea>

        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Onayla",
      cancelButtonText: "İptal",
      didOpen: () => {
        const isDarkMode =
          document.documentElement.classList.contains("be-dark-mode");
        document.getElementById("checkbox1").checked = isDarkMode;
        document.getElementById("checkbox2").checked = !!data.discordRPC;
        document.getElementById("checkbox3").checked = !!data.autoSkip;
        document.getElementById("checkbox4").checked = !!data.autoLaunch;
        document.getElementById("myInput").value = (data.notifyIDs ?? []).join(",");
      },
      preConfirm: () => {
        return {
          checkbox1: !!document.getElementById("checkbox1")?.checked,
          checkbox2: !!document.getElementById("checkbox2")?.checked,
          checkbox3: !!document.getElementById("checkbox3")?.checked,
          checkbox4: !!document.getElementById("checkbox4")?.checked,
          input1:   document.getElementById("myInput").value
        };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        if (
          result.value.checkbox1 ==
          !document.documentElement.classList.contains("be-dark-mode")
        ) {
          const button = Array.from(
            document.querySelectorAll("button.mat-button")
          ).find((el) =>
            ["Aydınlık Mod", "Karanlık Mod"].includes(el.textContent.trim())
          );
          if (button) {
            button.click();
            changeTheme();
          }
        }
        if (result.value.checkbox2 == !data.discordRPC) {
          renderer.send("settingsSet", "discordRPC", result.value.checkbox2);
          renderer.send("discord-rpc-destroy");
        }
        if (result.value.checkbox3 == !data.autoSkip) {
          renderer.send("settingsSet", "autoSkip", result.value.checkbox3);
        }
        
        if (result.value.checkbox4 == !data.autoLaunch) {
          renderer.send("toggleAutoLaunch");
        }
        if (result.value.input1.split(",") !== (data.notifyIDs ?? [])) {
          renderer.send("settingsSet","notifyIDs",result.value.input1.split(",") );
        }
      }
    });
  });
}
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
