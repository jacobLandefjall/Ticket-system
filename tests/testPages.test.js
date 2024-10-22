const request = require('supertest');
const { app } = require('../index');
const { expect } = require('chai');
const sinon = require('sinon');

describe('GET /proj/home', () => {
  it('should redirect unauthenticated users to login', async () => {
    const res = await request(app)
      .get('/proj/home')
      .set('Accept', 'text/html');

    expect(res.status).to.equal(302);  // Check that the status code is 302 (redirect)
    expect(res.headers.location).to.include('https://dev-l8sk27fw0x2ngsvv.us.auth0.com');
  });
});

describe('GET /', () => {
  it('should redirect to /login if not authenticated', async () => {
    const res = await request(app).get('/');
    expect(res.status).to.equal(302);
    expect(res.headers.location).to.include('https://dev-l8sk27fw0x2ngsvv.us.auth0.com');
  });
});


describe('GET /proj/tickets', () => {
  let isAuthenticatedStub;

  before(() => {
    // Mock isAuthenticated to simulate an authenticated user
    isAuthenticatedStub = sinon.stub(app.request, 'isAuthenticated').returns(true);
  });

  after(() => {
    // Restore original behavior after tests
    isAuthenticatedStub.restore();
  });

  it('should return a list of tickets for authenticated user', async () => {
    const res = await request(app).get('/proj/tickets').send();
    expect(res.status).to.equal(200);  // Check if authenticated user can access tickets
    expect(res.body).to.be.an('object');  // Ensure tickets data is fetched correctly
  });
});

describe('POST /proj/category', () => {
  it('should create a category for an agent', async () => {
    const newCategory = { name: 'Networking' };
    const res = await request(app)
      .post('/proj/category')
      .send(newCategory);

    expect(res.status).to.equal(302);  // Expect a redirect after category creation
  });
});