import { Component, inject, OnInit } from '@angular/core';
import { OkStatus, ValuesService } from '../../swagger';
import { version, versionDateString } from '../../shared/version';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-test-general',
  standalone: true,
  imports: [
    MatButtonModule,
  ],
  templateUrl: './test-general.html',
  styleUrl: './test-general.scss'
})
export class TestGeneral implements OnInit {
  private valuesService = inject(ValuesService);
  okStatus: OkStatus | null = null;
  loading = false;
  versionString = `v${version} [${versionDateString}]`;

  ngOnInit(): void {
    this.refreshStatus();
  }

  refreshStatus(): void {
    this.loading = true;
    this.okStatus = null;

    this.valuesService.valuesDummyGet().subscribe({
      next: x => {
        this.okStatus = x;
        this.loading = false;
      },
      error: err => {
        this.okStatus = { isOk: false, val: '', error: err.message };
        this.loading = false;
      },
    });
  }
}
