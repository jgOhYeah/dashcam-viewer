import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from '../loader.service';
import { VideoFile } from '../file';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MapComponent } from '../map/map.component';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule, MapComponent],
  templateUrl: './viewer.component.html',
  styleUrl: './viewer.component.scss'
})
export class ViewerComponent {
  constructor(private route: ActivatedRoute, private loader: LoaderService) { }

  videoId: string = "";
  video: VideoFile | undefined;

  ngOnInit() {
    const videoId = this.route.snapshot.paramMap.get("video");
    this.videoId = videoId ? videoId.concat('.MP4') : "";
    console.log(`Video ID: ${this.videoId}`);
    this.loader.getVideoSubject().subscribe(videos => {
      // Wait until all videos have been loaded before trying to pick this one.
      if (videos.length > 0) {
        console.log("Videos loaded", videos);
        this.video = this.loader.find(this.videoId);
      }
    });
  }

}
