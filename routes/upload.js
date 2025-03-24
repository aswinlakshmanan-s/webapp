const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const { File } = require('../models');
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
require('dotenv').config();
const logger = require('../logger');
const statsd = require('../metrics');

const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
});

const bucketName = process.env.AWS_BUCKET_NAME;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', upload.single('profilePic'),
    (err, req, res, next) => {
        if (err instanceof multer.MulterError) {
            if (err.field !== 'profilePic') {
                logger.error("Multer error: Invalid field", { error: err });
                return res.status(400).json({ error: 'Invalid field name. Only "profilePic" is allowed' });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                logger.error("Multer error: Multiple files detected", { error: err });
                return res.status(400).json({ error: 'Multiple files detected in profilePic field' });
            }
            logger.error("Multer error", { error: err });
            return res.status(400).json({ error: err.message });
        }
        next();
    }, async (req, res) => {
        const { file } = req;

        if (!file) {
            logger.warn("No file uploaded");
            return res.status(400).json({ message: 'No file uploaded' });
        }

        try {
            const fileId = uuidv4();
            const sanitizedFileName = file.originalname.replace(/\s+/g, '_');
            const fileKey = `${fileId}/${sanitizedFileName}`;
            const fileUrl = `https://${bucketName}.s3.amazonaws.com/${fileKey}`;

            const startS3 = Date.now();
            const params = {
                Bucket: bucketName,
                Key: fileKey,
                Body: file.buffer,
                ContentType: file.mimetype
            };

            await s3.upload(params).promise();
            const s3UploadTime = Date.now() - startS3;
            statsd.timing('aws.s3.upload.timer', s3UploadTime);
            logger.info("File uploaded to S3", { s3UploadTime });

            const newFile = await File.create({
                id: fileId,
                fileName: file.originalname,
                fileUrl: fileUrl,
                fileKey: fileKey,
                fileSize: file.size,
                uploadDate: new Date().toISOString()
            });

            res.status(201).json({
                file_name: newFile.fileName,
                id: newFile.id,
                url: newFile.fileUrl,
                upload_date: newFile.uploadDate
            });

            statsd.increment('api.file_upload.count');
        } catch (error) {
            logger.error("File upload error", error);
            res.status(500).json({ message: 'Error uploading file' });
        }
    });

router.get('/:id', async (req, res) => {
    if (req.is('multipart/form-data')) {
        logger.warn("Multipart form-data not allowed for GET file");
        return res.status(400).json({ error: 'Form-data (multipart/form-data) is not allowed' });
    }

    if (req.query && Object.keys(req.query).length > 0) {
        logger.warn("Query parameters not allowed for GET file");
        return res.status(400).json({ error: 'Query parameters are not allowed' });
    }

    if (req.headers['content-length'] && parseInt(req.headers['content-length'], 10) > 0) {
        logger.warn("Unexpected payload in GET file request");
        return res.status(400).send();
    }
    const { id } = req.params;

    if (!id) {
        logger.warn("File ID is missing in GET request");
        return res.status(400).json({ message: 'File ID is required' });
    }

    try {
        const file = await File.findOne({ where: { id } });

        if (!file) {
            logger.warn("File not found", { fileId: id });
            return res.status(404).json({ message: 'File not found' });
        }

        res.status(200).json({
            file_name: file.fileName,
            id: file.id,
            url: file.fileUrl,
            upload_date: file.uploadDate
        });

        statsd.increment('api.file_get.count');
    } catch (error) {
        logger.error("Error fetching file", error);
        res.status(500).json({ message: 'Error fetching file' });
    }
});

router.delete('/:id', async (req, res) => {
    if (req.is('multipart/form-data')) {
        logger.warn("Multipart form-data not allowed for DELETE file");
        return res.status(400).json({ error: 'Form-data (multipart/form-data) is not allowed' });
    }

    if (req.query && Object.keys(req.query).length > 0) {
        logger.warn("Query parameters not allowed for DELETE file");
        return res.status(400).json({ error: 'Query parameters are not allowed' });
    }

    if (req.headers['content-length'] && parseInt(req.headers['content-length'], 10) > 0) {
        logger.warn("Unexpected payload in DELETE file request");
        return res.status(400).send();
    }
    const { id } = req.params;

    if (!id) {
        logger.warn("File ID is missing in DELETE request");
        return res.status(400).json({ message: 'File ID is required' });
    }

    try {
        const file = await File.findOne({ where: { id } });

        if (!file) {
            logger.warn("File not found for deletion", { fileId: id });
            return res.status(404).json({ message: 'File not found' });
        }

        const startS3Delete = Date.now();
        const params = {
            Bucket: bucketName,
            Key: file.fileKey
        };

        await s3.deleteObject(params).promise();
        const s3DeleteTime = Date.now() - startS3Delete;
        statsd.timing('aws.s3.delete.timer', s3DeleteTime);
        logger.info("File deleted from S3", { s3DeleteTime });

        await file.destroy();

        res.status(204).send();
        statsd.increment('api.file_delete.count');
    } catch (error) {
        logger.error("Error deleting file", error);
        res.status(500).json({ message: 'Error deleting file' });
    }
});

module.exports = router;
