import { Component, ElementRef, Renderer2, Input, Output, EventEmitter, ViewChild, forwardRef } from '@angular/core';
import { FormBuilder, Validators, ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, AbstractControl, NgForm } from '@angular/forms';

import { Observable } from "rxjs/Observable";

import { UploadService } from './shared/upload.service'
import { Utils, Status } from './shared/utils'

@Component({
    selector: 'eUpload',
    templateUrl: './eUploadMulti.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => UploadMultiComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => UploadMultiComponent),
            multi: true
        }
    ]
})
export class UploadMultiComponent implements ControlValueAccessor, Validator {

    private ref: Array<any>;
    private files: any[];
    private label: string;
    private status: Status;
    private autoUpload: boolean;
    private IsInsideDropZone: boolean;
    private data: any;
    private propagateChange = (_: any) => { };

    validate(c: AbstractControl): any {
        setTimeout(() => {
            return {
                jsonParseError: {
                    valid: this.formControl.errors == null
                }
            }
        }, 0);
    }
    registerOnValidatorChange(fn: () => void): void {
    }

    writeValue(obj: any): void {
        if (obj == null) {
            this.files = [];
            this.status = Status.Waiting;
        }

        this.Ref = obj;
    }
    registerOnChange(fn: any): void {
        this.propagateChange = fn;
    }
    registerOnTouched(fn: any): void {
        /* R.A.S */
    }
    setDisabledState(isDisabled: boolean): void {
        /* R.A.S */
    }

    @Input()
    private formControl?: FormControl;

    @Input()
    get Ref() {
        return this.ref;
    }

    set Ref(val) {
        if (val == null || val == undefined) {
            this.ref = [];
            return
        }

        this.ref = val;

        this.data = this.ref;

        this.RefChange.emit(this.Ref);

        // update the form
        this.propagateChange(this.data);
    }

    @Input()
    get Label() {
        return (this.label) ? this.label : "Parcourir";
    }

    set Label(val) {
        if (this.label == val) return;
        this.label = val;
    }

    @Input()
    get AutoUpload() {
        if (this.autoUpload == undefined) return true;

        return this.autoUpload;
    }

    set AutoUpload(val) {
        if (this.autoUpload == val) return;

        this.autoUpload = this.utils.toBoolean(val);
    }


    get IsUploading() {
        return this.files.filter(file => {
            return file.isRunning
        }).length > 0;
    }

    get IsEditMode() {
        return this.files.filter(file => {
            return file.isEditing
        }).length > 0;
    }

    get TotalSize() {
        let totalSize: number = 0;

        this.files.slice(0).map(file => { totalSize += file.size; });

        return this.utils.formatBytes(totalSize);
    }

    @Output()
    RefChange = new EventEmitter();

    constructor(private uploadSrv: UploadService, private utils: Utils) {
        this.files = [];
        this.IsInsideDropZone = false;
    }

    ngOnInit(): void {
        this.status = Status.Waiting;
    }

    //          //
    //  EVENTS  //
    //          //

    /// Click on button Parcourir
    onChange(event): void {
        // Marks the control as touched.
        this.formControl.markAsTouched();

        // add files to list
        this.addFilesToTheList(event.srcElement.files);

        if (this.AutoUpload) {
            // Upload en cours
            this.status = Status.Uploading;
            // uploading
            this.uploadAllFiles();
        }
    }

    onDragEnterOverEvents(event): void {
        event.preventDefault();
        event.stopPropagation();
        // Nous sommes dans une zone autorisée au drop
        this.IsInsideDropZone = true;
        // Marks the control as touched.
        this.formControl.markAsTouched();
    }

    /// Drop files
    onDropEvent(event): void {
        event.preventDefault();
        event.stopPropagation();

        // Ajouter les fichiers si pas d'Upload en cours
        if (!this.IsUploading) {

            // add files to list
            this.addFilesToTheList(event.dataTransfer.files);

            if (this.AutoUpload) {
                // Upload en cours
                this.status = Status.Uploading;
                // uploading
                this.uploadAllFiles();
            }
        }
        else {
            this.IsInsideDropZone = false;
        };
    }

    onDragLeaveEvent(event): void {
        this.IsInsideDropZone = false;
    }

    //          //
    //  DELETE  //
    //          //

    removeAllFiles(): void {
        let tabCopyFiles = this.files.slice(0);

        tabCopyFiles.map(file => {
            if (file.id) {
                this.deleteFileFromServer(file);
            } else {
                this.deleteFileFromList(file);
            }
        });
    }

    deleteFileFromList(file): void {
        console.log('Remove file form list : ', file.name);
        this.files.splice(this.files.indexOf(file), 1);
    }

