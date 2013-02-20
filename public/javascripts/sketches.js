(function (global) {

  if (!global.jQuery) {
    throw new Error('missing jquery!!!');
  }

  var running = false
    , $ = global.jQuery
    , procInstance;

  function init() {

    $('.sketch-control.sketch-run-local').click(function(e) {
      e.preventDefault();
      var $this =$(this)
      ,   sketch_li = $this.parents('li')
      ,   sketch_code = sketch_li.data("sketch-code");

      loadSketch(sketch_code);
    });

    $('.sketch-control.sketch-run-remote').click(function(e) {
      e.preventDefault();
      var $this =$(this)
      ,   sketch_li = $this.parents('li')
      ,   sketch_name = sketch_li.data("sketch-name")
      ,   sketch_code = sketch_li.data("sketch-code");

      alert("Can't run '" + sketch_name + "' remote, yet..");
    });

    $('.sketch-control.sketch-open').click(function(e) {
      e.preventDefault();
      var $this =$(this)
      ,   sketch_li = $this.parents('li')
      ,   sketch_name = sketch_li.data("sketch-name");

      window.location = "/sketches/" + sketch_name;
    });
  }

  function loadSketch(code) {

    if (procInstance) { reset(procInstance);}

    procInstance = runProcessingCode(code);

  }

  $(document).ready(init);


})(window);
