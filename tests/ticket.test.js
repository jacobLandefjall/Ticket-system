const { classifyTicket } = require('../index.js'); // Byt till CommonJS require
const { expect } = require('chai');

describe('classifyTicket function', () => {
  it('should classify payment issues as Finance', () => {
    const result = classifyTicket('Finance problem');
    expect(result).to.equal(1); // Assuming 1 is Finance
  });

  it('should classify technical issues as Tech Support', () => {
    const result = classifyTicket('Tech support error');
    expect(result).to.equal(2); // Assuming 2 is Tech Support
  });

  it('should classify other issues as General Support', () => {
    const result = classifyTicket('Another problem');
    expect(result).to.equal(3); // Assuming 3 is General Support
  });
});
