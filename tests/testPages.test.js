const request = require('supertest');
const { app } = require('../index');
const { expect } = require('chai');

describe('GET /proj/home', () => {

  it('should redirect unauthenticated users to login', async () => {
    const res = await request(app)
      .get('/proj/home')
      .set('Accept', 'text/html');

    expect(res.status).to.equal(302);  // Kontrollera att statuskoden är 302 (omdirigering)
    expect(res.headers.location).to.include('/login');  // Kontrollera att omdirigeringen går till inloggningssidan
  });
});
