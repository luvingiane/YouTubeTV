<div align="center">
<img src="./build/icon.png" width=90px>

# **YouTube TV**
[![Downloads](https://img.shields.io/github/downloads/marcosrg9/YouTubeTV/total.svg?color=FF0000&label=Total%20Downloads)](https://github.com/marcosrg9/YouTubeTV/releases/)
[![Downloads](https://img.shields.io/github/downloads/marcosrg9/YouTubeTV/v3.0.1/total.svg?color=blue&label=Downloads%20in%20v3.0.1)](https://github.com/marcosrg9/YouTubeTV/releases/tag/v3.0.1)

YouTube TV is an application that brings the TV version of YouTube to the desktop, acting just like a Chromecast or a Smart TV.

<img src="./readme/en/main.png" width="600px">

</div><br>

## 🍴 About this fork

This is an **unofficial fork** of [marcosrg9/YouTubeTV](https://github.com/marcosrg9/YouTubeTV) (MIT, all credit for the base application goes to its author). It adds features the upstream project deliberately does not include (see the *Note on Ad Blocking* at the end of this file), so **please do not report issues or open PRs about this fork upstream**.

### What this fork adds

- **Ad blocking**: network-level blocking of ad/tracker domains ([Ghostery adblocker](https://github.com/ghostery/adblocker)) plus removal of ad data (video ads and sponsored tiles/mastheads) from YouTube's own responses.
- **SponsorBlock**: sponsors, self-promotion, interaction reminders, intros/outros, previews and off-topic music are skipped automatically, with an on-screen notice. Segments are fetched with SponsorBlock's privacy-preserving hash-prefix API (the video ID is never sent in full).
- **Game controller support**: D-pad / left stick to navigate, <kbd>A</kbd> select, <kbd>B</kbd> back, <kbd>X</kbd> / <kbd>Start</kbd> play-pause, <kbd>LB</kbd> / <kbd>RB</kbd> seek ∓10 s, <kbd>Select</kbd> opens the settings (which can also be navigated with the controller). Works with both "standard" pads and pads that report the D-pad as an axis (e.g. 8BitDo). Bindings live in [`renderers/main/gamepad.js`](./renderers/main/gamepad.js).
- **Full screen by default**, toggled with <kbd>F11</kbd> or <kbd>Alt</kbd> + <kbd>Enter</kbd>.
- **Settings**: new toggles for AdBlock, SponsorBlock and "start in full screen", plus an **Exit** section (close settings / quit).
- **Side menu**: *News*, *Gaming*, *Live*, *Sports* and *Movies* are removed, and an **Exit** entry is added after *Settings*.
- **Single instance**: launching the app again (for example from a launcher such as ES-DE) brings the running window to the front instead of opening a second, logged-out copy on the same profile.
- Italian translation (`it-IT`).

Ad blocking and SponsorBlock can be disabled from the settings, or with the environment variables `YTV_NO_ADBLOCK=1` / `YTV_NO_SPONSORBLOCK=1`.

### Downloads

Prebuilt packages are published in this fork's [Releases](../../releases). Only a **Linux `.deb` (x86_64)** is provided; it was built and tested on Debian 13. Windows and macOS packages are not published, but the project builds the same way as upstream (`npm run compile` followed by the `build:*` scripts). Note that npm may need `--legacy-peer-deps` to install the Castlabs Electron build.

## 🌎 Languages

This readme is available in the following languages:

- 🇪🇸 [Spanish](./README.es-ES.md)
- 🇺🇸 English


## 📦 Downloads

YouTube TV is available for Linux, Windows, and macOS. You can find precompiled binaries for most platforms. If your platform is Linux on ARM, please refer to the note found after the download list.

<table width="100px">
    <tr>
        <th><img width="441" height="1">Platform<img width="441" height="1"></th>
        <th><img width="441" height="1">Architecture<img width="441" height="1"></th>
        <th><img width="441" height="1">Link<img width="441" height="1"></th>
    </tr>
    <tr>
        <td rowspan="2">Windows</td>
        <td>x64/ARM64</td>
        <td align="center">
        <a href="https://github.com/marcosrg9/YouTubeTV/releases/download/v3.0.1/YouTube.TV.Setup.3.0.1.exe"><img src="https://img.shields.io/badge/Download-0078D4?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAvUlEQVR4nO3SwQmAQAADweu/aa1gQcF5CJkCNp+cMzOvXB/T3aQGVTepQdVNalB1kxpU3aQGVTepQdVNalB1kxpU3aQGVTepQdVNalB1kxpU3aQGVTepQdVNalB1kxpU3aQGVTepQdVNalB15zcudAHVTWpQdZMaVN2kBlU3qUHVTWpQdZMaVN2kBlU3qUHVTWpQdZMaVN2kBlU3qUHVTWpQdZMaVN2kBlU3qUHVTWpQdZMaVN2kBlV3Zs4jNxQH6GnVUPRlAAAAAElFTkSuQmCC"></a>
        </td>
    </tr>
    <tr>
        <td>ARM</td>
        <td align="center">
            <a href="https://github.com/marcosrg9/YouTubeTV/releases/download/v3.0.1/YouTube.TV.Setup.3.0.1-arm64.exe"><img src="https://img.shields.io/badge/Download-0078D4?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAvUlEQVR4nO3SwQmAQAADweu/aa1gQcF5CJkCNp+cMzOvXB/T3aQGVTepQdVNalB1kxpU3aQGVTepQdVNalB1kxpU3aQGVTepQdVNalB1kxpU3aQGVTepQdVNalB1kxpU3aQGVTepQdVNalB15zcudAHVTWpQdZMaVN2kBlU3qUHVTWpQdZMaVN2kBlU3qUHVTWpQdZMaVN2kBlU3qUHVTWpQdZMaVN2kBlU3qUHVTWpQdZMaVN2kBlV3Zs4jNxQH6GnVUPRlAAAAAElFTkSuQmCC"></a>
        </td>
    </tr>
    <tr>
        <td rowspan="2">macOS</td>
        <td>x64</td>
        <td align="center">
            <a href="https://github.com/marcosrg9/YouTubeTV/releases/download/v3.0.1/YouTube.TV-3.0.1.dmg"><img src="https://img.shields.io/badge/Download-black?style=for-the-badge&logo=apple"></a>
        </td>
    </tr>
    <tr>
        <td>Apple Silicon (ARM)</td>
        <td align="center">
            <a href="https://github.com/marcosrg9/YouTubeTV/releases/download/v3.0.1/YouTube.TV-3.0.1-arm64.dmg"><img src="https://img.shields.io/badge/Download-black?style=for-the-badge&logo=apple"></a>
        </td>
    </tr>
    <tr>
        <td rowspan="1">Linux (Debian)</td>
        <td>x64</td>
        <td align="center">
            <a href="https://github.com/marcosrg9/YouTubeTV/releases/download/v3.0.1/YouTube.TV-3.0.1-x64.deb"><img src="https://img.shields.io/badge/Download-A80030?style=for-the-badge&logo=debian"></a>
        </td>
    </tr>
    <tr>
        <td rowspan="1">Linux (RedHat)</td>
        <td>x64</td>
        <td align="center">
            <a href="https://github.com/marcosrg9/YouTubeTV/releases/download/v3.0.1/YouTube.TV-3.0.1-x64.rpm"><img src="https://img.shields.io/badge/Download-ee0000?style=for-the-badge&logo=redhat"></a>
        </td>
    </tr>
</table>

[All builds](https://github.com/marcosrg9/YouTubeTV/releases/latest)

> [!NOTE]
> 1. 32-bit versions are no longer distributed.
>
> 2. **There is no support for ARM on Linux**. You can find more information at the following locations:
>       - [Chromium Website](https://issues.chromium.org/issues/438403374)
>       - [Castlabs Issue GitHub #198](https://github.com/castlabs/electron-releases/issues/198)
>       - [Castlabs Issue GitHub #146 (RPi)](https://github.com/castlabs/electron-releases/issues/146)
>
>       I will monitor the status with every build to check for support updates.

## ⌨️ Keyboard Shortcuts

- **Settings Window**: <kbd>Ctrl</kbd> + <kbd>S</kbd>
- **Full Screen**: <kbd>Ctrl</kbd> + <kbd>F</kbd>.
- **Toggle Cursor Visibility**: <kbd>Ctrl</kbd> + <kbd>A</kbd>.
- **Full Screen (this fork)**: <kbd>F11</kbd> or <kbd>Alt</kbd> + <kbd>Enter</kbd>.

**For Developers**:
- **Main Window DevTools**: <kbd>Ctrl</kbd> + <kbd>D</kbd>.
- **Settings Window DevTools**: <kbd>Ctrl</kbd> + <kbd>⇧ Shift</kbd> + <kbd>D</kbd>.
- **Show Hidden Options**: 

## 🔧 Configuration

YouTube TV includes a set of preferences that you can adjust to your liking.\
To open this window, press <kbd>Ctrl</kbd> + <kbd>S</kbd>.
> [!NOTE]
> You can navigate the settings using the arrow keys, just like in the main window.
> - <kbd>↑</kbd>: Move to the option above.
> - <kbd>↓</kbd>: Move to the option below.
> - <kbd>←</kbd>: Return to the sidebar.
> - <kbd>→</kbd>: Move to the first option of the current section.
> <br><br>

### Max Resolution:

Setting a maximum resolution can benefit the device if it lacks the hardware capability to render high-quality video, but YouTube determines that it can play at a high resolution based on network speed.\
This can be useful for devices like a Raspberry Pi.

<div align="center">
<img src="./readme/en/resolution.png" width="400">
</div>

> **Note**: As of version 3.0.0, this setting does not seem to behave as expected. When this option was implemented, it was actually intended to "trick" YouTube into believing the device had a higher resolution capability to view higher quality content; later, this option was added as an additional limiting setting.<br>However, changes made in version 3.0.0 may have affected how YouTube determines this capability, resulting in video resolutions of up to 4K being obtained regardless.

### Keep Size:

YouTube TV can remember the window location and full-screen state.
However, this default configuration might be uncomfortable for some users, so it can now be toggled on or off.

<div align="center">
<img src="./readme/en/keepsize.png" width="400">
</div>

### Casting

YouTube TV allows you to use your phone to send content using the YouTube app. It works exactly like YouTube on a Chromecast or a Smart TV with the YouTube app installed.\
Check the Google guide for [more information](https://support.google.com/chromecast/answer/2995235?hl=es).

<div align="center">
<img src="./readme/en/cast.png" width="400">
</div>

This option is enabled by default, but you can disable it if necessary.

Additionally, you can add a custom name to recognize your device more easily when you want to cast content.

## ⚡️ Changelog
### Patch (3.0.1)
- Fixed a persistence issue that prevented settings from initializing.
- Fixed the application packaging to resolve an issue that prevented YouTube TV from installing on Windows ([#64](https://github.com/marcosrg9/YouTubeTV/issues/64)).
- Corrected the application category on Linux systems.
### 3.0.0
- Successfully integrated a DRM system. [More info](/castlabs)
- Content can finally be viewed up to 4K. Although an option for 8K exists, it does not seem to work properly.
- The settings interface has been completely redesigned.
- A small alert system for newer versions has been added.
- An internationalization system has been implemented. It is now easy to add new languages.
- It is now possible to define a custom device name for casting content from a phone.
- Dependencies have been updated.

## Technical Debt
- The settings renderer was reworked very quickly without considering the structure that might be implemented in the future. Therefore, adding new sections will be very complex. This is pending refactoring.

## ⚠️ Note on Ad Blocking
i did it, with sponsorblock too.
