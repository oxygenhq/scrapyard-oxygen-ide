## Building

### Windows

Requirements:

* Node.js v0.12.x. Edit C:\Program Files\nodejs\node_modules\npm\npmrc 
```
prefix=C:\Program Files\nodejs\node_modules\npm
```
* NSIS 3.0b1 large strings build. SHould be added to the PATH.


Run `boostrap` to download and build all the required dependencies. This process must be re-ran if any of the decencies change.
Run `build dist` to produce the setup package.