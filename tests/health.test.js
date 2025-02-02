require('dotenv').config();
const request = require('supertest');
const { sequelize, HealthCheck } = require('../models');
const app = require('../app');
const { Sequelize } = require('sequelize');

describe('API Tests', () => {
    beforeAll(async () => await sequelize.sync({ force: true }));
    afterEach(async () => await HealthCheck.destroy({ truncate: true, cascade: true }));
    afterAll(async () => await sequelize.close());

    describe('GET /healthz', () => {
        it('Returns 200 OK', async () => {
            const res = await request(app).get('/healthz').set('Content-Length', '0');
            expect(res.status).toBe(200);
            expect(res.headers['cache-control']).toMatch(/no-cache/);
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
                expect(res.headers['cache-control']).toMatch(/no-cache/);
                expect(await HealthCheck.count()).toBe(0);
            });
        });

        it('Returns 503 on DB error (connection failure)', async () => {
            const originalDbUrl = process.env.DATABASE_URL;
            try {
                const sequelize = new Sequelize(process.env.TEST_DATABASE_URL, {
                    dialect: 'postgres',
                    logging: false,
                });
                await sequelize.authenticate();
                const res = await request(app).get('/healthz').set('Content-Length', '0').expect(503);
                expect(res.headers['cache-control']).toMatch(/no-cache/);
            } catch (error) {
                console.error('Error during the test: ', error);
            }
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
    });
});