    deleteFileFromServer(file): void {
        console.log('Remove file form server : ' + file.name + ' : ' + file.id);
        this.uploadSrv.deleteFile(file).subscribe(
            (progress) => { /* Deleting */ },
            (error) => { file.isError = true; file.isRunning = false; },
            () => { this.Ref = this.removeRefFinishedFileUploaded(file); });
    }

    removeRefFinishedFileUploaded(file: any): Array<any> {
        // suppression de la liste qu'on traite
        this.files.splice(this.files.indexOf(file), 1);
        // suppression de l'élement de la ref
        return this.ref.filter(v => { return v.id != file.id });
    }

    //         //
    //  ABORT  //
    //         //

    abortAllFiles(): void {
        for (let cpt = 0; cpt < this.files.length; cpt++) {
            let currentFile = this.files[cpt];
            if (currentFile.isRunning) {
                this.abortFile(currentFile);
            }
        }
    }

    abortFile(file: any): void {
        file.xhr.abort();
        file.isAborted = true;
        file.isError = false;
        this.formControl.updateValueAndValidity();
    }

    //          //
    //  UPLOAD  //
    //          //

    uploadAllFiles(): void {
        for (let cpt = 0; cpt < this.files.length; cpt++) {
            let currentFile = this.files[cpt];
            if (!currentFile.isSuccess)
                this.uploadFile(currentFile);
        }
    }

    uploadFile(file): void {
        file.isRunning = true;
        file.isError = false;
        file.isAborted = false;

        this.uploadSrv.uploadFile(file)
            .takeWhile(() => file.isRunning)
            .subscribe(
            (progress) => {
                file.progress = Math.min(progress, 99);                 /* defect 01 : Pour éviter sur l'ihm, le cas progression 100% et une erreur d'upload */
                this.formControl.setErrors({ 'uploading': true });      /* make the component invalid when uploading progress */
            },
            (error) => {
                file.isError = true; file.isRunning = false;
                this.formControl.setErrors({ 'uploading': true });      /* make the component invalid when uploading progress */
            },
            () => {
                file.progress = 100;                                    /* defect 01 : rectification du progress */
                file.isSuccess = true;
                file.isError = false;
                file.isRunning = false;
                file.id = JSON.parse(file.xhr.responseText).id;
                file.xhr = null;
                this.Ref = this.addRefFinishedFileUploaded({ 'name': file.fileNameDisplay + file.fileExtension, 'id': file.id });
            });
    }

    addRefFinishedFileUploaded(dataTemp): Array<any> {
        let tempData = this.ref.slice(0);
        tempData.push(dataTemp);

        return tempData;
    }

    addFilesToTheList(tabFiles): void {
        console.log('Ajout des fichiers dans le tableau');

        for (var cpt = 0; cpt < tabFiles.length; cpt++) {
            let currentFile = tabFiles[cpt];

            currentFile.position = cpt;
            currentFile.isError = false;
            currentFile.isSuccess = false;
            currentFile.isRunning = false;
            currentFile.isAborted = false;
            currentFile.isEdited = false;

            currentFile.fileNameDisplay = this.utils.getFileNameWithoutExt(currentFile.name);
            currentFile.fileExtension = this.utils.getFileExtension(currentFile.name);
            currentFile.fileSizeDisplay = this.utils.formatBytes(currentFile.size);

            this.files.push(currentFile);
        }
    };

    //                      //
    //  EDIING FILE NAME    //
    //                      //

    keyDownEditFileName(evt, myForm: NgForm, file): void {
        let key = evt.keyCode || evt.which;
        // Enter
        if (key == 13) {
            if (myForm.controls['newFileName'].valid)
                this.validateEditFileName(file)
            else
                evt.preventDefault();
        }

        // Cancel
        if (key == 27) {
            this.cancelEditFileName(file)
        }
    }

    editFileName(file): void {
        file.isEdited = true;
    }

    cancelEditFileName(file): void {
        file.isEdited = false;
        file.fileNameDisplay = this.utils.getFileNameWithoutExt(file.name);
    }

    validateEditFileName(file): void {
        file.isEdited = false;
        if (file.isSuccess) {
            this.uploadSrv.renameFile(file).subscribe(
                (progress) => { /* Renaming */ },
                (error) => { file.isError = true; file.isRunning = false; },
                () => {
                    file.xhr = null;
                    let currentFileInRef = this.Ref.find((elem) => { return elem.id == file.id })
                    currentFileInRef.name = file.fileNameDisplay + file.fileExtension;
                });
        }
    }
}