import express from 'express';
import cors from  'cors';
import multer from 'multer';
import bodyParser from 'body-parser'
const app = express();

// MIDDLEWARE 
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended : true
}));


// create a multer storage 

const storage = multer.diskStorage({
    destination : (req , res, cb) => {
        cb(null , './uploads')
    },
    filename(req, file, callback) {
      callback(null , file.filename)  
    },
})


const upload = multer({
    storage : storage
})


app.post('/uploads', upload.single('file'), (req , res) => {
    console.log("req", req.body)
})


app.listen(3000 ,() => {
    console.log("server running on the port " + 3000)
})
