.PHONY: server build

build:
	ng build

server:
	ng build --watch &
	sleep 8
	ln -s ../../../../DCIM dist/dashcam-viewer/browser/DCIM
	cd dist/dashcam-viewer/browser; python3 -m http.server