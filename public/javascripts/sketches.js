(function (global) {

  if (!global.jQuery) {
    throw new Error('missing jquery!!!');
  }

  var $ = global.jQuery
  , lumi = global.lumi
  , procInstance;

  function init() {

    $('.sketch-run-local').click(function(e) {
      e.preventDefault();
      var $this =$(this)
      ,   sketch_el = $this.parents('.sketch')
      ,   sketch_code = sketch_el.data("sketch-code")
      ,   allBtns = $('.sketch-run-local')
      ,   isPlay = ! $this.hasClass('active'); // .. about to become that
      ;

      if(isPlay) {
        allBtns.removeClass('active');
        allBtns.find('i').removeClass('icon-stop').addClass('icon-play');
        $this.find('i').removeClass('icon-play').addClass('icon-stop');
        playSketch(sketch_code);
      } else {
        stopSketch();
        $this.find('i').removeClass('icon-stop').addClass('icon-play');
      }
    });

    $('.sketch-run-remote').click(function(e) {
      e.preventDefault();
      var $this =$(this)
      ,   sketch_el   = $this.parents('.sketch')
      ,   sketch_name = sketch_el.data('sketch-name')
      ;
      lumi.runRemote(sketch_name);
    });

    $('.sketch-open').click(function(e) {
      e.preventDefault();
      var $this =$(this)
      ,   sketch_el   = $this.parents('.sketch')
      ,   sketch_name = sketch_el.data('sketch-name')

      window.location = "/sketches/" + sketch_name;
    });

    lumi.listenRemoteSketch(function(name, state, id){
      console.log("New State: " )
      var sketch_run_remote_button = $("div[data-sketch-name='" + name + "'] .sketch-run-remote");

      if(state == 'running') {
        sketch_run_remote_button.find('i').removeClass('icon-play').addClass('icon-refresh');
      } else {
        sketch_run_remote_button.removeClass('icon-refresh').addClass('icon-play');
      }
    });


		$('.sketch-del').click(function (e) {
			e.preventDefault();
      var $this =$(this)
      ,   sketch_el   = $this.parents('.sketch')
      ,   sketch_name = sketch_el.data('sketch-name')

      $("#delConfirmDialog").modal({ backdrop: true });
      $("#delConfirm").data('sketch-name',sketch_name);
		});

    $('#delConfirm').click(function(e){
	    e.preventDefault();
      var sketch_name = $(this).data('sketch_name');
			del(sketch_name);
      $("#delConfirmDialog").modal('hide');
    });
  }

	function del(name) {
    var sketch_name = $("#delConfirm").data('sketch-name');

		$.ajax({url: '/sketches/' + sketch_name, type: 'DELETE'})
			.fail(function () { alert('could not delete ' + name);})
			.done(function () {
				//success, so lets remove list element
        var sketch_el = $('.sketch[data-sketch-name="' + sketch_name + '"]');
        sketch_el.parents('tr').remove();
			});
	}

  function playSketch(code) {
    procInstance = runProcessingCode(code);
  }

  function stopSketch() {
    if (procInstance) {
      reset(procInstance);
    }
  }

  $(document).ready(init);
})(window);
