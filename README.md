# Dashcam Viewer Webpage
This is a web interface for a dashcam (Kaiser Bass R50), written using Angular. It is designed to be hosted by the dashcam itself.

A demonstration is available [here](https://jgohyeah.github.io/dashcam-viewer).

## Premise
The dashcam in question runs linux on what seems to be a [HiSilicon Hi3518E](https://www.silicondevice.com/file.upload/images/Gid1327Pdf_Hi3518E.pdf) SoC*. This camera does not have a screen and is designed to be configured and accessed over its own WiFi network.

After playing around with it on long trips with family, I found that the camera has a http server that serves the root of the SD card. By default, the web server generates a directory listing for each folder. If a file named `index.html` is added, it will serve this instead.

The dashcam viewer runs entirely in the user's web browser and doesn't require any server side scripting. It requests and interprets the directory listings to obtain the videos, thumbnails and GPS records on the system.

*\* Based on the names of various kernal modules loaded on boot.*

## Features
- View a list of all videos with thumbnails.
- Allows conversion of the non standard GPS logs to GPX files on a per video, daily or all data basis.
- Does not require an internet connection to use.
- Shows GPS traces for each video and for all logged GPS data.
- Shows speed over time and altitude over time graphs for each video.
- Runs on the client side only - does not require modification of the dashcam or root access.

## Building and running
### Setup
- Install nodejs and the angular CLI.
- Run `npm install`

### Deployment
- Run `npm run build`.
- Copy the contents of `dist/dashcam-viewer/browser` to the root of the camera's SD card.
- When the camera is on and a phone or computer is connected to its network, the page can be accessed by entering the camera's IP address in a web browser (by default, [http://192.192.168.1.1](http://192.168.1.1)).

### Local development server
- This requires that python3 is installed to use its built in http server (`python3 -m http.server`). This server automatically generates directory listings as required.
- Run `npm run start`.
- The `DCIM` and `gps` folders are served from the repository root by default. To get started, copy the root of the camera's SD card to this location. The folder to be served can be changed by editing the `cd` command in [`package.json`](package.json).
- Go to [localhost:4200](http://localhost:4200) or `{ip address}:4200` in a web browser. The page should automatically reload when an angular file is updated.

### Local development server with files proxied from the camera
- The computer needs to be connected to the dashcam's WiFi network. By default, it is assumed that the camera has the IP address `192.168.1.1`. If not, edit [`camera.proxy.conf.json`](camera.proxy.conf.json).
- Run `npm run start-camera`.
- Go to [localhost:4200](http://localhost:4200) or `{ip address}:4200` in a web browser. The page should automatically reload when an angular file is updated.

### Static demonstration build
- This includes some example footage, gps logs and directory listings in the build to demonstrate the website.
- Run `npm run demo`.
- The output is located in `dist/dashcam-viewer/browser`.
- The example data is located in [`src/demo-files`](src/demo-files/). Note that the `index.html` files need to be updated manually if the files are changed.

## SD Card file structure
A simple example is shown in [`src/demo-files`](src/demo-files/). Ignore the `index.html` files as these are for demonstration purposes only:
```
src/demo-files/
├── DCIM
│   ├── 100video
│   │   ├── 20240112181119_180.MP4
│   │   ├── 20240112181419_180.MP4
│   │   └── 20240113175633_163.MP4
│   ├── 101video
│   │   └── 20240113175916_10.MP4
│   ├── 103thumb
│   │   ├── 20240112181119.JPG
│   │   ├── 20240112181419.JPG
│   │   └── 20240113175633.JPG
│   └── 105thumb
│       └── 20240113175916.JPG
└── gps
    ├── 20240112.dat
    └── 20240113.dat
```

### Photos, videos and thumbanils
All photos and videos are in [`DCIM`](src/demo-files/DCIM/).
- Normal recorded videos go into [`100video`](src/demo-files/DCIM/100video/).
- Events (either manually triggered or detected using the accelerometer) go into [`101video`](src/demo-files/DCIM/101video/).
- A set of thumbnails at different points for each video in a compressed archive is placed in `102thumb`.
- A thumbnail in JPG format for each normal video is placed in [`103thumb`](src/demo-files/DCIM/103thumb/).
- For each event, a frame of the video is saved in `104snap`.
- A thumbnail for each event video is saved in [`105thumb`](src/demo-files/DCIM/105thumb/).

### GPS file structure
The GPS data is saved in a folder named `/gps`. Each date gets its own file named `YYYYMMDD.dat`, where:
- `YYYY` is the year.
- `MM` is the month.
- `DD` is the day of the month.

Each file is in a CSV style format. Each time the camera starts, it appends a line containing `#`. Each row then contains:
- Datetime (`YYYYMMDDhhmmss`)
- Latitude in the form (`ddmm.mmmmm` where `d` is degrees, `m` is minutes).
- `S` (probaby would be `N` in the northern hemisphere).
- Longitude (`dddmm.mmmmm` where `d` is degrees, `m` is minutes).
- `E`
- Speed in knots.
- Uncorrected altitude (in metres, matches the uncorrected altitude measured by a phone's gps fairly well). This field may be blank if the GPS hasn't found enough satelites yet.

Latitude and longitude are in the same format as generated by the GPS's [NMEA strings](https://www.sparkfun.com/datasheets/GPS/NMEA%20Reference%20Manual-Rev2.1-Dec07.pdf).

#### Example ([`20240112.dat`](src/demo-files/gps/20240112.dat))
```
#
20240112180000,3612.42986,S,14452.10341,E,28.709,
20240112180001,3612.43774,S,14452.10347,E,28.463,117.3
20240112180002,3612.44556,S,14452.10352,E,28.373,117.2
20240112180003,3612.45378,S,14452.10353,E,29.743,116.9
20240112180004,3612.46150,S,14452.10369,E,28.070,116.7
// ...
```