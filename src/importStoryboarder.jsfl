var scriptUri  = fl.scriptURI;
var scriptPath = scriptUri.substr(0, scriptUri.lastIndexOf("/")+1);
fl.runScript( scriptPath + '/util.jsfl' );

var IMAGE_FOLDER = "images/";  
var IMAGE_LABEL   = "-posterframe"; 

function importStoryboarder(){
    var uri = fl.browseForFileURL('open', 'Import File');
    fl.trace(uri);
    if (uri == null){
        return [];
    }
    folderPath = uri.substr(0, uri.lastIndexOf("/")+1);
    var data = FLfile.read(uri);
    var storyboader = JSON.parse(data);
    fl.trace(storyboader.version);
    fl.trace(storyboader.fps);
    //
    return storyboader;
}

function insertFrames(time, next){
    fl.trace("insertFrames");
    var totalFrames = parseInt((next-time)/(1000/FPS));
    var currentFrameIndex = parseInt(time/(1000/FPS));
    //TL.setSelectedFrames(currentFrameIndex, totalFrames);
    fl.trace(_INDENT + currentFrameIndex + ", " + totalFrames);
    if (currentFrameIndex == 0){
        TL.insertFrames(totalFrames, true, 1);
    }else{
        TL.insertFrames(totalFrames, true, currentFrameIndex);
        TL.setSelectedLayers(Layers["image"].index);
        TL.insertBlankKeyframe(currentFrameIndex);
        TL.setSelectedLayers(Layers["character"].index);
        TL.insertBlankKeyframe(currentFrameIndex);
        TL.setSelectedLayers(Layers["dialogue"].index);
        TL.insertBlankKeyframe(currentFrameIndex);
        TL.setSelectedLayers(Layers["action"].index);
        TL.insertBlankKeyframe(currentFrameIndex);
        TL.setSelectedLayers(Layers["shot"].index);
        TL.insertBlankKeyframe(currentFrameIndex);
        TL.setSelectedLayers(Layers["comment"].index);
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

init("shot");
init("action");
init("image");
init("character");
init("dialogue");
init("comment");

for (var i=0;i<TL.layers.length;i++){
    var layer = TL.layers[i];
    Layers[layer.name] = {layer:layer, index:i};
}

var storyboader = importStoryboarder();

for (var i=0;i<storyboader.boards.length;i++){
    var board = storyboader.boards[i];
    // '../../data/storyboards/Scene-2-SCENE-001-2-04SYK/images/board-2-FDMFD-reference.png';
    var frameIndex = 0;
    if (i < storyboader.boards.length-1){
        frameIndex = insertFrames(board.time, storyboader.boards[i+1].time);
    }else{
        frameIndex = insertFrames(board.time, board.time + board.duration);
    }
    
    setShot(board.shot, frameIndex);
    setAction(board.action?board.action:"", frameIndex);
    setCharacter(board.character?board.character:"", frameIndex);
    setComment(board.notes?board.notes:"", frameIndex);

    if (isEmptyStr(board.dialogue) == false){
        //createText(board.dialogue, _W/2, _H/2, frameIndex, board.shot )
        createText(board.dialogue, TEXT_LEFT, TEXT_TOP, frameIndex, board.shot )

    }
    if (board.url && board.url.length > 0){
        loadToLibrary(board.url);
        insertToStage(board.url, board.time, TEXT_LEFT, TEXT_TOP, frameIndex);
    }

    fl.trace(board.number);
    fl.trace(_INDENT+board.url);
    fl.trace(_INDENT+board.shot);
    fl.trace(_INDENT+board.time);
    fl.trace(_INDENT+board.duration);
    fl.trace(_INDENT+board.dialogue);
    fl.trace(_INDENT+board.action);
    fl.trace(_INDENT+board.character);
    fl.trace(_INDENT+board.notes);

}

