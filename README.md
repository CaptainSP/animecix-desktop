# AnimeciX MacOS

MacOS için Animecix Desktop uygulaması.

![CleanShot 2025-02-05 at 02 03 59](https://github.com/user-attachments/assets/fbe54e29-a167-4c8f-ab6f-2792424fdfc5)


### 🚨 Bilinen Sorunlar

Yok

### Neler Çalışıyor

- **DiscordRPC**: Her şeyiyle harika çalışıyor!
- **TauVideo Oynatıcı**
- **Video İndirme**
- **Kaldığın yerden devam et**
- **Reklamsız video oynatma**
- **Otomatik sonraki bölüme geçme**
- **Videoları indirme**
- **Multi-Thread indirme**

---

[animecix.net](https://animecix.net) web sitesinin macbook uygulamasıdır.

[Electron](https://www.electronjs.org/) ile oluşturulmuştur. Typescript ile yazılmıştır.

## Özellikler

## Kurulum

1. [Son sürümler](https://github.com/CaptainSP/animecix-desktop/releases) sayfasına gidin
2. `.dmg` uzantılı en güncel dosyayı indirin
3. İndirilen dosyayı çift tıklayıp açın
4. Uygulama ikonunu `Applications` klasörüne sürükleyin

## Geliştirme

Cihazınızda NodeJS kurulduğundan emin olun.

```sh
git clone https://github.com/CaptainSP/animecix-desktop.git
```

İndirdikten veya klonladıktan sonra klasör içerisinde:

```sh
npm install
```

komutunu çalıştırın.

Daha sonrasında
animecix-mac/node_modules/@ghostery/adblocker-electron/dist/commonjs/preload_path.js
Dosyasının içindeki "node:path" yazısını "path" ile değiştirin.

(Ya da direkt MacOS için düzenlediğim repoyu kullanın https://github.com/ErenEksen/electron-adblocker-mac-compatible )

### Yararlı Komutlar

```sh
npm run compile #Typescript derlemesi yapar ve gerekli JavaScript dosyalarını oluşturur.
```

```sh
npm start #Compile kodu ile birlikte Electron uygulamasını başlatır
```

```sh
npm run buildMac #Arm64 Mac için kurulum dosyası oluşturur.
```

## İletişim

Resmi bir proje değildir, destek için geliştiricilere yazmayın,
Ancak herhangi bir sorunuzda benimle iletişim kurmaktan çekinmeyin.

- [discord.gg/RBPUchD4ze](https://discord.com/invite/RBPUchD4ze)
- Discord: [axis27](https://discord.com/users/286890811763720202)
- Mail: [mail@ereneksen.com](mailto://mail@ereneksen.com)

## License

GPL
