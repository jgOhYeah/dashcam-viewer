import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from '../loader.service';
import { File } from '../file';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './viewer.component.html',
  styleUrl: './viewer.component.scss'
})
export class ViewerComponent {
  constructor(private route: ActivatedRoute, private loader:LoaderService) { }

  videoId: string = "";
  video: File | undefined;

  ngOnInit() {
    this.videoId = this.route.snapshot.paramMap.get("video") ?? "";
    this.video = this.loader.find(this.videoId);
  }

}
