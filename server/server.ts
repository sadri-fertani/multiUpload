import * as express from 'express'
import * as cors from 'cors'                                            // A node.js package that provides an Express/Connect middleware to enable Cross Origin Resource Sharing (CORS)
import * as path from 'path'
import * as bodyParser from 'body-parser'

import { router } from './routes';                                      // Get our API routes

const app = express();
app.use(cors());

app.use(bodyParser.json());         // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

// Point static path to dist
app.use(express.static(path.join(__dirname, '../dist')));

// Set our api routes
app.use('/api', router);

// Catch all other routes and return the index file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(4200, function () {
    console.log('API : listening on port 4200!');
});