require('dotenv').config();
const request = require('supertest');
const { sequelize, HealthCheck } = require('../models');
const app = require('../app');

describe('API Tests', () => {
    beforeAll(async () => {
        try {
            await sequelize.sync({ force: true })
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
        it('Returns 200 OK', async () => {
            const res = await request(app).get('/healthz').set('Content-Length', '0');
            expect(res.status).toBe(200);
            expect(await HealthCheck.count()).toBe(1);
        });

        const badRequests = [
            { name: 'body', setup: req => req.send({ key: 'value' }) },
            { name: 'query params', setup: req => req.query({ param: 'test' }) },
            { name: 'invalid content-length', setup: req => req.set('Content-Length', '1') }
        ];

        badRequests.forEach(({ name, setup }) => {
            it(`Returns 400 Bad Request (${name})`, async () => {
                const res = await setup(request(app).get('/healthz')).expect(400);
                expect(await HealthCheck.count()).toBe(0);
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
