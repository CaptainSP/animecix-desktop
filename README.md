# AnimeciX Windows

[Click Here To see the English version](https://github.com/CaptainSP/animecix-desktop/blob/main/README-en.md)

-------

[animecix.net](https://animecix.net) web sitesinin masaüstü uygulamasıdır.

[Electron](https://www.electronjs.org/)  ile oluşturulmuştur. Typescript ile yazılmıştır.

## Özellikler
- Kaldığın yerden devam et
- Reklamsız video oynatma
- Otomatik sonraki bölüme geçme
- Videoları indirme
- Multi-Thread indirme

## Kurulum
1. AppImage Dosyasını İndirme

İlk olarak, uygulamanın doğru AppImage sürümünü indirdiğinizden emin olun. İşletim sisteminizin mimarisine uygun olanı seçtiğinizden emin olun.

2. Çalıştırma İzni Verme (Uygulama Özelliklerinden)

AppImage dosyasını indirdikten sonra, dosyayı çalıştırabilmek için bazı izinler vermeniz gerekebilir. Bunun için şu adımları takip edin:

İndirilen AppImage dosyasına sağ tıklayın.
Açılan menüde "Özellikler" (Properties) seçeneğine tıklayın.
"İzinler" (Permissions) sekmesine gidin.
Burada, "Bu dosyayı çalıştırılabilir hale getir" (Allow executing file as program) seçeneğinin işaretli olduğundan emin olun.
Bu, AppImage dosyasının çalıştırılabilir hale gelmesini sağlar.
Değişiklikleri kaydedin ve pencereden çıkın.

Alternatif olarak, terminal üzerinden de şu komutu kullanabilirsiniz:

chmod +x /path/to/your/file.AppImage

Bu komut, dosyaya çalıştırma izni verir.

3. Uygulamayı Açma

Artık AppImage dosyasına çalıştırma izni verdiğinize göre, uygulamayı açabilirsiniz. Bunu yapmak için:

-Dosyaya çift tıklayın.

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

## İletişim

Herhangi bir sorunuzda benimle iletişim kurmaktan çekinmeyin.

- [discord.gg/animecix](https://discord.com/invite/animecix) 
- Discord: [CaptainSP#9999](https://discord.com/users/344220078465744896)
- Mail: [onmuapps@gmail.com](mailto://onmuapps@gmail.com) 

## License

GPL
