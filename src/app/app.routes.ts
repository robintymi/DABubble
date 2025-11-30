import { Routes } from '@angular/router';
import { Signup } from './signup/signup';
import { MainContent } from './main-content/main-content';

export const routes: Routes = [
    { path: '', component: Signup },
    { path: 'main', component: MainContent },
];
