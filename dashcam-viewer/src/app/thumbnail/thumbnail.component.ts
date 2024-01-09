import { Component, Input } from '@angular/core';
import { File, VideoFile } from '../file';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-thumbnail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './thumbnail.component.html',
  styleUrl: './thumbnail.component.scss'
})
export class ThumbnailComponent {
  @Input() file!: VideoFile;
}
