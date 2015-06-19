What is this?
======
TODO!

Usage
======
TODO!

Roadmap
======
- Trash the old network code and switch to Socket.IO so we're no longer reinventing the wheel
- Add (probably as a separate project) a node.js implemention of the server. 
 - Original server was written in Tornado (4.2). We are going to switch over to something that is more friendly for Javascript developers to get their hands into. 
- Re-evaluate WebGL implementation. If it doesn't work on current browsers, make it work. 
- Look into completing the canvas renderer fallback, and whether or not it's even needed.
- Standardize the library structure a little more. Maybe with RequireJS
- **DOCUMENT EVERYTHING**. Network messages, world and entity data structures, avatar data structures, etc. 

License
======

Copyright (C) 2015 Chase McManning <cmcmanning@gmail.com>

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
