import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ThumbnailComponent } from "../thumbnail/thumbnail.component";
import { LoaderService } from '../loader.service';
import { File, VideoFile } from '../file';

@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  imports: [CommonModule, RouterOutlet, ThumbnailComponent]
})
export class ListComponent {
  constructor(private loader:LoaderService) {}

  videos: VideoFile[] = []

  ngOnInit() {
    this.loader.getLoad().subscribe(videos => {
      console.log(videos);
      this.videos = videos;
    });
  }
}
