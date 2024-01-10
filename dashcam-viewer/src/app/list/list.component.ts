import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ThumbnailComponent } from "../thumbnail/thumbnail.component";
import { LoaderService } from '../loader.service';
import { VideoFile } from '../file';
import { MapComponent } from '../map/map.component';

type VideoSet = {
  date: string,
  videos: VideoFile[]
};

@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  imports: [CommonModule, RouterOutlet, ThumbnailComponent, MapComponent]
})
export class ListComponent {
  constructor(private loader:LoaderService) {}

  videos: VideoSet[] = [];

  ngOnInit() {
    this.loader.getVideoSubject().subscribe(videos => {
      console.log(videos);
      if (videos.length) {
        // Group videos by date.
        let curSet:VideoSet = {
          date: videos[0].startDate.toLocaleDateString(),
          videos: [videos[0]]
        };
        for (let i = 1; i < videos.length; i++) {
          let startDate = videos[i].startDate.toLocaleDateString();
          if (startDate == curSet.date) {
            // Same date as previous video. Add to this set.
            curSet.videos.push(videos[i]);
          } else {
            // Different date, push the old set and create a new one.
            this.videos.push(curSet);
            curSet = {
              date: startDate,
              videos: [videos[i]]
            };
          }
        }
        // Push the last set.
        this.videos.push(curSet);
      }
    });
  }
}
