import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ThumbnailComponent } from "./thumbnail/thumbnail.component";
import { File } from './file';

type Filter = (folder: File) => boolean;

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [CommonModule, RouterOutlet, ThumbnailComponent]
})
export class AppComponent {
  title = 'dashcam-viewer';
  videos: File[] = [new File(
    "20230929122604_10.MP4",
    "DCIM/101video/",
    new File(
      "20230929122604.JPG", "DCIM/105thumb/"
    ))];

  ngOnInit() {
    this.collateVideosThumbnails();
  }

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
    result = result.sort((a, b) => a.basename.localeCompare(b.basename));

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

  /**
   * Collates all video thumbnails.
   */
  collateVideosThumbnails() {
    this.getFilesList('DCIM', async folders => {
      const thumbnailPromise = this.fileListPromise(folders, this.createFilter('thumb'));
      const videoPromise = this.fileListPromise(folders, this.createFilter('video'));

      const thumbnails = await thumbnailPromise;
      const videos = await videoPromise;
      this.videos = this.pairVideoThumbnails(videos, thumbnails);
      console.log(this.videos);
    });
  }
}
