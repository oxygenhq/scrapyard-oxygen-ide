## Building

### Windows

Requirements:

* Node.js v0.12.x.
* NSIS 3.0b1 large strings build. Should be added to the PATH.

Run `boostrap` to download and build the dependencies. This should be executed anytime dependencies change.  
Run `build dist` to produce the setup package.


In case of `Error: Failed to replace env in config: ${APPDATA}` during any of the steps, edit `C:\Program Files\nodejs\node_modules\npm\npmrc`
```
prefix=C:\Program Files\nodejs\node_modules\npm
```