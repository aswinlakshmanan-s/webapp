const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const { File } = require('../models');
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
require('dotenv').config();

const { statsd, logger } = require('../logger');

const s3 = new AWS.S3({ region: process.env.AWS_REGION });
const bucketName = process.env.AWS_BUCKET_NAME;

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/',
    upload.single('profilePic'),
    (err, req, res, next) => {
        const correlationId = req.correlationId || 'N/A';
        if (err) {
            logger.error("Multer error in file upload", { error: err, correlationId });
            if (err instanceof multer.MulterError) {
                if (err.field !== 'profilePic') {
                    return res.status(400).json({ error: 'Invalid field name. Only "profilePic" is allowed', correlationId });
                }
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json({ error: 'Multiple files detected in profilePic field', correlationId });
                }
                return res.status(400).json({ error: err.message, correlationId });
            }
            return res.status(500).json({ error: 'File upload error', correlationId });
        }
        next();
    },
    async (req, res) => {
        const correlationId = req.correlationId || 'N/A';
        const { file } = req;
        if (!file) {
            logger.warn("No file uploaded", { correlationId });
            return res.status(400).json({ message: 'No file uploaded', correlationId });
        }
        try {
            logger.info("Starting file upload process", { correlationId });
            const fileId = uuidv4();
            const sanitizedFileName = file.originalname.replace(/\s+/g, '_');
            const fileKey = `${fileId}/${sanitizedFileName}`;
            const fileUrl = `https://${bucketName}.s3.amazonaws.com/${fileKey}`;

            const s3Start = Date.now();
            const params = {
                Bucket: bucketName,
                Key: fileKey,
                Body: file.buffer,
                ContentType: file.mimetype
            };

            await s3.upload(params).promise();
            const s3Duration = Date.now() - s3Start;
            statsd.timing('s3.upload.duration', s3Duration, { correlationId });
            logger.info("S3 upload completed", { fileName: file.originalname, duration: s3Duration, correlationId });

            const newFile = await File.create({
                id: fileId,
                fileName: file.originalname,
                fileUrl: fileUrl,
                fileKey: fileKey,
                fileSize: file.size,
                uploadDate: new Date().toISOString()
            });
            logger.info("File metadata saved", { fileName: newFile.fileName, correlationId });
            res.status(201).json({
                file_name: newFile.fileName,
                id: newFile.id,
                url: newFile.fileUrl,
                upload_date: newFile.uploadDate,
                correlationId
            });
        } catch (error) {
            logger.error("File upload error", { error, correlationId });
            res.status(500).json({ message: 'Error uploading file', correlationId });
        }
    }
);

router.get('/:id', async (req, res) => {
    const correlationId = req.correlationId || 'N/A';
    try {
        const { id } = req.params;
        if (!id) {
            logger.warn("GET request without file ID", { correlationId });
            return res.status(400).json({ message: 'File ID is required', correlationId });
        }
        const file = await File.findOne({ where: { id } });
        if (!file) {
            logger.warn(`File not found for ID: ${id}`, { correlationId });
            return res.status(404).json({ message: 'File not found', correlationId });
        }
        logger.info("File retrieved", { fileName: file.fileName, correlationId });
        res.status(200).json({
            file_name: file.fileName,
            id: file.id,
            url: file.fileUrl,
            upload_date: file.uploadDate,
            correlationId
        });
    } catch (error) {
        logger.error("Error fetching file", { error, correlationId });
        res.status(500).json({ message: 'Error fetching file', correlationId });
    }
});

router.delete('/:id', async (req, res) => {
    const correlationId = req.correlationId || 'N/A';
    try {
        const { id } = req.params;
        if (!id) {
            logger.warn("DELETE request without file ID", { correlationId });
            return res.status(400).json({ message: 'File ID is required', correlationId });
        }
        const file = await File.findOne({ where: { id } });
        if (!file) {
            logger.warn(`File not found for deletion with ID: ${id}`, { correlationId });
            return res.status(404).json({ message: 'File not found', correlationId });
        }
        logger.info("Starting deletion for file", { fileName: file.fileName, correlationId });

        const s3Start = Date.now();
        const params = {
            Bucket: bucketName,
            Key: file.fileKey
        };
        await s3.deleteObject(params).promise();
        const s3DeleteDuration = Date.now() - s3Start;
        statsd.timing('s3.delete.duration', s3DeleteDuration, { correlationId });
        logger.info("S3 deletion completed", { fileName: file.fileName, duration: s3DeleteDuration, correlationId });

        await file.destroy();
        logger.info("File metadata deleted", { fileName: file.fileName, correlationId });
        res.status(204).json({ correlationId });
    } catch (error) {
        logger.error("Error deleting file", { error, correlationId });
        res.status(500).json({ message: 'Error deleting file', correlationId });
    }
});

module.exports = router;
