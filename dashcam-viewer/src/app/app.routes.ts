import { Routes } from '@angular/router';
import { ViewerComponent } from './viewer/viewer.component';
import { ListComponent } from './list/list.component';

export const routes: Routes = [
    {
        path: 'viewer',
        component: ViewerComponent
    },
    {
        path: '**',
        component: ListComponent
    }
];
