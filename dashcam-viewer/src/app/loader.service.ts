import { Injectable } from '@angular/core';
import { File } from './file';
import { BehaviorSubject, Observable, of } from 'rxjs';

type Filter = (folder: File) => boolean;

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  videos: File[] = [];

  constructor() {
    this.collateVideosThumbnails();
  }

  events$ = new BehaviorSubject<File[]>([]);


  /**
   * Gets a list of dirctories containing various parts.
   */
  getFilesList(path: string, callback: (files: File[]) => void) {
    let client = new XMLHttpRequest();
    client.open('GET', path);
    client.onload = () => {
      callback(this.responseToArray(path, client.response));
    }
    client.send();
  }

  /**
   * Converts the response containing an automated directory listing to an array of strings.
   */
  responseToArray(path: string, linksResponse: string): File[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(linksResponse, 'text/html');
    const linksArr: HTMLElement[] = [].slice.call(doc.getElementsByTagName('a'));
    const files = linksArr.map(link => new File(link.attributes[0].value, path)).filter(file => file.basename != '..');
    return files;
  }

  /**
   * Creates a filter.
   */
  createFilter(search: string): Filter {
    return (folder: File) => folder.basename.includes(search);
  }

  /**
   * Requests a list of all files and calls a callback with this list.
   */
  async compileFileList(files: File[], filter: (folder: File) => boolean, callback: (files: File[]) => void) {
    // Get a list of each video
    const videos = files.filter(filter);
    const videoLists = videos.map(async file => {
      const promise = new Promise(
        (resolve: (value: File[]) => void, _reject) => this.getFilesList(`DCIM/${file.basename}`, resolve)
      );
      return promise;
    });

    // Merge all lists together
    let result: File[] = [];
    for (let i in videoLists) {
      result = result.concat(await videoLists[i]);
    }

    // Sort to be predictable
    result = result.sort((a, b) => b.basename.localeCompare(a.basename)); // Descending

    // Done
    callback(result);
  }

  /**
   * Returns a promise for getting a list of files in a folder.
   */
  fileListPromise(folders: File[], filter: Filter): Promise<File[]> {
    return new Promise((resolve, _reject) => this.compileFileList(folders, filter, resolve));
  }

  /**
   * For each video, attempts to find a matching thumbnail and add it to the object.
   */
  pairVideoThumbnails(videos: File[], thumbnails: File[]): File[] {
    function extractId(fname: string): string {
      return fname.slice(0, 14);

    }
    for (let vid in videos) {
      const id = extractId(videos[vid].basename);
      videos[vid].thumbnail = thumbnails.find(thumbFile => extractId(thumbFile.basename) == id);
    }
    return videos;
  }

  removeCurrentVideo(files: File[]): File[] {
    return files.filter(file => !this.createFilter('_0.MP4')(file));
  }

  /**
   * Collates all video thumbnails.
   */
  collateVideosThumbnails() {
    this.getFilesList('DCIM', async folders => {
      const thumbnailPromise = this.fileListPromise(folders, this.createFilter('thumb'));
      const videoPromise = this.fileListPromise(folders, this.createFilter('video'));

      const thumbnails = (await thumbnailPromise).filter(this.createFilter('.JPG'));
      const videos = this.removeCurrentVideo(await videoPromise);
      this.videos = this.pairVideoThumbnails(videos, thumbnails);
      this.events$.next(this.videos);
    });
  }

  /**
   * Returns an observable that updates when the videos load.
   */
  getLoad() {
    return this.events$.asObservable();
  }

  /**
   * Finds a video based on its filename.
   */
  find(name: string): File | undefined {
    return this.videos.find(video => video.basename == name);
  }
}
