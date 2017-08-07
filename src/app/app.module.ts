import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';

import { UploadMultiComponent } from './eUploadMulti/eUploadMulti.component'

import { UploadService } from './eUploadMulti/shared/upload.service'
import { Utils } from './eUploadMulti/shared/utils'

@NgModule({
  declarations: [
    AppComponent,
    UploadMultiComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    HttpModule
  ],
  providers: [UploadService, Utils],
  bootstrap: [AppComponent]
})
export class AppModule { }
