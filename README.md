# Second Hand

Repo for a R&D experiment on real-time handtracking on the web using Google's Mediapipe solution. 



### Notes
At time of writing, only supporting WebGL2 supporting devices, due to Mediapipe support. Noted to support Safari (WebGL1) somewhere this year(2021).

**Trivia on MediaPipe**
- JS documentation is still quite barebones
- There are NPM packages
	- These packages are to be imported globally
	- You'll need to extract scripts from the package manually (@mediapipe/hands)
	- See `initMediaHands.js`
<!-- - `locatefile` will only execute when `.send({ image: videoElement })` has been called - feels nilly willy at times -->