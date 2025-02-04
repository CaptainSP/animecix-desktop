````markdown
# AnimeciX MacOS

Desktop application for AnimeciX on MacOS.

![animecix-mac1](https://github.com/user-attachments/assets/bb484881-4e19-4183-a67e-0eb46e1f6a35)

### 🚨 Known Issues

None

### Working Features

- **DiscordRPC**: Works perfectly with all features!
- **TauVideo Player**
- **Video Download**
- **Resume from Last Position**
- **Ad-Free Video Playback**
- **Auto-Skip to Next Episode**
- **Video Downloading**
- **Multi-Thread Downloading**

![CleanShot 2025-02-05 at 02 12 46](https://github.com/user-attachments/assets/a8a246a9-7420-4128-b460-163e6a2e5eb0)

---

This is the MacBook application version of [animecix.net](https://animecix.net).

Built with [Electron](https://www.electronjs.org/) and written in TypeScript.

## Features

## Installation

1. Visit the [Latest Releases](https://github.com/CaptainSP/animecix-desktop/releases) page
2. Download the most recent `.dmg` file
3. Double-click the downloaded file to open it
4. Drag the application icon to your `Applications` folder

## Development

Ensure NodeJS is installed on your system.

```sh
git clone https://github.com/CaptainSP/animecix-desktop.git
```
````

After downloading or cloning, navigate to the folder and run:

```sh
npm install
```

Then modify the following file:
`animecix-mac/node_modules/@ghostery/adblocker-electron/dist/commonjs/preload_path.js`
Change "node:path" to "path" in the file contents.

(Alternatively, use my modified repository: https://github.com/ErenEksen/electron-adblocker-mac-compatible)

### Useful Commands

```sh
npm run compile # Compiles TypeScript and generates necessary JavaScript files
```

```sh
npm start # Starts Electron application with compiled code
```

```sh
npm run buildMac # Builds installation file for Arm64 Mac
```

## Contact

This is not an official project. Please do not contact original developers for support,
but feel free to reach out to me with any questions:

- [discord.gg/RBPUchD4ze](https://discord.com/invite/RBPUchD4ze)
- Discord: [axis27](https://discord.com/users/286890811763720202)
- Email: [mail@ereneksen.com](mailto://mail@ereneksen.com)

## License

GPL

```

```
