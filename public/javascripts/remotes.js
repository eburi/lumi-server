(function (global) {

  if (!global.jQuery) {
    throw new Error('missing jquery!!!');
  }

  var $ = global.jQuery
    , lumi = global.lumi;

  function init() {

    $('.sketch-control.sketch-stop').click(function(e) {
      e.preventDefault();
      var $this =$(this)
      ,   sketch_id = $this.data('id');

      lumi.stopRemoteById(sketch_id);
//      window.location.reload();
    });

    $('.sketch-control.sketch-stop-all').click(function(e) {
      e.preventDefault();
      lumi.stopRemoteAll();
//      window.location.reload();
    });
  }

  $(document).ready(init);

})(window);
