import { app, dialog, BrowserWindow } from "electron";

/**
 * Ana process'teki hataları yakalar
 */
export function setupMainCrashHandler(): void {
  // Ana process hataları
  process.on("uncaughtException", (error: Error) => {
    console.error("Ana process çöktü:", error);

    dialog.showErrorBox(
      "Uygulama Başlatılamadı",
      "Beklenmeyen bir hata oluştu. Lütfen uygulamayı yeniden başlatın."
    );

    app.exit(1);
  });

  // Yakalanmamış Promise hataları
  process.on("unhandledRejection", (reason: unknown) => {
    console.error("Yakalanmamış promise hatası:", reason);

    dialog.showErrorBox(
      "Uygulama Başlatılamadı",
      "Bir hata oluştu. Lütfen uygulamayı yeniden başlatın."
    );

    app.exit(1);
  });
}

/**
 * Renderer (pencere) çökerse yakalar
 */
export function setupRendererCrashHandler(win: BrowserWindow): void {
  // Modern Electron sürümleri (render-process-gone)
  win.webContents.on("render-process-gone", (_event, details) => {
    console.error("Renderer process çöktü:", details);

    const html = `
      <html>
        <body style="background:#1e1e1e; color:white; text-align:center; margin-top:20%;">
          <h1>Uygulama Başlatılamadı</h1>
          <p>Lütfen uygulamayı yeniden başlatın.</p>
        </body>
      </html>
    `;

    win.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(html)}`);
  });


(win.webContents as any).on("crashed", () => {
  console.error("Renderer çöktü (fallback).");

  const html = `
    <html>
      <body style="background:#1e1e1e; color:white; text-align:center; margin-top:20%;">
        <h1>Uygulama Başlatılamadı</h1>
        <p>Lütfen uygulamayı yeniden başlatın.</p>
      </body>
    </html>
  `;

  win.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(html)}`);
})};