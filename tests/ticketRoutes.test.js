const request = require('supertest');
const app = require('../index');

describe('GET /proj/tickets', () => {
  it('should return a list of tickets', async () => {
    const res = await request(app)
      .get('/proj/tickets')
      .set('Accept', 'application/json');
    
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('tickets');
  });
});
