var _INDENT    = "    ";
var TL         = fl.getDocumentDOM().getTimeline()
var _W         = fl.getDocumentDOM().width;
var _H         = fl.getDocumentDOM().height;
var _Margin    = 100;
var FPS        = fl.getDocumentDOM().frameRate;
//var _Time      = 1000;
var FONT_SIZE  = 80;  
var FONT_COLOR = '#CCCCCC';
var FONT_FACE  = 'MS-Gothic';
var TEXT_CENTER  = _W/2;
var TEXT_TOP   = _H -FONT_SIZE*2;
var useDynamicText = false;
                             
var Layers     = {};
var Images     = {}
var folderPath = null;

fl.runScript( scriptPath + '../libs/json2.js' );

function setFolderPath(path){
    folderPath = path;
}

function isEmptyStr(str){
	var trimmed = str.replace(/^\s+/,'').replace(/\s+$/,'');
	return str ==null|| trimmed.length==0;
}

function myReplace(str){
	return str.replace(new RegExp("<br>", "g"), "\n");
}

function init(layerName) {
    //Create Layer
    var index = TL.addNewLayer();
    TL.setLayerProperty('name', layerName);
    fl.trace(index + _INDENT+ layerName);
}

function setComment(comment, frameIndex){
    TL.setSelectedLayers(Layers["comment"].index);
    TL.setSelectedFrames(frameIndex, frameIndex + 1, true);
    TL.setFrameProperty('labelType', 'name');
    TL.setFrameProperty('name', comment);
}

function setCharacter(character, frameIndex){
    TL.setSelectedLayers(Layers["character"].index);
    TL.setSelectedFrames(frameIndex, frameIndex + 1, true);
    TL.setFrameProperty('labelType', 'name');
    TL.setFrameProperty('name', character);
}

function setShot(shotName, frameIndex){
    TL.setSelectedLayers(Layers["shot"].index);
    TL.setSelectedFrames(frameIndex, frameIndex + 1, true);
    TL.setFrameProperty('labelType', 'name');
    TL.setFrameProperty('name', shotName);
}

function createText(text, centerX, centerY, frameIndex, captionIndex){
    TL.setSelectedLayers(Layers["dialogue"].index);
    TL.setSelectedFrames(frameIndex, frameIndex + 1, true);
    fl.trace("createText");
        fl.trace(_INDENT + text);
    var l = centerX;
    var r = centerX+ text.length*FONT_SIZE;
    if ( r > _W ){
        r = _W;
        l = 0;
    }
    var t = centerY;
    var b = centerY + FONT_SIZE*2;
    if (b > _H){
        b = _H;
        t = 0;
    }
    var pos = {left:l, top:t, right: r, bottom:b}
    fl.trace(_INDENT + centerX + ","  + centerY + ", " + text.length*FONT_SIZE + "," + FONT_SIZE*2 );    

    aText = text.replace(new RegExp("\n", "g"), "\\n");
    var instanceName = ("caption" + captionIndex).replace(/\s/g, '');
    var symbolName   = ("caption" + captionIndex).replace(/\s/g, '');

    if (fl.getDocumentDOM().library.selectItem(symbolName)){
        fl.getDocumentDOM().library.addItemToDocument({x:centerX, y:centerY});
        
    }else{
        //Create Text        
        fl.getDocumentDOM().addNewText( {left:_Margin, top:centerY -5, right: _W-_Margin, bottom:centerY + FONT_SIZE*2+5});
        fl.getDocumentDOM().setTextRectangle({left:_Margin, top:centerY -5, right: _W-_Margin, bottom:centerY + FONT_SIZE*2+5});
        if (useDynamicText){
        fl.getDocumentDOM().setElementProperty('textType', 'dynamic');
        fl.getDocumentDOM().setElementProperty('name', 'srcText');
            fl.getDocumentDOM().setElementProperty('name', 'source');
        }else{
            fl.getDocumentDOM().setElementProperty('textType', 'static');
        }
        fl.getDocumentDOM().setFillColor(FONT_COLOR);        
        fl.getDocumentDOM().setElementProperty('autoExpand', false);
        fl.getDocumentDOM().setElementTextAttr('size', FONT_SIZE);
        fl.getDocumentDOM().setElementTextAttr('face', FONT_FACE);
        fl.getDocumentDOM().setElementTextAttr('alignment', "center");
        fl.getDocumentDOM().setTextString(text);
        var newMc = fl.getDocumentDOM().convertToSymbol("movie clip", symbolName, "top left");
    }
   
   fl.getDocumentDOM().selection[0].name = instanceName;
   //fl.getDocumentDOM().getTimeline().layers[Layers["dialogue"].index].frames[frameIndex].actionScript = instanceName + '.source.text = "'+ aText+'";'
 
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

function getLibraryName(name, num){
    var _name = name;
    var suffixNum = num;
    var items = fl.getDocumentDOM().library.items;
    for(var i=0;i<items.length;i++){
        var tmpItem = items[i];
        if( tmpItem.itemType == "folder" ) 
        {       
            if (tmpItem.name == _name){
                _name = _name + suffixNum;
                suffixNum = suffixNum + 1;
                return getLibraryName(_name, suffixNum);
            }
        }
    }
    return _name;
}
