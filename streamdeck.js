const path = require("path");
const StreamDeck = require("elgato-stream-deck");

const events = require("events");

const cameraIcon = path.resolve(__dirname, "icons/camera.png");
const cameraDisabledIcon = path.resolve(__dirname, "icons/camera_disabled.png");
const showPreviewIcon = path.resolve(__dirname, "icons/large_preview.png");

const printIcon = path.resolve(__dirname, "icons/print.png");
const trashIcon = path.resolve(__dirname, "icons/trash.png");

function createToggleableButton(streamDeck, index, icon) {
  let state;

  async function enable(enabled) {
    if (state === enabled) {
      return;
    }
    state = enabled;
    if (enabled) {
      await streamDeck.fillImageFromFile(index, icon);
    } else {
      await streamDeck.clearKey(index);
    }
  }

  function isEnabled() {
    return state;
  }

  return {
    enable,
    isEnabled,
    keyIndex: index
  };
}

module.exports = function createStreamDeckUI() {
  const self = new events.EventEmitter();

  const myStreamDeck = new StreamDeck();

  let takePhotoEnabled;
  let largePreviewEnabled;

  let zoomButton = createToggleableButton(myStreamDeck, 4, showPreviewIcon);
  let printButton = createToggleableButton(myStreamDeck, 9, printIcon);
  let trashButton = createToggleableButton(myStreamDeck, 14, trashIcon);

  myStreamDeck.on("up", keyIndex => {
    if (keyIndex === 7 && takePhotoEnabled) {
      self.emit("takephoto");
    }
    if (keyIndex === zoomButton.keyIndex && zoomButton.isEnabled()) {
      self.emit("zoom");
    }
    if (keyIndex === printButton.keyIndex && printButton.isEnabled()) {
      self.emit("print");
    }
    if (keyIndex === trashButton.keyIndex && trashButton.isEnabled()) {
      self.emit("trash");
    }
  });

  myStreamDeck.on("error", error => {
    self.emit("error", error);
  });

  self.setTakePhotoEnabled = async function(enabled) {
    if (takePhotoEnabled === enabled) {
      return;
    }
    takePhotoEnabled = enabled;
    if (enabled) {
      await myStreamDeck.fillImageFromFile(7, cameraIcon);
    } else {
      await myStreamDeck.fillImageFromFile(7, cameraDisabledIcon);
    }
  };

  self.setZoomButtonEnabled = zoomButton.enable;
  self.setTrashButtonEnabled = trashButton.enable;
  self.setPrintButtonEnabled = printButton.enable;

  self.clearEverythingThatAssumesAPreview = async function() {
    await self.setZoomButtonEnabled(false);
    await self.setTrashButtonEnabled(false);
    await self.setPrintButtonEnabled(false);
  };

  self.showEverythingThatAssumesAPreview = async function() {
    await self.setZoomButtonEnabled(true);
    await self.setTrashButtonEnabled(true);
    await self.setPrintButtonEnabled(true);
  };

  myStreamDeck.clearAllKeys();
  self.setTakePhotoEnabled(true);
  self.clearEverythingThatAssumesAPreview();
  myStreamDeck.setBrightness(100);

  return self;
};
