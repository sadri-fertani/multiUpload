import * as Path from 'path'
import { Injectable } from '@angular/core';

@Injectable()
export class Utils {
    public toBoolean(value: any): boolean {
        return (value == 'true' || value == 'True' || value === true);
    }

    public round(value: number): number {
        return Math.round(value * 100) / 100; // /* Merci la virgule flottante, but i'm your father ;-) */
    }

    // Convertit une taille en bytes en taille lisible en KB/MB/GB...
    // @param {Number} bytes
    // @param {Number} decimals
    // @return {String} Taille de format lisible
    public formatBytes(bytes: number, decimals?: number): string {
        if (bytes == 0)
            return '0 Byte';
        var kilo = 1024;
        var decimal = decimals || 2;
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var i = Math.floor(Math.log(bytes) / Math.log(kilo));
        return parseFloat((bytes / Math.pow(kilo, i)).toFixed(decimal)) + ' ' + sizes[i];
    }

    // Récupérer le nom d'un fichier sans l'extension
    // @param {String} fileName: Nom complet du fichier
    // @return {String} Nom du fichier sans extension
    public getFileNameWithoutExt(fileName: string): string {
        
        return fileName.replace(/\.[^/.]+$/, '');
    };

    // Récupérer l'extension d'un fichier
    // @param {String} fileName: Nom complet du fichier
    // @return {String} Extension du fichier
    public getFileExtension(fileName: string): string {
        return Path.extname(fileName);
    };
}

export enum Status {
    Waiting,   //0
    Uploading,  //1
    Editing
}