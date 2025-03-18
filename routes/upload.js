const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const { File } = require('../models');
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
// AWS S3 configuration
const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Add access key
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY // Add secret key
});

// Set up multer storage for in-memory uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST /v1/file - Upload a file
router.post('/', upload.single('profilePic'), async (req, res) => {
    const { file } = req;
    console.log("here")
    const file_id = uuidv4()
    console.log(file)
    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // Upload file to S3
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file_id,
            Body: file.buffer,
            ContentType: file.mimetype
        };

        const s3Response = await s3.upload(params).promise();

        // Save file metadata in the database
        const newFile = await File.create({
            fileName: file.originalname,
            fileUrl: s3Response.Location,
            fileKey: s3Response.Key,
            fileSize: file.size,
            uploadDate: new Date().toISOString()
        });

        // Return file information
        res.status(201).json({
            file_name: newFile.fileName,
            id: newFile.id,
            url: newFile.fileUrl,
            upload_date: newFile.uploadDate
        });

    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ message: 'Error uploading file' });
    }
});

// GET /v1/file - Retrieve all files
router.get('/', async (req, res) => {
    try {
        const files = await File.findAll();

        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'No files found' });
        }

        // Map files to the required response format
        const response = files.map(file => ({
            file_name: file.fileName,
            id: file.id,
            url: file.fileUrl,
            upload_date: file.uploadDate
        }));

        res.status(200).json(response);

    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ message: 'Error fetching files' });
    }
});

// GET /v1/file/{id} - Retrieve file details by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'File ID is required' });
    }

    try {
        const file = await File.findOne({ where: { id } });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.status(200).json({
            file_name: file.fileName,
            id: file.id,
            url: file.fileUrl,
            upload_date: file.uploadDate
        });

    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).json({ message: 'Error fetching file' });
    }
});

// DELETE /v1/file/{id} - Delete a file by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'File ID is required' });
    }

    try {
        const file = await File.findOne({ where: { id } });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Delete file from S3
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.fileKey
        };

        await s3.deleteObject(params).promise();

        // Delete file metadata from the database
        await file.destroy();

        res.status(204).send();  // No Content
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ message: 'Error deleting file' });
    }
});

module.exports = router;