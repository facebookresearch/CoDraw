/*
 Copyright (c) 2017-present, Facebook, Inc.
 All rights reserved.

 This source code is licensed under the license found in the
 LICENSE file in the root directory of this source tree.
*/

var Abs = (function(){
    var Abs = {}; // Encapsuled object

    // Various variables setting up the appearence of the interface
    var CANVAS_WIDTH = 500;
    var CANVAS_HEIGHT = 400;
    var CANVAS_ROW = 116;
    var CANVAS_COL = 10;
    var CLIPART_WIDTH = 450;
    var CLIPART_HEIGHT = 450;
    var CLIPART_ROW = 62;
    var CLIPART_COL = CANVAS_WIDTH + 20;
    var CLIPART_BUFFER = 5;
    // Number of clipart to show of the children
    var NUM_CLIPART_VERT = 5;
    var NUM_CLIPART_HORZ = 2;
    var CLIPART_SKIP = CLIPART_WIDTH / NUM_CLIPART_VERT;
    var CLIPART_SIZE = CLIPART_SKIP - 2 * CLIPART_BUFFER;
    // Number of clip art to show of the other objects
    var NUM_CLIPART_VERT_SM = 6;
    var NUM_CLIPART_HORZ_SM = 3;
    var CLIPART_SKIP_SM = CLIPART_WIDTH / NUM_CLIPART_VERT_SM;
    var CLIPART_SIZE_SM = CLIPART_SKIP_SM - 2 * CLIPART_BUFFER;
    var CLIPART_OBJECT_COL = CLIPART_COL + CLIPART_SKIP * NUM_CLIPART_HORZ + 4;
    // Button size
    var BUTTON_COL = 50;
    var BUTTON_ROW = 54;
    var NOT_USED = -10000;
    var NUM_SCENES_TO_COMPLETE = 3;

    var numClipart = NUM_CLIPART_VERT * NUM_CLIPART_HORZ + NUM_CLIPART_VERT_SM * NUM_CLIPART_HORZ_SM;
    var wasOnCanvas = false;
    // The relative sizing at different scales
    var depthScale = [1.0, 0.7, 0.49];
    var currentScene = 1;
    var numTypes = 8;

    // Each object type has its own prefix, the ordering of the object types affects the
    // order in which they are rendered. That is the "t" type (toys) will be rendered on top
    // of the "hb0" (boy) category assuming they have the same depth.
    var prefix = [];
    prefix.push('s');
    prefix.push('p');
    prefix.push('hb0');
    prefix.push('hb1');
    prefix.push('a');
    prefix.push('c');
    prefix.push('e');
    prefix.push('t');

    // Total number of clipart for each type
    var typeTotalCt = [];
    typeTotalCt.push(8);
    typeTotalCt.push(10);
    typeTotalCt.push(35);
    typeTotalCt.push(35);
    typeTotalCt.push(6);
    typeTotalCt.push(10);
    typeTotalCt.push(7);
    typeTotalCt.push(15);

    // Total number of clipart to be randomly selected for each type
    // The sum should equal numClipart
    var typeCt = [];
    typeCt.push(3);
    typeCt.push(4);
    typeCt.push(5);
    typeCt.push(5);
    typeCt.push(2);
    typeCt.push(3);
    typeCt.push(2);
    typeCt.push(4);

    // Indexes of starting position for each type
    var typeCtPos = [0];
    for (var i = 0; i < typeCt.length-1; i++) {
        typeCtPos[i+1] = typeCtPos[i] + typeCt[i];
    }

    //global variables for the page
    var i, j;
    var img;
    var selectedImg;
    var buttonImg;
    var titleImg;
    var canvas_fix;
    var ctx;
    var image_name;
    var category_name;
    var clipartImgs = [];
    var selectedIdx = NOT_USED;
    var moveClipart = false;
    var mouse_offset_X = 0;
    var mouse_offset_Y = 0;
    var disabled = false;
    var loadingCount = 0;
    var callback = null;

    // String to return to AMT
    var resultAMT = "";

    var clipArtObjectIdx = [];
    var clipArtTypeIdx = [];
    var clipArtX = [];
    var clipArtY = [];
    var clipArtZ = [];
    var clipArtFlip = [];
    var same_list = [];

    var base_URL = 'Pngs/';
    var base_URL_Clipart = 'Pngs/';

    //current location
    var cx = 0;
    var cy = 0;

    var buttonW = 0;
    var buttonH = 0;

    // top level initialization of the canvas
    Abs.init = function(_disabled, _logger, _canvasid) {
        img = new Image();
        img.src = base_URL + 'background.png';
        _canvasid = _canvasid ? _canvasid : 'scene_canvas';
        canvas_fix = document.getElementById(_canvasid);
        ctx = canvas_fix.getContext("2d");

        disabled = _disabled ? _disabled : false;
        callback = null;
        logger = _logger ? _logger : null;

        if (!disabled) {
            canvas_fix.onmousemove = mousemove_canvas;
            canvas_fix.onmousedown = mousedown_canvas;
            canvas_fix.onmouseup = mouseup_canvas;
        } else {
            // CANVAS_ROW = 66;
            // CANVAS_COL = 250;
            canvas_fix.width = 500;
            CANVAS_ROW = 0;
            CANVAS_COL = 0;
        }

        selectedImg = new Image();
        selectedImg.src = base_URL + 'selected.png';
        buttonImg = new Image();
        buttonImg.src = base_URL + 'buttons.png';
        titleImg = new Image();
        titleImg.src = base_URL + 'title_f7f7f7.png';

        loadingCount += 4;
        img.onload = function() { loadingCount--; draw_canvas; }
        buttonImg.onload = function() { loadingCount--; draw_canvas; }
        selectedImg.onload = function() { loadingCount--; draw_canvas; }
        titleImg.onload = function() { loadingCount--; draw_canvas; }

        resetScene();
        draw_canvas();
    }

    // disable to edit
    Abs.disabled = function() {
        disabled = true;
        canvas_fix.onmousemove = null;
        canvas_fix.onmousedown = null;
        canvas_fix.onmouseup = null;
        CANVAS_ROW = 66;
        CANVAS_COL = 250;
        resetScene();
        draw_canvas();
    }

    var resetScene = function() {
        clipArtObjectIdx = [];
        clipArtTypeIdx = [];
        clipArtX = [];
        clipArtY = [];
        clipArtZ = [];
        clipArtFlip = [];
        clipartImgs = [];

        selectedIdx = NOT_USED;
        moveClipart = false;
        mouse_offset_X = 0;
        mouse_offset_Y = 0;

        for (i = 0; i < numClipart; i++) {
            clipArtObjectIdx.push(0);
            clipArtTypeIdx.push(0);
            clipArtX.push(NOT_USED);
            clipArtY.push(NOT_USED);
            clipArtZ.push(0);

            // DEVI: The next six lines are the only ones changed
            if (Math.random() > 0.5) {
                clipArtFlip.push(0);
            }
            else {
                clipArtFlip.push(1);
            }
        }

        var idx = 0;
        // Randomly select clipart for each type
        for (i = 0; i < numTypes; i++) {
            for (j = 0; j < typeCt[i]; j++) {
                var found = true;
                clipArtTypeIdx[idx] = i;

                while (found) {
                    clipArtObjectIdx[idx] = Math.floor(0.99 * typeTotalCt[i] * Math.random());

                    found = false;
                    for (k = 0; k < idx; k++)
                        if (clipArtObjectIdx[k] == clipArtObjectIdx[idx] && clipArtTypeIdx[k] == clipArtTypeIdx[idx])
                            found = true;
                }
                idx++;
            }
        }
        polishScene();
    }

    var swapClip = function(i, j) {
        var _clipArtTypeIdx = clipArtTypeIdx[i];
        var _clipArtObjectIdx = clipArtObjectIdx[i];
        var _clipArtX = clipArtX[i];
        var _clipArtY = clipArtY[i];
        var _clipArtZ = clipArtZ[i];
        var _clipArtFlip = clipArtFlip[i];
        clipArtTypeIdx[i] = clipArtTypeIdx[j];
        clipArtObjectIdx[i] = clipArtObjectIdx[j];
        clipArtX[i] = clipArtX[j];
        clipArtY[i] = clipArtY[j];
        clipArtZ[i] = clipArtZ[j];
        clipArtFlip[i] = clipArtFlip[j];
        clipArtTypeIdx[j] = _clipArtTypeIdx;
        clipArtObjectIdx[j] = _clipArtObjectIdx;
        clipArtX[j] = _clipArtX;
        clipArtY[j] = _clipArtY;
        clipArtZ[j] = _clipArtZ;
        clipArtFlip[j] = _clipArtFlip;
    }

    var polishScene = function() {
       // Make sure sun is in back (bad hack)
       if (clipArtTypeIdx[1] == 0 && clipArtObjectIdx[1] == 3) {
           swapClip(0,1);
       }

       // Make sure sun is in back (bad hack)
       if (clipArtTypeIdx[2] == 0 && clipArtObjectIdx[2] == 3) {
           swapClip(0,2);
       }

       same_list = [];
       for (i = 0; i < numClipart; i++) {
           same_list.push(i);
       }

       // All of the boys are the same
       for (i = 0; i < numClipart; i++)
           if (clipArtTypeIdx[i] == 2)
               same_list[i] = 100;

       // All of the girls are the same
       for (i = 0; i < numClipart; i++)
           if (clipArtTypeIdx[i] == 3)
               same_list[i] = 101;

       // Load the clip art images
       clipartImgs = [];
       for (i = 0; i < numClipart; i++) {
           var clipartImg = new Image();
           clipartImg.src = base_URL_Clipart + prefix[clipArtTypeIdx[i]] + '_' + clipArtObjectIdx[i] + 's.png';
           //    clipartImg.src = base_URL_Clipart + prefix[clipArtTypeIdx[i]] + '_' + clipArtObjectIdx[i] + '_0_0.png';
           //    clipartImg.src = base_URL_Clipart + 's' + '_' + 0 + '_0_0.png';
           clipartImgs.push(clipartImg);
       }

       // Update the canvas once the images are loaded
       for (i = 0; i < numClipart; i++) {
           loadingCount++;
           clipartImgs[i].onload = function() {--loadingCount; if(loadingCount==0) draw_canvas(); }
       }
    }

    // draw canvas
    var draw_canvas = function() {
        //draw the image
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        draw_scene();
        draw_clipart();
        draw_buttons();
        if (loadingCount==0) {
            if (callback) {
                // console.log('image loading callback is called!');
                callback();
            }
        }
    }

    var draw_scene = function() {
        ctx.fillStyle = '#F7F7F7';
        ctx.fillRect(0, 0, canvas_fix.width, canvas_fix.height);

        ctx.drawImage(img, CANVAS_COL, CANVAS_ROW, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Make sure we get the depth ordering correct (render the sky objects first)
        for (j = 2; j >= 0; j--) {
            for (i = 0; i < numClipart; i++) {
                if (clipArtX[i] >= 0 && clipArtZ[i] == j && clipArtTypeIdx[i] === 0) {
                    var scale = depthScale[clipArtZ[i]];

                    var w = clipartImgs[i].width;
                    var h = clipartImgs[i].height;

                    var rowOffset = -h / 2;
                    var colOffset = -w / 2;
                    rowOffset *= scale;
                    colOffset *= scale;

                    if (clipArtFlip[i] == 0) {
                        ctx.drawImage(clipartImgs[i], 0, 0, w, h, clipArtX[i] + colOffset + CANVAS_COL, clipArtY[i] + rowOffset + CANVAS_ROW, w * scale, h * scale);
                    }

                    if (clipArtFlip[i] == 1) {
                        ctx.setTransform(-1, 0, 0, 1, 0, 0);
                        ctx.drawImage(clipartImgs[i], 0, 0, w, h, -clipArtX[i] + colOffset - CANVAS_COL, clipArtY[i] + rowOffset + CANVAS_ROW, w * scale, h * scale);
                        ctx.setTransform(1, 0, 0, 1, 0, 0);
                    }
                }
            }
        }

        // Make sure we get the depth ordering correct (render the objects using their depth order)
        for (j = 2; j >= 0; j--) {
            for (i = 0; i < numClipart; i++) {
                if (clipArtX[i] >= 0 && clipArtZ[i] == j && clipArtTypeIdx[i] != 0) {
                    var scale = depthScale[clipArtZ[i]];

                    var w = clipartImgs[i].width;
                    var h = clipartImgs[i].height;

                    var rowOffset = -h / 2;
                    var colOffset = -w / 2;
                    rowOffset *= scale;
                    colOffset *= scale;

                    if (clipArtFlip[i] == 0) {
                        ctx.drawImage(clipartImgs[i], 0, 0, w, h, clipArtX[i] + colOffset + CANVAS_COL, clipArtY[i] + rowOffset + CANVAS_ROW, w * scale, h * scale);
                    }

                    if (clipArtFlip[i] == 1) {
                        ctx.setTransform(-1, 0, 0, 1, 0, 0);
                        ctx.drawImage(clipartImgs[i], 0, 0, w, h, -clipArtX[i] + colOffset - CANVAS_COL, clipArtY[i] + rowOffset + CANVAS_ROW, w * scale, h * scale);
                        ctx.setTransform(1, 0, 0, 1, 0, 0);
                    }
                }
            }
        }

        ctx.fillStyle = '#F7F7F7';
        ctx.fillRect(0, 0, CANVAS_COL, canvas_fix.height);
        ctx.fillRect(0, 0, CANVAS_COL + CANVAS_WIDTH, CANVAS_ROW);
        ctx.fillRect(CANVAS_COL + CANVAS_WIDTH, 0, CLIPART_COL, canvas_fix.height);
        ctx.fillRect(0, CANVAS_ROW + CANVAS_HEIGHT, CLIPART_COL, canvas_fix.height);

        if (!disabled) {
            // ctx.fillStyle = 'grey';
            // ctx.fillRect(0, 10, canvas_fix.width, 5);
            ctx.drawImage(titleImg, CANVAS_COL, 15);
        }
    }

    var draw_clipart = function() {
        if (disabled) return;
        ctx.fillStyle = 'Gainsboro';
        ctx.fillRect(CLIPART_COL - 4, CLIPART_ROW - 4, 2 * CLIPART_SKIP + 8, CLIPART_HEIGHT + 8);
        ctx.fillStyle = 'Gainsboro';
        ctx.fillRect(CLIPART_OBJECT_COL - 4, CLIPART_ROW - 4, CLIPART_SKIP_SM * NUM_CLIPART_HORZ_SM + 8, CLIPART_HEIGHT + 8);
        var r, c;

        for (r = 0; r < NUM_CLIPART_VERT; r++)
            for (c = 0; c < NUM_CLIPART_HORZ; c++) {
                var idx = r + c * NUM_CLIPART_VERT + typeCt[0] + typeCt[1];

                if (selectedIdx == idx)
                    ctx.drawImage(selectedImg, CLIPART_COL + c * CLIPART_SKIP, CLIPART_ROW + r * CLIPART_SKIP, CLIPART_SKIP, CLIPART_SKIP);

                var w = clipartImgs[idx].width;
                var h = clipartImgs[idx].height;
                var newW = Math.min(w, CLIPART_SIZE * w / Math.max(w, h));
                var newH = Math.min(h, CLIPART_SIZE * h / Math.max(w, h));

                var rowOffset = (CLIPART_SIZE - newH) / 2;
                var colOffset = (CLIPART_SIZE - newW) / 2;
                var xo = CLIPART_COL + c * CLIPART_SKIP + CLIPART_BUFFER + colOffset;
                var yo = CLIPART_ROW + r * CLIPART_SKIP + CLIPART_BUFFER + rowOffset;

                ctx.drawImage(clipartImgs[idx], 0, 0, w, h, Math.floor(xo), Math.floor(yo), newW, newH);
            }

        for (r = 0; r < NUM_CLIPART_VERT_SM; r++) {
            for (c = 0; c < NUM_CLIPART_HORZ_SM; c++) {

                var idx = r * NUM_CLIPART_HORZ_SM + c;

                if (idx >= typeCt[0] + typeCt[1])
                    idx += typeCt[2] + typeCt[3];

                if (selectedIdx == idx)
                    ctx.drawImage(selectedImg, 0, 0, selectedImg.width, selectedImg.height, c * CLIPART_SKIP_SM + CLIPART_OBJECT_COL, CLIPART_ROW + r * CLIPART_SKIP_SM, CLIPART_SKIP_SM, CLIPART_SKIP_SM);

                var w = clipartImgs[idx].width;
                var h = clipartImgs[idx].height;
                var newW = Math.min(w, CLIPART_SIZE_SM * w / Math.max(w, h));
                var newH = Math.min(h, CLIPART_SIZE_SM * h / Math.max(w, h));

                var rowOffset = (CLIPART_SIZE_SM - newH) / 2;
                var colOffset = (CLIPART_SIZE_SM - newW) / 2;
                var xo = c * CLIPART_SKIP_SM + CLIPART_BUFFER + colOffset + CLIPART_OBJECT_COL;
                var yo = CLIPART_ROW + r * CLIPART_SKIP_SM + CLIPART_BUFFER + rowOffset;

                ctx.drawImage(clipartImgs[idx], 0, 0, w, h, Math.floor(xo), Math.floor(yo), newW, newH);
            }
        }
    }

    var draw_buttons = function() {
        if (disabled) return;
        buttonW = buttonImg.width / 2;
        buttonH = buttonImg.height / 5;
        w = buttonW;
        h = buttonH;

        if (w > 0 && h > 0) {
            for (i = 0; i < 3; i++) {
                if (selectedIdx != NOT_USED) {
                    if (i === clipArtZ[selectedIdx]) {
                        ctx.drawImage(buttonImg, w, i * h, w, h, i * w + CANVAS_COL + BUTTON_COL, BUTTON_ROW, w, h);
                    }
                    else {
                        ctx.drawImage(buttonImg, 0, i * h, w, h, i * w + CANVAS_COL + BUTTON_COL, BUTTON_ROW, w, h);
                    }
                }
                else {
                    ctx.drawImage(buttonImg, 0, i * h, w, h, i * w + CANVAS_COL + BUTTON_COL, BUTTON_ROW, w, h);
                }
            }

            for (i = 0; i < 2; i++) {
                if (selectedIdx != NOT_USED) {
                    if (i == clipArtFlip[selectedIdx]) {
                        ctx.drawImage(buttonImg, w, (i + 3) * h, w, h, i * w + CANVAS_COL + BUTTON_COL + 3 * w + w / 2, BUTTON_ROW, w, h);
                    }
                    else {
                        ctx.drawImage(buttonImg, 0, (i + 3) * h, w, h, i * w + CANVAS_COL + BUTTON_COL + 3 * w + w / 2, BUTTON_ROW, w, h);
                    }
                }
                else {
                    ctx.drawImage(buttonImg, 0, (i + 3) * h, w, h, i * w + CANVAS_COL + BUTTON_COL + 3 * w + w / 2, BUTTON_ROW, w, h);
                }
            }
        }
    }

    Abs.pushForward = function() {
        if (selectedIdx != NOT_USED) {
            if (clipArtZ[selectedIdx] > 0) {
                clipArtZ[selectedIdx]--;
                draw_canvas();
            }
        }
    }

    Abs.pushBackward = function() {
        if (selectedIdx != NOT_USED) {
            if (clipArtZ[selectedIdx] < 2) {
                clipArtZ[selectedIdx]++;
                draw_canvas();
            }
        }
    }

    var mouseup_canvas = function(event) {
        moveClipart = false;

        if (selectedIdx >= 0 && clipArtX[selectedIdx] === NOT_USED) {
            selectedIdx = NOT_USED;
            draw_canvas();
        }
        if (logger) logger();  // scene log
    }

    var mousedown_canvas = function(event) {
        var ev = event || window.event;

        if (ev.pageX) cx = ev.pageX;
        else if (ev.clientX)
            cx = ev.clientX + (document.documentElement.scrollLeft ?
        document.documentElement.scrollLeft :
        document.body.scrollLeft);

        if (ev.pageY) cy = ev.pageY;
        else if (ev.clientY)
            cy = ev.clientY + (document.documentElement.scrollTop ?
        document.documentElement.scrollTop :
        document.body.scrollTop);

        // hack for amt iframe
        if ($ && $('#content_box').length > 0)
            cy += 23 - $('#content_box').offset().top;

        var clipartX = cx - CLIPART_COL - canvas_fix.offsetLeft;
        var clipartY = cy - CLIPART_ROW - canvas_fix.offsetTop;

        var clipart_pressed = false;

        if (clipartX < CLIPART_SKIP * NUM_CLIPART_HORZ && clipartX > 0 && clipartY < CLIPART_HEIGHT && clipartY > 0) {

            selectedIdx = Math.floor(clipartX / CLIPART_SKIP);
            selectedIdx *= NUM_CLIPART_VERT;
            selectedIdx += Math.floor(clipartY / CLIPART_SKIP);

            selectedIdx += typeCt[0] + typeCt[1];
            clipart_pressed = true;
        }

        clipartX = cx - CLIPART_OBJECT_COL - canvas_fix.offsetLeft;
        clipartY = cy - CLIPART_ROW - canvas_fix.offsetTop;

        if (clipartX < CLIPART_SKIP_SM * NUM_CLIPART_HORZ_SM && clipartX > 0 && clipartY < CLIPART_HEIGHT && clipartY > 0) {

            selectedIdx = Math.floor(clipartY / CLIPART_SKIP_SM);
            selectedIdx *= NUM_CLIPART_HORZ_SM;
            selectedIdx += Math.floor(clipartX / CLIPART_SKIP_SM);

            if (selectedIdx >= typeCt[0] + typeCt[1])
                selectedIdx += typeCt[2] + typeCt[3];

            clipart_pressed = true;
        }

        if (clipart_pressed === true) {
            var foundIdx = NOT_USED;
            for (i = 0; i < numClipart; i++) {
                if (selectedIdx != i && clipArtX[i] >= 0 && same_list[selectedIdx] == same_list[i])
                    foundIdx = i;
            }
            if (foundIdx >= 0) {
                clipArtX[selectedIdx] = clipArtX[foundIdx];
                clipArtY[selectedIdx] = clipArtY[foundIdx];
                clipArtZ[selectedIdx] = clipArtZ[foundIdx];
                clipArtFlip[selectedIdx] = clipArtFlip[foundIdx];
                clipArtX[foundIdx] = NOT_USED;
            }
            mouse_offset_X = 0;
            mouse_offset_Y = 0;
            wasOnCanvas = false;
            moveClipart = true;

            draw_canvas();
        }

        var canvasX = cx - CANVAS_COL - canvas_fix.offsetLeft;
        var canvasY = cy - CANVAS_ROW - canvas_fix.offsetTop;

        if (canvasX < CANVAS_WIDTH && canvasX > 0 && canvasY < CANVAS_HEIGHT && canvasY > 0) {

            selectedIdx = NOT_USED;

            // Make sure we get the depth ordering correct
            for (j = 2; j >= 0; j--) {
                for (i = 0; i < numClipart; i++) {
                    if (clipArtX[i] >= 0 && clipArtZ[i] == j) {
                        var scale = depthScale[clipArtZ[i]];

                        var w = scale*clipartImgs[i].width;
                        var h = scale*clipartImgs[i].height;
                        var rowOffset = -h / 2;
                        var colOffset = -w / 2;
                        var x = clipArtX[i] + colOffset;
                        var y = clipArtY[i] + rowOffset;

                        if (canvasX >= x && canvasX < x + w && canvasY >= y && canvasY < y + h) {
                            selectedIdx = i;
                            mouse_offset_X = (x + w / 2) - canvasX;
                            mouse_offset_Y = (y + h / 2) - canvasY;
                        }
                    }
                }
            }

            if (selectedIdx >= 0) {
                if (moveClipart === true) {
                    clipArtX[selectedIdx] = canvasX + mouse_offset_X;
                    clipArtY[selectedIdx] = canvasY + mouse_offset_Y;
                    moveClipart = false;
                }
                else {
                    clipArtX[selectedIdx] = canvasX + mouse_offset_X;
                    clipArtY[selectedIdx] = canvasY + mouse_offset_Y;
                    moveClipart = true;
                }

                draw_canvas();
            }
        }

        var scaleButtonX = cx - CANVAS_COL - canvas_fix.offsetLeft - BUTTON_COL;
        var scaleButtonY = cy - canvas_fix.offsetTop - BUTTON_ROW;

        if (scaleButtonX >= 0 && scaleButtonX < buttonW * 3 && scaleButtonY >= 0 && scaleButtonY < buttonH) {
            if (selectedIdx != NOT_USED) {
                clipArtZ[selectedIdx] = Math.floor(scaleButtonX / buttonW);
                draw_canvas();
            }
        }

        var flipButtonX = cx - CANVAS_COL - canvas_fix.offsetLeft - 3 * buttonW - buttonW / 2 - BUTTON_COL;
        var flipButtonY = cy - canvas_fix.offsetTop - BUTTON_ROW;

        if (flipButtonX >= 0 && flipButtonX < buttonW * 2 && flipButtonY >= 0 && flipButtonY < buttonH) {
            if (selectedIdx != NOT_USED) {
                clipArtFlip[selectedIdx] = Math.floor(flipButtonX / buttonW);
                draw_canvas();
            }
        }


    }
    //update the current location of the keypoint
    var mousemove_canvas = function(event) {
        var ev = event || window.event;

        if (ev.pageX) cx = ev.pageX;
        else if (ev.clientX)
            cx = ev.clientX + (document.documentElement.scrollLeft ?
        document.documentElement.scrollLeft :
        document.body.scrollLeft);

            if (ev.pageY) cy = ev.pageY;
            else if (ev.clientY)
                cy = ev.clientY + (document.documentElement.scrollTop ?
        document.documentElement.scrollTop :
        document.body.scrollTop);

        // hack for amt iframe
        if ($ && $('#content_box').length > 0)
            cy += 23 - $('#content_box').offset().top;

        if (selectedIdx != NOT_USED && moveClipart == true && wasOnCanvas === true) {
            clipArtX[selectedIdx] = NOT_USED;
            draw_canvas();
        }

        var canvasX = cx - CANVAS_COL - canvas_fix.offsetLeft;
        var canvasY = cy - CANVAS_ROW - canvas_fix.offsetTop;

        if (canvasX < CANVAS_WIDTH && canvasX > 0 && canvasY < CANVAS_HEIGHT && canvasY > 0) {
            wasOnCanvas = true;

            if (selectedIdx != NOT_USED && moveClipart === true) {
                clipArtX[selectedIdx] = canvasX + mouse_offset_X;
                clipArtY[selectedIdx] = canvasY + mouse_offset_Y;
                draw_canvas();
            }
        }
    }

    /// functions related to AMT task
    Abs.gup = function(name) {
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var tmpURL = window.location.href;
        var results = regex.exec(tmpURL);
        if (results == null)
            return "";
        else
            return results[1];
    }
    //
    // This method decodes the query parameters that were URL-encoded
    //
    Abs.decode = function(strToDecode) {
        var encoded = strToDecode;
        return unescape(encoded.replace(/\+/g, " "));
    }
    // what to submit to AMT server
    Abs.update_results_string = function() {
        resultAMT += numClipart + ",";

        for (i = 0; i < numClipart; i++) {
            resultAMT += prefix[clipArtTypeIdx[i]] + '_' + clipArtObjectIdx[i] + 's.png' + ",";
            resultAMT += i + ",";
            resultAMT += clipArtObjectIdx[i] + ",";
            resultAMT += clipArtTypeIdx[i] + ",";
            resultAMT += clipArtX[i] + ",";
            resultAMT += clipArtY[i] + ",";
            resultAMT += clipArtZ[i] + ",";
            resultAMT += clipArtFlip[i] + ",";
        }
    }

    Abs.update_clipArt_status = function(str, draw, func) {
        resetScene();
        callback = func ? func : null;
        var typeCtNum = [];
        var updatedIdx = [];
        for (i = 0; i < typeCt.length; i++)
            typeCtNum.push(Math.floor(0.99 * Math.random() * typeCt[i]));
        var results = str.split(',');
        var idx = 1;
        for (i = 0; i < results[0]; i++) {
            idx++; // png filename
            idx++; // clip art local index
            var _clipArtObjectIdx = parseInt(results[idx++]);
            var _clipArtTypeIdx = parseInt(results[idx++]);
            var _clipArtX = draw ? parseInt(results[idx++]) : NOT_USED;
            var _clipArtY = draw ? parseInt(results[idx++]) : NOT_USED;
            var _clipArtZ = draw ? parseInt(results[idx++]) : 0;
            var _clipArtFlip = draw ? parseInt(results[idx++]) :
                (Math.random()>0.5 ? 0 : 1);
            if (!draw) idx += 4;

            var k = typeCtPos[_clipArtTypeIdx] +
                (typeCtNum[_clipArtTypeIdx]++ % typeCt[_clipArtTypeIdx]);

            clipArtObjectIdx[k] = _clipArtObjectIdx;
            clipArtTypeIdx[k] = _clipArtTypeIdx;
            clipArtX[k] = _clipArtX;
            clipArtY[k] = _clipArtY;
            clipArtZ[k] = _clipArtZ;
            clipArtFlip[k] = _clipArtFlip;
            updatedIdx[k] = true;

            // reselect clipart for duplicates
            // assumption: there are no duplicates in the input
            var found = true;
            while (found) {
                found = false;
                for (k = typeCtPos[_clipArtTypeIdx]; k < typeCtPos[_clipArtTypeIdx]+typeCt[_clipArtTypeIdx]; k++) {
                    for (j = 0; j < numClipart; j++) {
                        if (k != j && clipArtObjectIdx[k] == clipArtObjectIdx[j] && clipArtTypeIdx[k] == clipArtTypeIdx[j] && !updatedIdx[j]) {
                            found = true;
                            clipArtObjectIdx[j] = Math.floor(0.99 * typeTotalCt[clipArtTypeIdx[j]] * Math.random());
                            clipArtX[j] = NOT_USED;
                            clipArtY[j] = NOT_USED;
                            clipArtZ[j] = 0;
                        }
                    }
                }
            }
        }
        polishScene();
        //   for (k = 0; k < numClipart; k++) {
        //       for (j = 0; j < numClipart; j++) {
        //           if (k != j && clipArtObjectIdx[k] == clipArtObjectIdx[j] && clipArtTypeIdx[k] == clipArtTypeIdx[j]) {
        //               return 1;
        //           }
        //       }
        //   }
    }

    // Getter for resultAMT
    Abs.resultAMT = function() {
       resultAMT = "";
       Abs.update_results_string();
       return resultAMT
    }

    Abs.get_clipArt_filenames = function(str) {
        var idx = 1;
        var filenames = [];
        if (!str || str.length < 1) return;
        var results = str.split(',');
        for (i = 0; i < results[0]; i++) {
            idx++; // png filename
            idx++; // clip art local index
            var _clipArtObjectIdx = parseInt(results[idx++]);
            var _clipArtTypeIdx = parseInt(results[idx++]);
            var _clipArtX = parseInt(results[idx++]);
            var _clipArtY = parseInt(results[idx++]);
            var _clipArtZ = parseInt(results[idx++]);
            var _clipArtFlip = parseInt(results[idx++]);
            var _filename = base_URL_Clipart + prefix[_clipArtTypeIdx] + '_' + _clipArtObjectIdx + 's.png';
            filenames.push(_filename); // png filename
        }
        return filenames;
    }

    // grab the results and submit to the server
    Abs.next = function() {
        var numClipartUsed = 0;

        for (i = 0; i < numClipart; i++)
            if (clipArtX[i] != NOT_USED)
                numClipartUsed++;

        if (numClipartUsed < 6) {
            alert("Please use at least 6 pieces of clipart. Thanks!");
            return;
        }

        update_results_string();
        currentScene++;

        if (currentScene === NUM_SCENES_TO_COMPLETE) {
            document.getElementById('submitButton').type = "button";
            document.getElementById('nextButton').type = "hidden";
            document.getElementById('comment').style.visibility = "visible";
            document.getElementById('comment_title').style.visibility = "visible";
        }
        resetScene();
        draw_canvas();
    }

    // grab the results and submit to the server
    Abs.submitResults = function() {
        var numClipartUsed = 0;

        for (i = 0; i < numClipart; i++)
            if (clipArtX[i] != NOT_USED)
                numClipartUsed++;

        if (numClipartUsed < 6) {
            alert("Please use at least 6 pieces of clipart. Thanks!");
            return;
        }

        update_results_string();
        resultAMT += "*";
        resultAMT += document.getElementById('comment').value;
        resultAMT += "*";
        document.getElementById('clipartPositions').value = resultAMT;
        document.forms["mturk_form"].submit();
        //alert(results);
    }
    return Abs;
})(this);
