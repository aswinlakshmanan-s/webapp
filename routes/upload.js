const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const { File } = require('../models'); // Assuming a 'File' model for metadata storage
const router = express.Router();

// AWS S3 configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Set up multer storage for in-memory uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST /v1/file - Upload a file
router.post('/', upload.single('profilePic'), async (req, res) => {
    const { file } = req;

    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // Upload file to S3
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${Date.now()}-${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read'
        };

        const s3Response = await s3.upload(params).promise();

        // Save file metadata in the database
        const newFile = await File.create({
            fileName: file.originalname,
            fileUrl: s3Response.Location,
            fileKey: s3Response.Key,
            fileSize: file.size,
            uploadDate: new Date().toISOString(),
            userId: req.user.id // Assuming `user.id` is available, you may need authentication
        });

        // Return file information
        res.status(201).json({
            file_name: newFile.fileName,
            id: newFile.id,
            url: newFile.fileUrl,
            upload_date: newFile.uploadDate,
            user_id: newFile.userId
        });

    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ message: 'Error uploading file' });
    }
});

// GET /v1/file - Retrieve file details
router.get('/', async (req, res) => {
    const { fileId } = req.query;

    if (!fileId) {
        return res.status(400).json({ message: 'File ID is required' });
    }

    try {
        const file = await File.findOne({ where: { id: fileId } });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.status(200).json({
            file_name: file.fileName,
            id: file.id,
            url: file.fileUrl,
            upload_date: file.uploadDate,
            user_id: file.userId
        });

    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).json({ message: 'Error fetching file' });
    }
});

// DELETE /v1/file - Delete a file
router.delete('/', async (req, res) => {
    const { fileId } = req.query;

    if (!fileId) {
        return res.status(400).json({ message: 'File ID is required' });
    }

    try {
        const file = await File.findOne({ where: { id: fileId } });

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
