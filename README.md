# Simple Wedding Photo Booth

See TODO.md, there might be important things there.

## Requirements

- node 8 (the streamdeck library does not work with node 10 yet :()
- a camera supported by gphoto2 (this code assumes a Sony one, and one that allows live previews)
- an elgato stream deck
- you are running on macOS

## Printing

You will need to set up an automator action that prints any files added to the `spool` directory.

## Running

1. Connect camera & enable PC Remote as the USB Connection mode
2. Connect Elgato Stream Deck
3. In a terminal, with node 8 action (I suggest using nvm, `nvm i 8`, `npm install`): `node server.js`
4. Open `http://localhost:1337/booth.html` (Chrome tested, probably works elsewhere, not tested because this is a giant hack)

## Acknowledgements

- See `package.json` for packages uses
- Emoji icons provided free by [EmojiOne](https://www.emojione.com/)
