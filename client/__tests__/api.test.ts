const request = require('supertest');
const app = require('../app'); // Adjust the path as necessary

describe('API Endpoints', () => {
	test('Unauthorized access to /api/groups/', async () => {
		const response = await request(app).delete('/api/groups/1'); // Adjust the ID as necessary
		expect(response.status).toBe(401);
	});

	test('Unauthorized access to /api/profile/', async () => {
		const response = await request(app).get('/api/profile/');
		expect(response.status).toBe(401);
	});

	test('Unauthorized access to /api/recommendations/', async () => {
		const response = await request(app).get('/api/recommendations/');
		expect(response.status).toBe(401);
	});
});