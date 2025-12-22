import { Component, input } from '@angular/core';
import { AsideContentWrapperComponent } from '../aside-content-wrapper';

@Component({
  selector: 'app-privacy-policy',
  imports: [AsideContentWrapperComponent],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy {
  embedded = input(false);

  backInHistory() {
    window.history.back();
  }
}
