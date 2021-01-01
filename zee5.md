## Zee5 Player

### Features:
- Directly render HLS Player
- Free
- Can stream Premium Contents
- Serverless
- Can be deployed using Cloudflare Worker for free

### Usage:
*You can render Player in two methods 👇*

1. If <br><code>https://www.zee5.com/zee5originals/details/lalbazaar/0-6-2177/ep-1-sleepless-in-kolkata/0-1-manual_6a651ie4f1f0</code><br>
👆 this is the link <code>0-1-manual_6a651ie4f1f0</code> is the video id.<br>
**You can render a player like this <code>https://yourapp.example.workers.dev/0-1-manual_6a651ie4f1f0</code>**

2. Or you can render a Player using url parameter 👇<br>
<code>https://yourapp.example.workers.dev/?url=https://www.zee5.com/zee5originals/details/lalbazaar/0-6-2177/ep-1-sleepless-in-kolkata/0-1-manual_6a651ie4f1f0</code>

