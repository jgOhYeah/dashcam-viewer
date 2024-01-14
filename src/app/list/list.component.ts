import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ThumbnailComponent } from "../thumbnail/thumbnail.component";
import { LoaderService } from '../loader.service';
import { VideoFile } from '../file';
import { MapComponent } from '../map/map.component';
import { GpxComponent } from '../gpx/gpx.component';

type VideoSet = {
  date: Date,
  videos: VideoFile[]
};

@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  imports: [CommonModule, RouterOutlet, ThumbnailComponent, MapComponent, GpxComponent]
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
          date: this.dayStart(videos[0].startDate),
          videos: [videos[0]]
        };
        for (let i = 1; i < videos.length; i++) {
          let startDate = this.dayStart(videos[i].startDate);
          if (startDate.valueOf() === curSet.date.valueOf()) {
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
      console.log(this.videos);
    });
  }

  private dayStart(date: Date): Date {
    const independent = new Date(date);
    independent.setHours(0, 0, 0, 0);
    return independent;
  }

  dayPlusOne(date: Date): Date {
    return new Date(date.valueOf() + 24*3600*1000);
  }

  dateGpxName(date: Date): string {
    const datestr = date.toISOString();
    return `${datestr.split('T')[0].replaceAll('-', '')}_dashcam.gpx`;
  }
}
