import { Component } from '@angular/core';
import {MatSidenavModule} from '@angular/material/sidenav';
import { Workspace } from './workspace/workspace';
import { Navbar } from './navbar/navbar';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [MatSidenavModule, Workspace, Navbar],
  templateUrl: './main-content.html',
  styleUrl: './main-content.scss',
})
export class MainContent {

}
