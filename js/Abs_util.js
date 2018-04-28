/*
 Copyright (c) 2017-present, Facebook, Inc.
 All rights reserved.

 This source code is licensed under the license found in the
 LICENSE file in the root directory of this source tree.
*/

var AbsUtil = (function(){
    var AbsUtil = {}; // Encapsuled object

    // Various variables setting up the appearence of the interface
    var CANVAS_WIDTH = 500;
    var CANVAS_HEIGHT = 400;
    var NOT_USED = -10000;

    var numClipArts = 58;
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

    // Preprocess given CSV into 7Val format, which is
    // 1. clipartIdx integer [0-57]
    // 2. clipartType integer [0-7]
    // 3. clipartSubType integer [0-34]
    // 4. depth integer [0-2]
    // 5. flip integer [0-1]
    // 6. x-position float [1-500]
    // 7. y-position float [1-400]
    AbsUtil.preprocess = function(str, verbose) {
        var idx = 1;
        var val = [];
        if (!str || str.length < 1) return;
        var results = str.split(',');
        for (i = 0; i < results[0]; i++) {
            var v = [];
            idx++; // png filename
            idx++; // clip art local index
            var _clipArtObjectIdx = parseInt(results[idx++]);
            var _clipArtTypeIdx = parseInt(results[idx++]);
            var _clipArtX = parseInt(results[idx++]);
            var _clipArtY = parseInt(results[idx++]);
            var _clipArtZ = parseInt(results[idx++]);
            var _clipArtFlip = parseInt(results[idx++]);

            if (!verbose && (_clipArtX==NOT_USED || _clipArtY==NOT_USED)) continue;

            v.push(AbsUtil.getClipArtIdx(_clipArtObjectIdx, _clipArtTypeIdx));
            v.push(_clipArtTypeIdx);
            v.push((_clipArtTypeIdx==2 || _clipArtTypeIdx==3) ? _clipArtObjectIdx : 0);
            v.push(_clipArtZ);
            v.push(_clipArtFlip);
            v.push(_clipArtX);
            v.push(_clipArtY);

            val.push(v); // png filename
        }
        return val;
    };

    AbsUtil.getClipArtIdx = function(clipArtObjectIdx, clipArtTypeIdx) {
        var typeTotalPos = [0,8,18,19,20,26,36,43];
        var offset = (clipArtTypeIdx==2 || clipArtTypeIdx==3) ? 0 : clipArtObjectIdx;
        return typeTotalPos[clipArtTypeIdx] + offset;
    }

    AbsUtil.Counter = function(size) {
        for (var c=i=[];i<size;) c[i++]=0;
        return c;
    }

    AbsUtil.IoU = function(c) {  // Intersection over Union
        var u = i = 0;
        for (var k=0;k<c.length;k++) {
            if (c[k]>0) u++;
            if (c[k]>1) i++;
        }
        if (u==0) return 1;
        return i/u;
    }

    AbsUtil.populateCounter = function(v1, v2) {
        var c = AbsUtil.Counter(numClipArts);
        for (var i=0;i<v1.length;i++) {
            c[v1[i][0]]++;
        }
        for (var i=0;i<v2.length;i++) {
            c[v2[i][0]]++;
        }
        return c;
    }

    AbsUtil.SceneDiff = function(v1, v2) {  // Scene Diff Metric for preprocessed vectors
        var w = [5,-1,-1,-1,-1,-0.5,-0.5];
        var c = AbsUtil.populateCounter(v1, v2);
        var score = 0;
        var relpos = AbsUtil._RelPosDiff(c, v1, v2);
        var s = [
            AbsUtil._ClipArtDiff(c),
            AbsUtil._DirectionDiff(c, v1, v2),
            AbsUtil._PoseDiff(c, v1, v2),
            AbsUtil._DepthDiff(c, v1, v2),
            AbsUtil._AbsPosDiff(c, v1, v2),
            relpos[0],
            relpos[1]
        ];
        for (var ws=[],i=0;i<s.length;i++) {
            ws[i] = w[i] * s[i] * (i==0 ? 1 : s[0]);  // IoU penalty;
            score += ws[i];
        }
        return [score, w, s, ws];
    };

    AbsUtil.SDM = function(s1, s2) {  // Scene Diff Metric for strings
        if (!s1 || !s2 || s1.length < 1 || s2.length < 1) return [];
        var v1 = AbsUtil.preprocess(s1);
        var v2 = AbsUtil.preprocess(s2);
        return AbsUtil.SceneDiff(v1, v2);
    }

    AbsUtil.toString = function(score) {
        var html = '';
        var terms = ['ClipArtDiff', 'DirDiff', 'PoseDiff', 'DepthDiff', 'AbsPosDiff','xRelPosDiff','yRelPosDiff'];
        html += 'Score: ' + score[0].toPrecision(5) + ' = ';
        for (var i=0;i<terms.length;i++) {
            html += '\n' + score[1][i] + ' ✕ ' + score[2][i].toPrecision(5) + ' (' + terms[i] + ')' + ((i<terms.length-1)?' + ':'');
        }
        return html;
    }

    AbsUtil._ClipArtDiff = function(c) {
        return AbsUtil.IoU(c);
    }

    AbsUtil._DirectionDiff = function(c, v1, v2) {
        var s = n = 0;
        for (var k=0;k<v1.length;k++) {
            for (var l=0;l<v2.length;l++) {
                if (v1[k][0] == v2[l][0]) {  // intersection
                    if (v1[k][1] != 2 && v1[k][1] != 3) {  // not human
                        n++;
                        s += Math.abs(v1[k][4] - v2[l][4]);
                    }
                }
            }
        }
        if (n==0) return 0;
        return s/n;
    }

    AbsUtil._PoseDiff = function(c, v1, v2) {
        var s = n = 0;
        for (var k=0;k<v1.length;k++) {
            for (var l=0;l<v2.length;l++) {
                if (v1[k][0] == v2[l][0]) {  // intersection
                    if (v1[k][1] == 2 || v1[k][1] == 3) {  // human
                        n++;
                        s += (v1[k][4]==v2[l][4]) && (v1[k][2]==v2[l][2]) ? 0 : 1;
                    }
                }
            }
        }
        if (n==0) return 0;
        return s/n;
    }

    AbsUtil._DepthDiff = function(c, v1, v2) {
        var s = n = 0;
        for (var k=0;k<v1.length;k++) {
            for (var l=0;l<v2.length;l++) {
                if (v1[k][0] == v2[l][0]) {  // intersection
                    n++;
                    s += Math.min(Math.abs(v1[k][3] - v2[l][3]), 1);
                }
            }
        }
        if (n==0) return 0;
        return s/n;
    }

    AbsUtil._AbsPosDiff = function(c, v1, v2) {
        var s = n = 0;
        for (var k=0;k<v1.length;k++) {
            for (var l=0;l<v2.length;l++) {
                if (v1[k][0] == v2[l][0]) {  // intersection
                    n++;
                    s += Math.sqrt(
                        Math.pow(Math.abs(v1[k][5] - v2[l][5]) / CANVAS_WIDTH, 2) +
                        Math.pow(Math.abs(v1[k][6] - v2[l][6]) / CANVAS_HEIGHT, 2)
                    );
                }
            }
        }
        if (n==0) return 0;
        return s/n;
    }

    AbsUtil._RelPosDiff = function(c, v1, v2) {
        var s = [0,0];
        var n = 0;
        for (var k=0;k<v1.length;k++) {
            if (c[v1[k][0]]>1) {
                for (var l=0;l<v1.length;l++) {
                    if (c[v1[l][0]]>1) {  // intersection pair
                        n++;
                        var _k = AbsUtil.findByClipArtIdx(v1[k][0], v2);
                        var _l = AbsUtil.findByClipArtIdx(v1[l][0], v2);
                        if (_k<0||_l<0) console.log('Assertion Failed: Not found clip art intersection!');
                        s[0] += (v1[k][5] - v1[l][5]) * (v2[_k][5] - v2[_l][5]) >= 0 ? 0 : 1;  // left right
                        s[1] += (v1[k][6] - v1[l][6]) * (v2[_k][6] - v2[_l][6]) >= 0 ? 0 : 1; // up down
                        // console.log(s);
                        // console.log(k,l);
                    }
                }
            }
        }
        if (n > 0)
        for (var i=0;i<2;i++) {
            s[i] /= n;
        }
        // console.log(n);
        return s;
    }

    AbsUtil.findByClipArtIdx = function(clipArtIdx, v) {
        for (var k=0;k<v.length;k++) {
            if (v[k][0] == clipArtIdx) return k;
        }
        return -1;
    }

    return AbsUtil;

})(this);
