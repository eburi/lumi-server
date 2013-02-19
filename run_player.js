phantom = require("phantom");

phantom.create(function(ph) {
  ph.createPage(function(page){
    page.open("http://localhost:3000/player.html", function(status){
      console.log(status);
    });
  });
});
