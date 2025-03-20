const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const { File } = require('../models'); // Sequelize Model
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
require('dotenv').config(); // Load environment variables from .env

// AWS S3 Configuration
const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
});

const bucketName = process.env.AWS_BUCKET_NAME; // S3 bucket name from .env

// Set up multer for in-memory uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST /v1/file - Upload a file to S3 and save metadata in the DB
router.post('/', upload.single('profilePic'),
    (err, req, res, next) => {
        console.log(req);
        if (err instanceof multer.MulterError) {
            if (err.field !== 'profilePic') {
                console.log(err);
                return res.status(400).json({ error: 'Invalid field name. Only "profilePic" is allowed' });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                console.log(err);
                return res.status(400).json({ error: 'Multiple files detected in profilePic field' });
            }
            return res.status(400).json({ error: err.message });
        }
        next();
    }, async (req, res) => {
        const { file } = req;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        try {
            const fileId = uuidv4(); // Generate a unique file ID (UUID)
            const sanitizedFileName = file.originalname.replace(/\s+/g, '_'); // Remove spaces
            const fileKey = `${fileId}/${sanitizedFileName}`; // Format: id/image-file-name.extension
            const fileUrl = `https://${bucketName}.s3.amazonaws.com/${fileKey}`;

            // Upload file to S3
            const params = {
                Bucket: bucketName,
                Key: fileKey,
                Body: file.buffer,
                ContentType: file.mimetype
            };

            await s3.upload(params).promise();

            // Save file metadata in the database
            const newFile = await File.create({
                id: fileId,  // Ensure UUID is correctly stored
                fileName: file.originalname,
                fileUrl: fileUrl,
                fileKey: fileKey,
                fileSize: file.size,
                uploadDate: new Date().toISOString()
            });

            // Return response in the required format
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

// GET /v1/file/{id} - Retrieve file details by ID
router.get('/:id', async (req, res) => {
    if (req.is('multipart/form-data')) {
        return res.status(400).json({ error: 'Form-data (multipart/form-data) is not allowed' });
    }

    if (req.query && Object.keys(req.query).length > 0) {
        return res.status(400).json({ error: 'Query parameters are not allowed' });
    }


    if (req.headers['content-length'] && parseInt(req.headers['content-length'], 10) > 0) {
        console.log('No Payload!!!');
        return res.status(400).send(); // Bad Request
    }
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
    if (req.is('multipart/form-data')) {
        return res.status(400).json({ error: 'Form-data (multipart/form-data) is not allowed' });
    }

    if (req.query && Object.keys(req.query).length > 0) {
        return res.status(400).json({ error: 'Query parameters are not allowed' });
    }


    if (req.headers['content-length'] && parseInt(req.headers['content-length'], 10) > 0) {
        console.log('No Payload!!!');
        return res.status(400).send(); // Bad Request
    }
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
            Bucket: bucketName,
            Key: file.fileKey
        };

        await s3.deleteObject(params).promise();

        // Delete file metadata from the database
        await file.destroy();

        res.status(204).send();  // No Content (successful deletion)
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ message: 'Error deleting file' });
    }
});

module.exports = router;
