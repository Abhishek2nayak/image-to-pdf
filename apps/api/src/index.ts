import express from 'express';
import cors from  'cors';
import multer from 'multer';
import bodyParser from 'body-parser'
import * as z from 'zod'
import fs from 'node:fs'
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

/**
 * To upload a file using chunks  step by step 
 * 1. create a multer storage
 * 2. create an endpoint to upload the file
 * 3. handle the file upload in the endpoint
 *  - check the request should have a jobId
 *  - using that jobId create a folder to store the file chunks
 *   - for each chunk received, store it in the folder created for that jobId
 *  - keep track of the number of chunks received
 *  - once all chunks are received, merge the chunks to create the final file
 *  - delete the chunks after merging
 *  - receive the file chunks from the client
 *  - store the chunks temporarily
 *  - merge the chunks once all chunks are received
 *  - delete the temporary chunks
 * 4. save the file to the server
 * 5. return a response to the client
 */


const fileSchema  = z.object({
    jobId : z.string().trim(),
    originalFileName : z.string().trim(),
    totalChunks  : z.number(),
    chunkIndex : z.number()
})


type UploadFileSchema  = z.infer<typeof fileSchema>;



async function mergeAllChunks(
    chunkFilePath : string,
    ext : string,
    totalChunks : number
) {
    const MERGE_FILE_PATH = './files';
    
    const isFolderExist = fs.existsSync(MERGE_FILE_PATH);

    if(!isFolderExist) {
        // create a folder if not exits 
        fs.mkdirSync(MERGE_FILE_PATH)
     }

     //create  a write stream where we can upload the the files 
     const writeStream = fs.createWriteStream(MERGE_FILE_PATH);
     for(let i = 0; i <=totalChunks; i++) {
        const currentChunkPath = `${chunkFilePath}-${i}`;
        const chunkBuffer = fs.readFileSync(currentChunkPath);
        writeStream.write(chunkBuffer);
        //  delete the chunk file 
        fs.unlinkSync(currentChunkPath)
     }

     writeStream.end()


}
async function uploadChunkFile({chunkIndex , jobId , originalFileName , totalChunks} : UploadFileSchema, file :  Buffer<ArrayBufferLike>) {
    const CHUNK_FILE_PATH = `/chunks/${jobId}`;

    const isLast = totalChunks === chunkIndex;

    try {
     const isFolderExist = fs.existsSync(CHUNK_FILE_PATH);
     if(!isFolderExist) {
        // create a folder if not exits 
        fs.mkdirSync(CHUNK_FILE_PATH)
     }

     // now here we have the folder where we can put ours chunks 

     const chunkName = `${originalFileName}-${chunkIndex}`;
    
     // now write that file to the chunk folder 

     fs.writeFile(chunkName , file,async (error) =>  {
        if(error) {
            throw new Error("Failed to upload chunks")
        }

        if(isLast) {
         await  mergeAllChunks(CHUNK_FILE_PATH , '.jpg',  totalChunks);

        } 


     })

    } catch(error) {

    }
}


app.post('/uploads', upload.single('file'), (req , res) => {
    try {
        const  validBody = fileSchema.safeParse(req.body)

        if(validBody.error) {
            return res.status(400).json({
                error : "Please send valid value ",
                success : false 
            })
        }
    
        const {chunkIndex , jobId ,originalFileName , totalChunks } = validBody.data;
    
        const fileBuffer = req.file?.buffer;

        if(!fileBuffer) {
            return res.status(400).json({
                error : "no file uploaded" , 
                success : false                 
            })
        }
        uploadChunkFile({
            chunkIndex , 
            jobId , 
            originalFileName , 
            totalChunks
        },fileBuffer)
    
    }
  




})


app.listen(3000 ,() => {
    console.log("server running on the port " + 3000)
})
