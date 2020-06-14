var scriptUri  = fl.scriptURI;
var scriptPath = scriptUri.substr(0, scriptUri.lastIndexOf("/")+1);
fl.runScript( scriptPath + '/util.jsfl' );

var IMAGE_FOLDER = "";  //images/
var IMAGE_LABEL   = ""; //-posterframe

function parseCutTime(str){
    const timeStr = str.split('<br> total');
    var seconds = 0;
    if (timeStr.length > 0 ){
        var a = timeStr[0].split(":");
        if (a.length>1){
            seconds =  (+a[0]) * 60 + (+a[1]);
        }
    }
    var total = 0;
    if (timeStr[1]){
        var a = timeStr[1].split(":");
        if (a.length>2){
            total =  (+a[0]) * 60*60 + (+a[1]) * 60 + (+a[2]);
        }
    }
    return {time:seconds, totalTime:total}
}

function importMarkdown(){
    var uri = fl.browseForFileURL('open', 'Import File');
    fl.trace(uri);
    if (uri == null){
        return [];
    }
    folderPath = uri.substr(0, uri.lastIndexOf("/")+1);
    //
    var ret = [];
    var bTable = false;
    var tokens = FLfile.read(uri).split( '\n' );
    for(var i=0;i<tokens.length;i++){
        fl.trace('----');
        var board = {};
        var cells = tokens[i].split('|');
        if (!bTable){
            if (cells.length > 1){
                if (cells[1].indexOf("---") >=0){
                    bTable = true;
                }
            }
            continue;
        }
        fl.trace(_INDENT + "cells.length: " + cells.length);
        for(var j=1;j<cells.length;j++){
            //fl.trace(_INDENT + j + ": " + cells[j]);
            var value = cells[j];
            switch(j){
                case 1:
                    board.shot = value.toString();
                    break;
                case 2:
                    if (value.indexOf('<img') !=-1){
                        var tags = value.split("'");
                        //fl.trace(_INDENT+ tags[1]);
                        board.url = tags[1];
                    }
                    break;
                case 3:
					//00:10.000 <br> total 00:00:10.000 
					var t = parseCutTime(value);
					board.time = t.totalTime-t.time;
					board.duration = t.totalTime;
                    break;
                case 4:
                    board.character = myReplace(value);
                    break;
                case 5:
                    board.dialogue = myReplace(value);
                    break;
                case 6:
                    board.comment = myReplace(value);
                    break;
            }
        }
        if (cells.length == 8){
            fl.trace(cells[0]);
            fl.trace(_INDENT + board.shot + ", " + board.time + ", " + board.duration);
            ret.push(board);
        }
    }
    return ret;
}

function insertFrames(time, duration){
    fl.trace("insertFrames");
    var totalFrames = parseInt(duration*FPS);
    var currentFrameIndex = parseInt(time*FPS);
    //TL.setSelectedFrames(currentFrameIndex, totalFrames);
    fl.trace(_INDENT + "currentFrameIndex, totalFrames:" + currentFrameIndex + ", " + totalFrames);
    if (currentFrameIndex == 0){
        TL.insertFrames(totalFrames, true, 1);
    }else{
        TL.insertFrames(totalFrames, true, currentFrameIndex);
        TL.setSelectedLayers(Layers["image"].index);
        TL.insertBlankKeyframe(currentFrameIndex);
        TL.setSelectedLayers(Layers["dialogue"].index);
        TL.insertBlankKeyframe(currentFrameIndex);
        TL.setSelectedLayers(Layers["character"].index);
        TL.insertBlankKeyframe(currentFrameIndex);
        TL.setSelectedLayers(Layers["shot"].index);
        TL.insertBlankKeyframe(currentFrameIndex);
        TL.setSelectedLayers(Layers["comment"].index);
        TL.insertBlankKeyframe(currentFrameIndex);
        fl.trace(_INDENT + totalFrames);
    }

    return currentFrameIndex;
}

init("shot");
init("image");
init("character");
init("dialogue");
init("comment");

for (var i=0;i<TL.layers.length;i++){
    var layer = TL.layers[i];
    Layers[layer.name] = {layer:layer, index:i};
}

var boards = importMarkdown();

for (var i=0;i<boards.length;i++){
//for (var i=0;i<3;i++){
    var board = boards[i];
    // '../../data/storyboards/Scene-2-SCENE-001-2-04SYK/images/board-2-FDMFD-reference.png';
    var frameIndex = 0;
    frameIndex = insertFrames(board.time, board.duration);
    
    setShot(board.shot, frameIndex);
    setCharacter(board.character?board.character:"", frameIndex);
    setComment(board.comment?board.comment:"", frameIndex);

    if (board.url && board.url.length > 0){
        loadToLibrary(board.url);
        insertToStage(board.url, board.time, Number(_W/2), Number(_H/2), frameIndex);
    }

    if (isEmptyStr(board.dialogue) == false){
        //createText(board.dialogue, _W/2, _H/2, frameIndex, board.shot )
        createText(board.dialogue, TEXT_LEFT, TEXT_TOP, frameIndex, board.shot )
    }

    fl.trace(board.shot);
    fl.trace(_INDENT+board.url);
    fl.trace(_INDENT+board.time);
    fl.trace(_INDENT+board.duration);
    fl.trace(_INDENT+board.dialogue);
    fl.trace(_INDENT+board.character);
    fl.trace(_INDENT+board.comment);
}

