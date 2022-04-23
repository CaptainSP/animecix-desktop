# AnimeciX Windows

[animecix.net](https://animecix.net) web sitesinin masaüstü uygulamasıdır.

[Electron](https://www.electronjs.org/)  ile oluşturulmuştur. Typescript ile yazılmıştır.

## Özellikler
- Kaldığın yerden devam et
- Reklamsız video oynatma
- Otomatik sonraki bölüme geçme
- Videoları indirme
- Multi-Thread indirme

## Kurulum

Cihazınızda NodeJS kurulduğundan emin olun.

```sh
git clone https://github.com/CaptainSP/animecix-desktop.git
```
İndirdikten veya klonladıktan sonra klasör içerisinde:

```sh
npm install
```
komutunu çalıştırın.

### Yararlı Komutlar

```sh
npm run compile #Typescript derlemesi yapar ve gerekli JavaScript dosyalarını oluşturur.
```

```sh
npm start #Compile kodu ile birlikte Electron uygulamasını başlatır
```

```sh
npm run build #64 ve 32 bit Windows için kurulum dosyası oluşturur.
```

```sh
npm run build32 #Yalnızca 32 bit Windows için kurulum dosyası oluşturur.
```

## License

GPL