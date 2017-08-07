import { Component, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  complexForm: FormGroup;
  iUser: string;
  iMessage: string;
  iFiles: any;

  constructor(private fb: FormBuilder) {
    this.createForm();
  }

  createForm(): void {
    this.complexForm = this.fb.group({
      iUser: [this.iUser, Validators.required],
      iMessage: [this.iMessage, Validators.required],
      iFiles: [this.iFiles, Validators.required]
    });
  }

  submitForm(value: any): void {
    console.log(value);
  }

  reset(): void {
    this.complexForm.reset();
  }
}
