const request = require('supertest');
const { app } = require('../index');
const { expect } = require('chai');
const sinon = require('sinon');

describe('Knowledge Base Tests', () => {
  let isAuthenticatedStub;

  before(() => {
    // Mocka autentisering
    isAuthenticatedStub = sinon.stub(app.request, 'isAuthenticated').returns(true);
    
    app.request.oidc = {
      user: { sub: 'auth0|123', name: 'Test User', roles: ['agent'] }
    };
  });

  after(() => {
    isAuthenticatedStub.restore();
  });

  it('should retrieve a list of knowledge base articles', async () => {
    const res = await request(app)
      .get('/proj/knowledgebase')
      .set('Accept', 'application/json');

    expect(res.status).to.equal(200);
    expect(res.text).to.include('Knowledge Base');
  });

  it('should create a new knowledge base article', async () => {
    const res = await request(app)
      .post('/proj/knowledgebase/create')
      .send({
        title: 'New Article',
        content: 'This is the content of the new article.'
      })
      .set('Accept', 'application/json');

    expect(res.status).to.equal(302);
    expect(res.headers.location).to.equal('/proj/knowledgebase'); 
  });

  it('should update an existing knowledge base article', async () => {
    const res = await request(app)
      .post('/proj/knowledgebase/update/1')
      .send({
        title: 'Updated Article',
        content: 'This is the updated content of the article.'
      })
      .set('Accept', 'application/json');

    expect(res.status).to.equal(302);
    expect(res.headers.location).to.equal('/proj/knowledgebase'); 
  });

  // Testa borttagning av en knowledge base artikel
  it('should delete a knowledge base article', async () => {
    const res = await request(app)
      .post('/proj/knowledgebase/delete/1')
      .set('Accept', 'application/json');

    expect(res.status).to.equal(302);
    expect(res.headers.location).to.equal('/proj/knowledgebase');
  });
});
