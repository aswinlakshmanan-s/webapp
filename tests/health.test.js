require('dotenv').config();
const request = require('supertest');
const { sequelize, HealthCheck } = require('../models');
const app = require('../app');

describe('API Tests', () => {
    beforeAll(async () => {
        try {
            await sequelize.sync({ force: true })
            await sequelize.authenticate();
        } catch (error) {
            console.log(error)
        }
    }
    );
    afterEach(async () => {
        try {
            if (sequelize.connectionManager.pool) {
                await sequelize.authenticate();
                await HealthCheck.destroy({ truncate: true, cascade: true });
            }
        } catch (error) {
            console.log(error)
        }
    });
    afterAll(async () => {
        try {
            if (sequelize.connectionManager.pool) {
                await sequelize.close()
            }
        } catch (error) {
            console.log(error)
        }
    });

    describe('GET /healthz', () => {

        it('Should return 200 OK and create a health check record', async () => {
            const res = await request(app).get('/healthz');
            expect(res.status).toBe(200);

            const recordCount = await HealthCheck.count();
            expect(recordCount).toBe(1);
        });

        const invalidRequests = [
            { name: 'with body data', request: request(app).get('/healthz').send({ key: 'value' }) },
            { name: 'with query params', request: request(app).get('/healthz').query({ param: 'test' }) },
            { name: 'with invalid content-length', request: request(app).get('/healthz').set('Content-Length', '1') }
        ];

        invalidRequests.forEach(({ name, request }) => {
            it(`Should return 400 Bad Request ${name}`, async () => {
                const res = await request;
                expect(res.status).toBe(400);

                const recordCount = await HealthCheck.count();
                expect(recordCount).toBe(0);
            });
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
