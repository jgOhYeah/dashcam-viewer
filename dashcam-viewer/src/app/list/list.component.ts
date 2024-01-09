import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ThumbnailComponent } from "../thumbnail/thumbnail.component";
import { LoaderService } from '../loader.service';
import { VideoFile } from '../file';
import { MapComponent } from '../map/map.component';

@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  imports: [CommonModule, RouterOutlet, ThumbnailComponent, MapComponent]
})
export class ListComponent {
  constructor(private loader:LoaderService) {}

  videos: VideoFile[] = []

  ngOnInit() {
    this.loader.getVideoSubject().subscribe(videos => {
      console.log(videos);
      this.videos = videos;
    });
  }
}
