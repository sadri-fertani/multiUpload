import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Rx";

@Injectable()
export class UploadService {

    constructor() {
    }

    public uploadFile(file: any): Observable<any> {
        return Observable.create(observer => {
            let formData: FormData = new FormData();
            file.xhr = null;
            file.xhr = new XMLHttpRequest();

            formData.append("uploads[]", file, file.fileNameDisplay + file.fileExtension);

            file.xhr.onreadystatechange = () => {
                if (file.xhr.readyState === 4) {
                    if (file.xhr.status === 200) {
                        observer.complete();
                    } else {
                        observer.error(file.xhr.response);
                    }
                }
            };

            file.xhr.upload.onprogress = (event) => {
                observer.next(Math.round(event.loaded / event.total * 100));
            };

            file.xhr.open('POST', '/api/file', true);
            file.xhr.send(formData);
        });
    }

    public deleteFile(file: any): Observable<any> {
        return Observable.create(observer => {
            file.xhr = null;
            file.xhr = new XMLHttpRequest();

            file.xhr.onreadystatechange = () => {
                if (file.xhr.readyState === 4) {
                    if (file.xhr.status === 200) {
                        observer.complete();
                    } else {
                        observer.error(file.xhr.response);
                    }
                }
            };

            file.xhr.open('DELETE', '/api/files/' + file.id, true);
            file.xhr.send();
        });
    }

    public renameFile(file: any): Observable<any> {
        return Observable.create(observer => {
            file.xhr = null;
            file.xhr = new XMLHttpRequest();

            let formData: FormData = new FormData();
            formData.append("newFileName", file.fileNameDisplay + file.fileExtension);

            file.xhr.onreadystatechange = () => {
                if (file.xhr.readyState === 4) {
                    if (file.xhr.status === 200) {
                        observer.complete();
                    } else {
                        observer.error(file.xhr.response);
                    }
                }
            };

            file.xhr.open('PATCH', '/api/files/' + file.id, true);
            file.xhr.send(formData);
        });
    }
}