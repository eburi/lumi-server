(function (global) {

  if (!global.jQuery) {
    throw new Error('missing jquery!!!');
  }

  var running = false
    , $ = global.jQuery
    , procInstance;

  function init() {
    $('.tryButton').click(function (e){
      e.preventDefault();
      var $this = $(this)
        , code = $this.data('code');

      loadSketch(code);
    });
  }

  function loadSketch(code) {

    if (procInstance) { reset(procInstance);}
    
    procInstance = runProcessingCode(code);

  }

  $(document).ready(init);


})(window);




