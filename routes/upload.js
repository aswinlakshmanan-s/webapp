const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const { File } = require('../models');
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
require('dotenv').config({ path: '/opt/csye6225/webapp/.env' });
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
            logger.error("Multer encountered an error during file upload.", { error: err.message, stack: err.stack });
            if (err.field !== 'profilePic') {
                return res.status(400).json({ error: 'Invalid field name. Only "profilePic" is allowed.' });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({ error: 'Multiple files detected in the "profilePic" field.' });
            }
            return res.status(400).json({ error: err.message });
        }
        next();
    }, async (req, res) => {
        logger.info("Initiating file upload request.");
        const { file } = req;
        if (!file) {
            logger.warn("No file was provided in the upload request.");
            return res.status(400).json({ message: 'No file uploaded.' });
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

            logger.info("Uploading file to S3.", { bucket: bucketName, fileKey });
            await s3.upload(params).promise();
            const s3UploadTime = Date.now() - startS3;
            statsd.timing('aws.s3.upload.timer', s3UploadTime);
            logger.info("File successfully uploaded to S3.", { uploadTimeMs: s3UploadTime });

            logger.info("Saving file metadata to the database.");
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
            logger.error("Error occurred during file upload process.", { error: error.message, stack: error.stack });
            res.status(500).json({ message: 'Error uploading file.' });
        }
    });

router.get('/:id', async (req, res) => {
    logger.info("Received GET request for file retrieval.", { params: req.params });
    if (req.is('multipart/form-data')) {
        logger.warn("Multipart form-data is not allowed in GET file requests.");
        return res.status(400).json({ error: 'Multipart form-data is not allowed.' });
    }
    if (req.query && Object.keys(req.query).length > 0) {
        logger.warn("Query parameters are not permitted in GET file requests.");
        return res.status(400).json({ error: 'Query parameters are not allowed.' });
    }
    if (req.headers['content-length'] && parseInt(req.headers['content-length'], 10) > 0) {
        logger.warn("Unexpected payload detected in GET file request.");
        return res.status(400).send();
    }
    const { id } = req.params;
    if (!id) {
        logger.warn("File ID parameter is missing in GET request.");
        return res.status(400).json({ message: 'File ID is required.' });
    }
    try {
        const file = await File.findOne({ where: { id } });
        if (!file) {
            logger.warn("No file found in the database for the provided ID.", { fileId: id });
            return res.status(404).json({ message: 'File not found.' });
        }
        res.status(200).json({
            file_name: file.fileName,
            id: file.id,
            url: file.fileUrl,
            upload_date: file.uploadDate
        });
        statsd.increment('api.file_get.count');
    } catch (error) {
        logger.error("Error retrieving file from the database.", { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Error fetching file.' });
    }
});

router.delete('/:id', async (req, res) => {
    logger.info("Received DELETE request for file deletion.", { params: req.params });
    if (req.is('multipart/form-data')) {
        logger.warn("Multipart form-data is not allowed in DELETE file requests.");
        return res.status(400).json({ error: 'Multipart form-data is not allowed.' });
    }
    if (req.query && Object.keys(req.query).length > 0) {
        logger.warn("Query parameters are not permitted in DELETE file requests.");
        return res.status(400).json({ error: 'Query parameters are not allowed.' });
    }
    if (req.headers['content-length'] && parseInt(req.headers['content-length'], 10) > 0) {
        logger.warn("Unexpected payload in DELETE file request.");
        return res.status(400).send();
    }
    const { id } = req.params;
    if (!id) {
        logger.warn("File ID is missing in DELETE request.");
        return res.status(400).json({ message: 'File ID is required.' });
    }
    try {
        const file = await File.findOne({ where: { id } });
        if (!file) {
            logger.warn("File for deletion was not found in the database.", { fileId: id });
            return res.status(404).json({ message: 'File not found.' });
        }

        const startS3Delete = Date.now();
        const params = {
            Bucket: bucketName,
            Key: file.fileKey
        };

        logger.info("Initiating deletion of file from S3.", { bucket: bucketName, fileKey: file.fileKey });
        await s3.deleteObject(params).promise();
        const s3DeleteTime = Date.now() - startS3Delete;
        statsd.timing('aws.s3.delete.timer', s3DeleteTime);
        logger.info("File successfully deleted from S3.", { deletionTimeMs: s3DeleteTime });

        logger.info("Removing file metadata from the database.", { fileId: id });
        await file.destroy();

        res.status(204).send();
        statsd.increment('api.file_delete.count');
    } catch (error) {
        logger.error("Error occurred during file deletion process.", { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Error deleting file.' });
    }
});

module.exports = router;
