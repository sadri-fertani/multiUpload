import * as express from 'express';
import * as multer from 'multer'    // Node.js middleware for handling multipart/form-data.
import * as Loki from 'lokijs'      // LokiJs, a fast, in-memory document-oriented datastore for node.js, browser and cordova
import * as del from 'del'          // Delete files and folders
import * as fs from 'fs'
import * as path from 'path'
import * as lfsa from 'lokijs/src/loki-fs-structured-adapter.js';
import { Observable } from "rxjs/Rx";

const router = express.Router();

// setup
const DB_NAME = 'db.json';
const COLLECTION_NAME = 'files';
const UPLOAD_PATH = 'uploads';
const upload = multer({ dest: `${UPLOAD_PATH}/` });
let collectionDB: LokiCollection<any>;

const loadCollection = function (colName, db: Loki): Observable<LokiCollection<any>> {
    return Observable.create(observer => {
        try {
            db.loadDatabase({}, () => {
                collectionDB = db.getCollection(colName) || db.addCollection(colName);
                observer.complete();
            })
        }
        catch (err) {
            observer.error(err.message);
        }
    });
}

const lfsaAdapter = new lfsa();

const db = new Loki(
    `${UPLOAD_PATH}/${DB_NAME}`,
    {
        autosave: true,
        autosaveInterval: 4000,
        adapter: lfsaAdapter,
        persistenceMethod: 'fs'
    }
);

loadCollection(COLLECTION_NAME, db).subscribe(
    (progress) => {
        /* Connection en cours */
    },
    (error) => {
        console.log('Erreur : ', error);
    },
    () => {
        console.log('DATABASE READY');
    }
);

router.get('/files', async (req, res) => {
    try {
        res.send(collectionDB.data);
    } catch (err) {
        res.sendStatus(400);
    }
})

router.get('/files/:id', async (req, res) => {
    try {
        const result = collectionDB.get(req.params.id);
        if (!result) {
            res.sendStatus(404);
            return;
        };

        if (fs.existsSync(path.join(UPLOAD_PATH, result.filename))) {
            res.setHeader('Content-Type', result.mimetype);
            res.setHeader('Content-disposition', 'attachment; filename=' + result.originalname);
            fs.createReadStream(path.join(UPLOAD_PATH, result.filename)).pipe(res);
        } else {
            res.sendStatus(404);
            return;
        }
    } catch (err) {
        res.sendStatus(400);
    }
})

router.post('/file', upload.any(), async (req, res) => {
    try {
        let data = collectionDB.insertOne(req.files[0]);

        db.saveDatabase(
            () => {
                res.send({ id: data.$loki, fileName: data.filename, originalName: data.originalname });
            }
        );
    } catch (err) {
        res.sendStatus(400);
    }
})

router.post('/files/upload', upload.array('files', 12), async (req, res) => {
    try {
        let data = [].concat(collectionDB.insert(req.files));

        db.saveDatabase(() => {
            res.send(data.map(x => ({ id: x.$loki, fileName: x.filename, originalName: x.originalname })));
        });
    } catch (err) {
        res.sendStatus(400);
    }
})

router.delete('/files/:id', async (req, res) => {
    try {
        const result = collectionDB.get(req.params.id);

        if (!result) {
            res.sendStatus(404);
            return;
        };

        // delete file
        if (fs.existsSync(path.join(UPLOAD_PATH, result.filename))) {
            del.sync(path.join(UPLOAD_PATH, result.filename));
        }
        // delete from database
        collectionDB.remove({ "$loki": req.params.id });
        db.saveDatabase(() => {
            res.send({ success: 'ok' });
        })
    } catch (err) {
        res.sendStatus(400);
    }
})

router.patch('/files/:id', upload.fields([{ name: 'newFileName', maxCount: 1 }]), async (req, res) => {
    try {
        const result = collectionDB.get(req.params.id);

        if (!result) {
            res.sendStatus(404);
            return;
        };

        // delete from database
        collectionDB.findAndUpdate((obj) => { return obj.$loki == Number(req.params.id) }, (obj) => { obj.originalname = req.body.newFileName });
        db.saveDatabase(() => {
            res.send({ success: 'ok' });
        })
    } catch (err) {
        res.sendStatus(400);
    }
})

export { router }