import { Injectable } from '@angular/core';
import { File, GPSFile, VideoFile } from './file';
import { GPSDataset, GPSRecord } from './gps';
import { BehaviorSubject } from 'rxjs';

type Filter = (folder: File) => boolean;

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  videos: VideoFile[] = [];
  gps: GPSDataset = new GPSDataset([]);

  constructor() {
    this.collateVideosThumbnails();
    this.loadGps();
  }

  videoLoaded$ = new BehaviorSubject<VideoFile[]>(this.videos);
  gpsLoaded$ = new BehaviorSubject<GPSDataset>(this.gps);


  /**
   * Gets a list of dirctories containing various parts.
   */
  private getFilesList<FType extends File>(type: { new(): FType; }, path: string, callback: (files: FType[]) => void) {
    let client = new XMLHttpRequest();
    client.open('GET', path);
    client.onload = () => {
      callback(this.responseToArray(type, path, client.response));
    }
    client.send();
  }

  /**
   * Converts the response containing an automated directory listing to an array of strings.
   */
  private responseToArray<FType extends File>(type: { new(): FType; }, path: string, linksResponse: string): FType[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(linksResponse, 'text/html');
    const linksArr: HTMLElement[] = [].slice.call(doc.getElementsByTagName('a'));
    const files = linksArr.map(link => {
      // Create a new file object of the correct type and extend.
      const file = new type();
      file.basename = link.attributes[0].value;
      file.path = path;
      return file;
    }).filter(file => file.basename != '..');
    return files;
  }

  /**
   * Creates a filter.
   */
  createFilter(search: string): Filter {
    return (folder: File) => folder.basename?.includes(search) ?? false;
  }

  /**
   * Requests a list of all files and calls a callback with this list.
   */
  private async compileFileList<FType extends File>(type: { new(): FType; }, sourceFiles: File[], filter: Filter, callback: (files: FType[]) => void) {
    // Get a list of each video
    const videos = sourceFiles.filter(filter);
    const videoLists = videos.map(async file => {
      const promise = new Promise(
        (resolve: (value: FType[]) => void, _reject) => this.getFilesList(type, `DCIM/${file.basename}`, resolve)
      );
      return promise;
    });

    // Merge all lists together
    let result: FType[] = [];
    for (let i in videoLists) {
      result = result.concat(await videoLists[i]);
    }

    // Sort to be predictable
    result = result.sort((a, b) => (a.basename && b.basename) ? b.basename.localeCompare(a.basename) : 0); // Descending

    // Done
    callback(result);
  }

  /**
   * Returns a promise for getting a list of files in a folder.
   */
  private fileListPromise<FType extends File>(type: { new(): FType; }, folders: File[], filter: Filter): Promise<FType[]> {
    return new Promise((resolve, _reject) => this.compileFileList(type, folders, filter, resolve));
  }

  /**
   * For each video, attempts to find a matching thumbnail and add it to the object.
   */
  private pairVideoThumbnails(videos: VideoFile[], thumbnails: File[]): VideoFile[] {
    function extractId(fname: string): string {
      return fname.slice(0, 14);

    }
    for (let vid in videos) {
      const id = extractId(videos[vid].basename ?? '');
      videos[vid].thumbnail = thumbnails.find(thumbFile => extractId(thumbFile.basename ?? '') == id);
    }
    return videos;
  }

  /**
   * Removes 0 length (based on filename) videos that won't yet have a thumbnail or load correctly.
   */
  private removeCurrentVideo<FType extends File>(files: FType[]): FType[] {
    return files.filter(file => !this.createFilter('_0.MP4')(file));
  }

  /**
   * Collates all video thumbnails.
   */
  private collateVideosThumbnails() {
    this.getFilesList(File, 'DCIM', async folders => {
      const thumbnailPromise = this.fileListPromise(File, folders, this.createFilter('thumb'));
      const videoPromise = this.fileListPromise(VideoFile, folders, this.createFilter('video'));

      const thumbnails = (await thumbnailPromise).filter(this.createFilter('.JPG'));
      const videos = this.removeCurrentVideo(await videoPromise);
      this.videos = this.pairVideoThumbnails(videos, thumbnails);
      this.videoLoaded$.next(this.videos);
    });
  }

  private loadGps() {
    this.getFilesList(GPSFile, 'gps', async files => {
      const gpsPromises: Promise<GPSRecord[]>[] = files.map(file => new Promise<GPSRecord[]>((resolve, _reject) => file.load(resolve)));

      // Merge all lists together
      let result: GPSRecord[] = [];
      for (let i in gpsPromises) {
        result = result.concat(await gpsPromises[i]);
      }

      // Sort to be predictable
      this.gps = new GPSDataset(result.sort((a, b) => a.date.valueOf() - b.date.valueOf()));
      this.gpsLoaded$.next(this.gps);
    });
  }

  /**
   * Returns an observable that updates when the videos load.
   */
  getVideoSubject() {
    return this.videoLoaded$.asObservable();
  }

  getGPSSubject() {
    return this.gpsLoaded$.asObservable();
  }

  /**
   * Finds a video based on its filename.
   */
  find(name: string): VideoFile | undefined {
    return this.videos.find(video => video.basename == name);
  }
}
