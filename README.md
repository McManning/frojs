What is this?
======
Frojs is a 2D visual chatroom built using modern web technologies (including WebSockets and WebGL). Users on the same site can walk around a virtual world with a personalized avatar and chat or just hang out with others that share the same interests. The client is fully extendable with a simple plugin pattern, opening it up for more ways users can interact with worlds. 

For a simple demo, check out http://mcmanning.github.io/frojs/demo.html

Usage
======
If you want to get your own world up and running, check out the requirements and guides at http://mcmanning.github.io/frojs

Building from Source
======
*Note that this is not required for the average user. Only if you wish to contribute to the project*

To build, you need to have the latest [Node.js/npm](http://nodejs.org/download/) and [git](http://git-scm.com/downloads).

Clone a copy of the main frojs git repo (or your fork):
```bash
git clone git://github.com/McManning/frojs.git
```

Enter the frojs project directory and load all necessary dependencies:
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
I'm open to pull requests. If you have something more in mind, shoot me an email. 

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
