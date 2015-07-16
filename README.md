What is this?
======
TODO!

Usage
======
TODO!

Building from Source
======
To build, you need to have the latest [Node.js/npm](http://nodejs.org/download/) and [git](http://git-scm.com/downloads).

Clone a copy of the main frojs git repo (or your fork):
```bash
git clone git://github.com/McManning/frojs.git
```

Enter the frojs project diretory and load all necessary dependencies:
```bash
cd frojs && npm install
```

Install grunt command line interface as a global package:
```bash
npm install -g grunt-cli
```

Make sure you have grunt installed by testing:
```bash
grunt -V
```

To create the full build, just run:
```bash
grunt
```

The built version of frojs will be put into the `dist/` subdirectory, along with a minified copy and the associated map file. 

To auto-build frojs as you work, just run:
```bash
grunt watch
```

This will skip the minification process and only run the necessary jshint tasks. If no errors are found, all modules will be merged into a single `fro.js` script located in the `dist/` subdirectory.

Contributing
======
Since this is no longer one of my main projects, I'm open to pull requests but may be slow to respond. 

Documentation for current usage and formats is slowly being built up on the [wiki](https://github.com/McManning/frojs/wiki). Places I will most likely tackle next are described in the roadmap.

Roadmap
======
Roadmap is being tracked as [labeled tickets](https://github.com/McManning/frojs/labels/roadmap).

License
======

Copyright (C) 2015 Chase McManning <<cmcmanning@gmail.com>>

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
