const classifyTicket = require('../path/to/classifyTicket');
const { expect } = require('chai');

describe('classifyTicket function', () => {
  it('should classify payment issues as Finance', () => {
    const result = classifyTicket('Problem med betalning');
    expect(result).to.equal(1);
  });

  it('should classify technical issues as Tech Support', () => {
    const result = classifyTicket('Teknisk support krävs');
    expect(result).to.equal(2);
  });
});