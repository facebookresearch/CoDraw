/*
 Copyright (c) 2017-present, Facebook, Inc.
 All rights reserved.

 This source code is licensed under the license found in the
 LICENSE file in the root directory of this source tree.
*/

$('#session').change(function() {
    var val = $('#session option:selected').val()
    window.location.href="?session="+encodeURIComponent(val);
});
$(document).ready(function() {
    init(function(data) {
        console.log(data);
        visualizeDialog(data);
        $('[data-toggle="tooltip"]').tooltip();
        AbsOrg = jQuery.extend(true, {}, Abs);
        AbsOrg.init(true,null,'original_canvas');
        var data = $('#original_canvas').attr('value');
        AbsOrg.update_clipArt_status(data, true, function(){
            // console.log('callback');
            Abs.init(true,null,'scene_canvas');
            $('.chat-msg').hover(function() {
                var val = $(this).attr('scene');
                // var time = $(this).attr('time');
                var time = 'Empty';
                Abs.update_clipArt_status(val, true, function(){
                    showCliparts();
                });
                var score = AbsUtil.SDM(data, val);
                var max_score = AbsUtil.SDM(data, data);
                if (score && score.length > 0) {
                    time = //' &nbsp;&nbsp; ' + 
                        'Score: ' + score[0].toPrecision(3) + '/' + max_score[0].toPrecision(3);
                    var tooltip = AbsUtil.toString(score);
                    $('#scene-time').attr('title',tooltip);
                    $('#scene-time').tooltip('fixTitle');
                } else {
                    $('#scene-time').attr('title','');
                    $('#scene-time').tooltip('fixTitle');
                }
                $('#scene-time').html(time);
                $('.chat-msg').removeClass('active');
                $(this).addClass('active');
            });
            if ($('#fin')) $('#fin').mouseenter();
        });
        // pager
        $('.pager a').click(function() {
            var href = $(this).attr('href');
            window.location.href = href;
        });
        // register handlers
        // registerActionHandlers();
        // rearrange peep slot
        showPeep();
    });
    setTimeout(initSessionList, 0);
});
var showCliparts = function() {
    var s, cont = ''
    if ($('#fin')) s = $('#fin').attr('scene');
    var filenames = Abs.get_clipArt_filenames(s);
    if (!filenames) return;
    for (var i = 0; i < filenames.length; i++) {
        var filename = filenames[i];
        cont += '<img class="clipart" src="'+filename+'"/>';
    }
    $('#cliparts').html(cont);
};
$(document).keyup(function(e) {
    if ((e.keyCode ? e.keyCode : e.which)==37) {  // <-
        $('.pager .previous a').click();
    } else if ((e.keyCode ? e.keyCode : e.which)==39) {  // ->
        $('.pager .next a').click();
    }
});
var api = function(uid,key,val) {
    $.ajax({
        url:'/api?uid='+encodeURIComponent(uid)+'&key='+key+'&val='+val
    }).done(function() {
        location.reload();
    });
}
var showPeep = function() {
    var target;
    var source = $('#peep')
    $('.chat-msg').each(function(i,e) {
        e=$(e);
        if (e.attr('timestamp') && $('#peep') && e.attr('timestamp') > source.attr('timestamp')) {
            return;
        }
        target = e;
    });
    source.insertAfter(target);
}
var registerActionHandlers = function() {
    var drawerId = $('.drawer-action').attr('id');
    var tellerId = $('.teller-action').attr('id');
    $('.drawer-action .btn-reject').click(function() {
        api(drawerId, 'approve', 'reject');
    });
    $('.drawer-action .btn-reviewReject').click(function() {
        api(drawerId, 'approve', 'reviewReject');
    });
    $('.drawer-action .btn-notApprove').click(function() {
        api(drawerId, 'approve', 'notApprove');
    });
    $('.drawer-action .btn-approve').click(function() {
        api(drawerId, 'approve', 'approve');
    });
    $('.drawer-action .btn-bonus').click(function() {
        api(drawerId, 'bonus', $('.drawer-action .btn-bonus').attr('toggle-value'));
    });

    $('.teller-action .btn-reject').click(function() {
        api(tellerId, 'approve', 'reject');
    });
    $('.teller-action .btn-reviewReject').click(function() {
        api(tellerId, 'approve', 'reviewReject');
    });
    $('.teller-action .btn-notApprove').click(function() {
        api(tellerId, 'approve', 'notApprove');
    });
    $('.teller-action .btn-approve').click(function() {
        api(tellerId, 'approve', 'approve');
    });
    $('.teller-action .btn-bonus').click(function() {
        api(tellerId, 'bonus', $('.teller-action .btn-bonus').attr('toggle-value'));
    });
}
