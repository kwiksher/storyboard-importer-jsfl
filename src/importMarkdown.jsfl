var _INDENT    = "    ";
var TL         = fl.getDocumentDOM().getTimeline()
var _W         = fl.getDocumentDOM().width;
var _H         = fl.getDocumentDOM().height;
var scriptUri  = fl.scriptURI;
var scriptPath = scriptUri.substr(0, scriptUri.lastIndexOf("/")+1);
var IMAGE_FOLDER = "";  //images/
var IMAGE_LABEL   = ""; //-posterframe
var FPS        = 20;
//var _Time      = 1000;
var FONT_SIZE  = 24;  
var FONT_COLOR = '#CCCCCC';
var FONT_FACE  = 'MS-Gothic';
var TEXT_LEFT  = 0;
var TEXT_TOP   = 0;
                             

var Layers     = {};
var Images     = {}
var folderPath = null;

fl.runScript( scriptPath + '../js/json2.js' );

function init(layerName) {
    //Create Layer
    var index = TL.addNewLayer();
    TL.setLayerProperty('name', layerName);
    fl.trace(index + _INDENT+ layerName);
}

function importStoryboarder(){
    var uri = fl.browseForFileURL('open', 'Import File');
    fl.trace(uri);
    folderPath = uri.substr(0, uri.lastIndexOf("/")+1);
    var data = FLfile.read(uri);
    var storyboader = JSON.parse(data);
    fl.trace(storyboader.version);
    fl.trace(storyboader.fps);
    //
    return storyboader;
}

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
                    board.action = value;
                    break;
                case 5:
                    board.dialogue = value;
                    break;
                case 6:
                    board.comment = value;
                    break;
            }
        }
        if (cells.length == 8){
            fl.trace(cells[0]);
            fl.trace(_INDENT + board.shot + ", " + board.time);
            ret.push(board);
        }
    }
    return ret;

}

function insertFrames(time, duration){
    fl.trace("insertFrames");
    var totalFrames = parseInt((duration/FPS));
    var currentFrameIndex = parseInt(time/FPS);
    //TL.setSelectedFrames(currentFrameIndex, totalFrames);
    fl.trace(_INDENT + currentFrameIndex + ", " + totalFrames);
    if (currentFrameIndex == 0){
        TL.insertFrames(totalFrames, true, 1);
    }else{
        TL.insertFrames(totalFrames, true, currentFrameIndex);
        TL.setSelectedLayers(Layers["image"].index);
        TL.insertBlankKeyframe(currentFrameIndex);
        TL.setSelectedLayers(Layers["dialogue"].index);
        TL.insertBlankKeyframe(currentFrameIndex);
        TL.setSelectedLayers(Layers["action"].index);
        TL.insertBlankKeyframe(currentFrameIndex);
        TL.setSelectedLayers(Layers["shot"].index);
        TL.insertBlankKeyframe(currentFrameIndex);
        fl.trace(_INDENT + totalFrames);
    }

    return currentFrameIndex;
}

function setAction(action, frameIndex){
    TL.setSelectedLayers(Layers["action"].index);
    TL.setSelectedFrames(frameIndex, frameIndex + 1, true);
    TL.setFrameProperty('labelType', 'name');
    TL.setFrameProperty('name', action);
}

function setShot(shotName, frameIndex){
    TL.setSelectedLayers(Layers["shot"].index);
    TL.setSelectedFrames(frameIndex, frameIndex + 1, true);
    TL.setFrameProperty('labelType', 'name');
    TL.setFrameProperty('name', shotName);
}

function createText(text, left, top, frameIndex){
    TL.setSelectedLayers(Layers["dialogue"].index);
    TL.setSelectedFrames(frameIndex, frameIndex + 1, true);
    fl.trace("createText");
        fl.trace(_INDENT + text);
    var l = left;
    var t = top;
    var r = left+ text.length*FONT_SIZE;
    if ( r > _W ){
        r = _W;
        l = 0;
    }
    var b = top + FONT_SIZE*2;
    if (b > _H){
        b = _H;
        t = 0;
    }
    var pos = {left:l, top:t, right: r, bottom:b}
    fl.trace(_INDENT + left + ","  + top + ", " + text.length*FONT_SIZE + "," + FONT_SIZE*2 );    
    //Create Text
    // fl.getDocumentDOM().addNewText({left:0, top:0, right:200, bottom:200});
    fl.getDocumentDOM().addNewText(pos);
    fl.getDocumentDOM().setElementProperty('autoExpand', false);
    fl.getDocumentDOM().setTextString(text);
    fl.getDocumentDOM().setFillColor(FONT_COLOR);
    fl.getDocumentDOM().setElementTextAttr('size', FONT_SIZE);
    fl.getDocumentDOM().setElementTextAttr('face', FONT_FACE);

}

function loadToLibrary(url){
    fl.trace("loadToLibrary");
    var filename = url.substr(0, url.lastIndexOf(".")) + IMAGE_LABEL + ".png";
    if (!FLfile.exists(folderPath +IMAGE_FOLDER + filename)){
        filename = url.substr(0, url.lastIndexOf(".")) +  IMAGE_LABEL + ".jpg";        
        if (!FLfile.exists(folderPath +IMAGE_FOLDER + filename)){
            fl.trace("no image file: " + folderPath +IMAGE_FOLDER + filename);
            return 
        }

    }
    fl.trace(_INDENT + folderPath +IMAGE_FOLDER + filename);
    Images[url] = filename.substr(filename.lastIndexOf('/')+1);
    //Load To Library
    fl.getDocumentDOM().importFile(folderPath +IMAGE_FOLDER + filename, true);
}

function insertToStage(url, time, x, y, frameIndex ){
    TL.setSelectedLayers(Layers["image"].index);
    fl.trace("insertToStage");
    fl.trace(_INDENT + x + ", " + y);
    //var imageFileName = url.substr(url.lastIndexOf('/')+1);
    //fl.trace(_INDENT + imageFileName);    
    //Insert To Stage
    TL.setSelectedFrames(frameIndex, frameIndex+1, true);
    var filename = Images[url];
    fl.trace(_INDENT + filename);
    fl.getDocumentDOM().library.selectItem(filename);
    fl.getDocumentDOM().library.addItemToDocument({x:0, y:0});
    var selectedFrames = TL.getSelectedFrames();
    var element = Layers["image"].layer.frames[frameIndex].elements[0];
    element.width = _W;
    element.height = _H;
    element.x = 0;
    element.y = 0;
    
}

init("shot");
init("action");
init("image");
init("dialogue");

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
    setAction(board.action?board.action:"", frameIndex);

    if (board.url && board.url.length > 0){
        loadToLibrary(board.url);
        insertToStage(board.url, board.time, Number(_W/2), Number(_H/2), frameIndex);
    }

    if (board.dialogue && board.dialogue.length > 0){
        createText(board.dialogue, TEXT_LEFT, TEXT_TOP, frameIndex )
    }

    fl.trace(board.number);
    fl.trace(_INDENT+board.url);
    fl.trace(_INDENT+board.shot);
    fl.trace(_INDENT+board.time);
    fl.trace(_INDENT+board.duration);
    fl.trace(_INDENT+board.dialogue);
    fl.trace(_INDENT+board.action);
}

