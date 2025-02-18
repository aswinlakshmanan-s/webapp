require('dotenv').config();
const request = require('supertest');
const { sequelize, HealthCheck } = require('../models');
const app = require('../app');

describe('API Tests', () => {
    beforeAll(async () => {
        try {
            await sequelize.authenticate();
            await sequelize.sync({ force: true });
            console.log("Database connected successfully.");
        } catch (error) {
            console.error("Database connection failed:", error);
            process.exit(1);
        }
    });

    afterEach(async () => {
        try {
            await sequelize.authenticate();
            await HealthCheck.destroy({ truncate: true, cascade: true });
        } catch (error) {
            console.log("Error during cleanup:", error);
        }
    });

    afterAll(async () => {
        try {
            console.log("Closing database connection...");
            await sequelize.close();
            console.log("Database connection closed.");
        } catch (error) {
            console.log("Error closing connection:", error);
        }
    });

    describe('GET /healthz', () => {
        it('Should return 200 OK and create a health check record', async () => {
            const res = await request(app).get('/healthz');
            console.log("DEBUG: Response status:", res.status);

            expect(res.status).toBe(200);
            expect(await HealthCheck.count()).toBe(1);
        });

        it('Should return 400 Bad Request with body data', async () => {
            const res = await request(app).get('/healthz').send({ key: 'value' });
            expect(res.status).toBe(400);
        });

        it('Should return 400 Bad Request with query params', async () => {
            const res = await request(app).get('/healthz').query({ param: 'test' });
            expect(res.status).toBe(400);
        });

        it('Should return 400 Bad Request with invalid content-length', async () => {
            const res = await request(app).get('/healthz').set('Content-Length', '1');
            expect(res.status).toBe(400);
        });
    });

    describe('Invalid Methods & Routes', () => {
        ['post', 'put', 'patch', 'delete'].forEach(method => {
            it(`returns 405 for ${method.toUpperCase()}`, async () => {
                await request(app)[method]('/healthz').expect(405);
            });
        });

        it('returns 404 for unknown route', async () => {
            await request(app).get('/unknown').expect(404);
        });
        it('Returns 503 on DB error (connection failure)', async () => {
            await sequelize.close(); // Simulate database failure
            const res = await request(app).get('/healthz').set('Content-Length', '0').expect(503);
        });
    });
});
