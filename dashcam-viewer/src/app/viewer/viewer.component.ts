import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from '../loader.service';
import { File } from '../file';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './viewer.component.html',
  styleUrl: './viewer.component.scss'
})
export class ViewerComponent {
  constructor(private route: ActivatedRoute, private loader: LoaderService) { }

  videoId: string = "";
  video: File | undefined;

  ngOnInit() {
    const videoId = this.route.snapshot.paramMap.get("video");
    this.videoId = videoId ? videoId.concat('.MP4') : "";
    console.log(`Video ID: ${this.videoId}`);
    this.loader.getLoad().subscribe(videos => {
      // Wait until all videos have been loaded before trying to pick this one.
      if (videos.length > 0) {
        console.log("Videos loaded", videos);
        this.video = this.loader.find(this.videoId);
      }
    });
  }

}
