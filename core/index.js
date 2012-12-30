console.log('loading arrow/core/index.js');

var company = {}
  company.insert = function(what) 
    {
      console.log('test inserted ' + what);
    }

  company.functwo = function(what) 
    {
      console.log('test inside functwo: ' + what);
    }

module.exports = company;


