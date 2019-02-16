const fs = require("fs");
const GPhoto = require("gphoto2");
const short = require("short-uuid");
const util = require("util");
const path = require("path");

const writeFile = util.promisify(fs.writeFile);

function makeMyCamera(camera) {
  let preview_listeners = [];

  const getConfig = util.promisify(camera.getConfig.bind(camera));
  const takePicture = util.promisify(camera.takePicture.bind(camera));

  const getPreview = listener => {
    if (!camera) {
      listen(new Error("Camera not connected"));
      return;
    }

    preview_listeners.push(listener);

    if (preview_listeners.length === 1) {
      start = Date.now();
      camera.takePicture({ preview: true }, (er, data) => {
        capture = Date.now();
        tmp = preview_listeners;
        preview_listeners = new Array();
        tmp.map(listener => listener(er, data));
      });
    }
  };

  const getPhoto = async photoStore => {
    try {
      const data = await takePicture({ download: true });
      const photoId = short.generate();
      const fileName = path.join(photoStore, photoId + ".jpg");
      await writeFile(fileName, data);
      console.log("Wrote file at " + fileName);
      return photoId;
    } catch (err) {
      throw new Error("Take photo error: " + err.message);
    }
  };

  return {
    getConfig,
    getPreview,
    getPhoto
  };
}

module.exports = function createCameraController() {
  const gphoto = new GPhoto.GPhoto2();

  function findCamera() {
    return new Promise((resolve, reject) => {
      gphoto.list(cameras => {
        console.log("Found " + cameras.length + " cameras");
        const camera = cameras.filter(camera =>
          camera.model.match(/(Sony)/)
        )[0];
        if (!camera) {
          reject(new Error("Camera not found"));
          return;
        }
        // retrieve available configuration settings
        console.log("loading " + camera.model + " settings");
        camera.getConfig((er, settings) => {
          if (er) {
            reject(new Error("Camera settings did not load: " + er.message));
            return;
          }
          console.log(
            "Battery:",
            settings.main.children.status.children.batterylevel.value
          );
          resolve(makeMyCamera(camera));
        });
      });
    });
  }

  return {
    findCamera
  };
};
