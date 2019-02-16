const path = require("path");
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const util = require("util");

const streamdeck = require("./streamdeck")();
const cameraController = require("./camera_controller")();

process.title = "node-gphoto2 test program";

const unlink = util.promisify(fs.unlink);
const copyFile = util.promisify(fs.copyFile);

const photoStore = path.resolve(__dirname, "./public/photos");
const spoolPath = path.resolve(__dirname, "./spool");

(async () => {
  const camera = await cameraController.findCamera();

  // Fetch a list of cameras and get the first one
  app = express();

  const expressWs = require("express-ws")(app);

  app.use(express.static(__dirname + "/public"));
  app.use(bodyParser.json());

  // get configuration
  app.get("/settings", async (req, res) => {
    try {
      const settings = await camera.getConfig();
      res.send(settings);
    } catch (err) {
      res.status(404).send("Camera error: " + err.message);
    }
  });

  app.ws("/echo", function(ws, req) {
    ws.binaryType = "arraybuffer";

    ws.send(JSON.stringify(clientState));

    ws.on("message", function(msg) {
      camera.getPreview((err, data) => {
        if (err) {
          console.log("Err: " + err.message);
        } else {
          if (ws.readyState === 1) {
            ws.send(data);
          }
        }
      });
    });
  });

  app.listen(process.env.PORT || 1337, "0.0.0.0");

  let clientState = { pausePreview: false };

  function tellClients(message) {
    Object.assign(clientState, message);
    for (let client of expressWs.getWss().clients) {
      if (client.readyState === 1) {
        client.send(JSON.stringify(clientState));
      }
    }
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  streamdeck.on("takephoto", async () => {
    if (clientState.takingPhoto) {
      console.log("Already taking photo, ignoring user input...");
      return;
    }
    streamdeck.setTakePhotoEnabled(false);
    streamdeck.clearEverythingThatAssumesAPreview();
    tellClients({
      status: "Photo in 3...",
      takingPhoto: true,
      photo: null,
      largePreview: false
    });
    await wait(1000);
    tellClients({ status: "Photo in 2..." });
    await wait(1000);
    tellClients({ status: "Photo in 1..." });
    await wait(1000);
    tellClients({ status: "Taking photo...", pausePreview: true });
    const photo = await camera.getPhoto(photoStore);
    tellClients({ status: "", takingPhoto: false, pausePreview: false, photo });
    streamdeck.setTakePhotoEnabled(true);
    streamdeck.showEverythingThatAssumesAPreview();
    await wait(120000);
    if (clientState.photo === photo) {
      streamdeck.clearEverythingThatAssumesAPreview();
      tellClients({ photo: null, largePreview: false });
    }
  });

  streamdeck.on("zoom", () => {
    if (clientState.largePreview) {
      tellClients({ largePreview: false });
    } else {
      tellClients({ largePreview: true });
    }
  });

  streamdeck.on("trash", async () => {
    const photo = clientState.photo;
    if (!photo) {
      tellClients({ status: "Can't delete :(" });
      return;
    }
    tellClients({ largePreview: false, photo: null, status: "Deleting..." });
    streamdeck.clearEverythingThatAssumesAPreview();
    streamdeck.setTakePhotoEnabled(false);
    try {
      await unlink(path.resolve(photoStore, photo + ".jpg"));
      tellClients({ largePreview: false, photo: null, status: "Deleted" });
    } catch (err) {
      tellClients({
        largePreview: false,
        photo: null,
        status: "Can't delete :("
      });
    }
    streamdeck.setTakePhotoEnabled(true);
    await wait(5000);
    if (clientState.status === "Deleted") {
      tellClients({ status: "" });
    }
  });

  streamdeck.on("print", async () => {
    const photo = clientState.photo;
    if (!photo) {
      tellClients({ status: "Can't print :(" });
      return;
    }
    tellClients({ status: "Printing..." });
    try {
      await copyFile(
        path.resolve(photoStore, photo + ".jpg"),
        path.resolve(spoolPath, photo + ".jpg")
      );
    } catch (err) {
      console.log("Can't copy file to spool directory:", err);
      tellClients({ status: "Can't print :(" });
      return;
    }
    if (clientState.photo === photo && clientState.status === "Printing...") {
      tellClients({ status: "Queued for printing..." });
      await wait(5000);
      if (
        clientState.photo === photo &&
        clientState.status === "Queued for printing..."
      ) {
        tellClients({ status: "" });
      }
    }
  });
})().catch(err => {
  console.error("Well, darn: ", err);
  process.exit();
  throw err;
});
